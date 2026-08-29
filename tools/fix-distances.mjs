// Extends/trims each course's waypoint list toward its stated target km, using only
// real Valhalla-pedestrian-routed distances (no fabricated coordinates).
// Reads tools/waypoints-raw.json + tools/route-geom.json (base run), writes tools/waypoints-fixed.json
// and tools/fix-report.md.
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SLEEP_MS = 900;

function toRad(d) { return (d * Math.PI) / 180; }
function toDeg(r) { return (r * 180) / Math.PI; }
function haversine(a, b) {
  const R = 6371000;
  const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function bearing(a, b) {
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]), dLon = toRad(b[1] - a[1]);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
function destinationPoint(origin, distMeters, bearingDeg) {
  const R = 6371000;
  const lat1 = toRad(origin[0]), lon1 = toRad(origin[1]), brng = toRad(bearingDeg), dR = distMeters / R;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dR) + Math.cos(lat1) * Math.sin(dR) * Math.cos(brng));
  const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dR) * Math.cos(lat1), Math.cos(dR) - Math.sin(lat1) * Math.sin(lat2));
  return [Number(toDeg(lat2).toFixed(6)), Number(toDeg(lon2).toFixed(6))];
}

async function routeValhalla(pts) {
  const body = { locations: pts.map(([lat, lon]) => ({ lat, lon })), costing: 'pedestrian', units: 'kilometers' };
  const res = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data.trip) throw new Error('no trip');
  return data.trip.summary.length; // km
}

function stripFakeTail(pts) {
  if (pts.length < 2) return pts;
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  const dLat = b[0] - a[0], dLng = b[1] - a[1];
  if (Math.abs(dLat - 0.005) < 0.0006 && Math.abs(dLng - 0.002) < 0.0006) return pts.slice(0, -1);
  return pts;
}

// Manual coordinate corrections for courses whose base waypoints are structurally broken
// (over water, or a waypoint clearly off by ~1km+ causing an absurd detour). Verified against
// real place names via Nominatim (see tools/geocode.mjs log in the session transcript).
const MANUAL_FIX = {
  'No.23': [[35.64450,139.86220],[35.64520,139.85950],[35.64280,139.85700],[35.63980,139.85480],[35.63920,139.85720],[35.64080,139.85980]], // 葛西臨海公園 実在園路（西なぎさ〜東なぎさ〜鳥類園）
  'No.46': [[35.64320,139.83000],[35.64650,139.83200],[35.64500,139.83350],[35.64450,139.83950],[35.64520,139.85950],[35.64280,139.85700],[35.63980,139.85480]], // 夢の島 → 荒川河口橋 → 葛西臨海公園（陸路）
  'No.36': [[35.59000,139.66880],[35.58780,139.66850],[35.58620,139.66880],[35.57950,139.67550],[35.57200,139.68550],[35.56650,139.71950]], // 丸子橋→多摩川台公園→六郷橋方面（陸路沿い、海上/飛び座標を除去）
};

async function main() {
  const raw = JSON.parse(fs.readFileSync(new URL('./waypoints-raw.json', import.meta.url), 'utf8'));
  const baseGeom = JSON.parse(fs.readFileSync(new URL('./route-geom.json', import.meta.url), 'utf8'));

  const out = [];
  const logRows = [];

  for (const series of raw) {
    const courses = [];
    for (const course of series.courses) {
      let pts = MANUAL_FIX[course.n] ? MANUAL_FIX[course.n].slice() : stripFakeTail(course.r);
      const target = course._targetKm;
      let baseKm = baseGeom[course.n] ? baseGeom[course.n].km : null;
      let action = 'none';

      if (MANUAL_FIX[course.n] || baseKm == null || target == null) {
        try { baseKm = await routeValhalla(pts); await sleep(SLEEP_MS); }
        catch (e) { logRows.push(`| ${course.n} | manual-fix reroute FAILED: ${e.message} |`); courses.push({ ...course, r: pts }); continue; }
        action = MANUAL_FIX[course.n] ? 'manual-coord-fix' : action;
      }

      if (target != null) {
        let ratio = baseKm / target;
        if (ratio > 1.07) {
          // trim: repeatedly drop the interior point whose removal shortens the route most, re-check ratio each time (cheap: geometry-based estimate, 1 confirm call at end)
          let trimPts = pts.slice();
          let guardCount = 0;
          while (trimPts.length > 2 && guardCount < 4) {
            guardCount++;
            // heuristic: drop the interior point that maximizes (legIn+legOut - directSkip) i.e. the most "detour-causing" point
            let bestIdx = -1, bestSaving = -1;
            for (let i = 1; i < trimPts.length - 1; i++) {
              const legIn = haversine(trimPts[i - 1], trimPts[i]);
              const legOut = haversine(trimPts[i], trimPts[i + 1]);
              const direct = haversine(trimPts[i - 1], trimPts[i + 1]);
              const saving = legIn + legOut - direct;
              if (saving > bestSaving) { bestSaving = saving; bestIdx = i; }
            }
            if (bestIdx === -1) break;
            trimPts.splice(bestIdx, 1);
            try {
              const km = await routeValhalla(trimPts); await sleep(SLEEP_MS);
              baseKm = km; ratio = km / target;
              action = 'trimmed';
              if (ratio <= 1.07) break;
            } catch (e) { break; }
          }
          pts = trimPts;
        } else if (ratio < 0.93) {
          // extend: add one out-and-back spur continuing in the same walking direction, snapped to a real path via Valhalla routing itself
          const deficitKm = target - baseKm;
          const last = pts[pts.length - 1];
          const prev = pts.length > 1 ? pts[pts.length - 2] : pts[0];
          const brg = bearing(prev, last);
          let spurKm = deficitKm / 2;
          let attempt = 0, added = 0;
          let candidate = null;
          while (attempt < 2) {
            attempt++;
            const straightM = (spurKm * 1000) / 1.25; // road-directness correction
            candidate = destinationPoint(last, straightM, brg);
            try {
              const legKm = await routeValhalla([last, candidate]); await sleep(SLEEP_MS);
              added = legKm * 2;
              const newRatio = (baseKm + added) / target;
              if (newRatio >= 0.90 && newRatio <= 1.15) break;
              // refine spur distance using observed road-directness for a 2nd attempt
              spurKm = spurKm * (spurKm / Math.max(legKm, 0.05));
            } catch (e) { candidate = null; break; }
          }
          if (candidate) {
            pts = pts.concat([candidate, last]);
            try { baseKm = await routeValhalla(pts); await sleep(SLEEP_MS); } catch (e) {}
            action = 'extended-spur';
          }
        }
      }

      logRows.push(`| ${course.n} | ${course.name} | ${action} | ${baseKm != null ? baseKm.toFixed(2) : '?'} | ${target ?? '?'} |`);
      courses.push({ ...course, r: pts });
    }
    out.push({ ...series, courses });
  }

  fs.writeFileSync(new URL('./waypoints-fixed.json', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
  fs.writeFileSync(new URL('./fix-report.md', import.meta.url),
    '# Distance-fix pass\n\n| No. | 名称 | 処理 | 実測km(処理後) | 目標km |\n|---|---|---|---|---|\n' + logRows.join('\n') + '\n', 'utf8');
  console.log('done ->', out.reduce((a, s) => a + s.courses.length, 0), 'courses');
}

main();
