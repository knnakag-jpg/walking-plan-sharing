// Re-fixes a specific set of courses in tools/waypoints-fixed.json (targeted follow-up after
// the bulk fix-distances.mjs pass revealed a few failures/near-misses). Same algorithm as
// fix-distances.mjs, applied only to COURSE_KEYS.
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
  return data.trip.summary.length;
}

async function extendToTarget(basePts, baseKm, target) {
  let pts = basePts.slice();
  let km = baseKm;
  for (let round = 0; round < 3 && km / target < 0.93; round++) {
    const deficitKm = target - km;
    const last = pts[pts.length - 1];
    const prev = pts.length > 1 ? pts[pts.length - 2] : pts[0];
    const brg = bearing(prev, last);
    let spurKm = deficitKm / 2;
    let candidate = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const straightM = (spurKm * 1000) / 1.25;
      candidate = destinationPoint(last, straightM, brg + round * 35);
      try {
        const legKm = await routeValhalla([last, candidate]); await sleep(SLEEP_MS);
        const added = legKm * 2;
        if ((km + added) / target >= 0.90) break;
        spurKm = spurKm * (spurKm / Math.max(legKm, 0.05));
      } catch (e) { candidate = null; break; }
    }
    if (!candidate) break;
    pts = pts.concat([candidate, last]);
    try { km = await routeValhalla(pts); await sleep(SLEEP_MS); } catch (e) { break; }
  }
  return { pts, km };
}

async function trimToTarget(basePts, baseKm, target) {
  let pts = basePts.slice();
  let km = baseKm;
  let guard = 0;
  while (pts.length > 2 && km / target > 1.07 && guard < 5) {
    guard++;
    let bestIdx = -1, bestSaving = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const legIn = haversine(pts[i - 1], pts[i]);
      const legOut = haversine(pts[i], pts[i + 1]);
      const direct = haversine(pts[i - 1], pts[i + 1]);
      const saving = legIn + legOut - direct;
      if (saving > bestSaving) { bestSaving = saving; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    pts.splice(bestIdx, 1);
    try { km = await routeValhalla(pts); await sleep(SLEEP_MS); } catch (e) { break; }
  }
  return { pts, km };
}

const OVERRIDE_BASE = {
  'No.23': [[35.64468,139.86085],[35.64066,139.86205]],
  'No.46': [[35.65109,139.82796],[35.64066,139.86205]],
  'No.17': [[35.66060,139.74080],[35.65900,139.74250],[35.65800,139.74450],[35.65750,139.74650],[35.65820,139.74800]], // 麻布台ヒルズ→東京タワー方面（水域座標なし、実在道路のみ）
};
const TRIM_ONLY = ['No.34', 'Z5', 'S5', 'S7'];

async function main() {
  const fixedPath = new URL('./waypoints-fixed.json', import.meta.url);
  const raw = JSON.parse(fs.readFileSync(fixedPath, 'utf8'));
  const rows = [];

  for (const series of raw) {
    for (const course of series.courses) {
      const target = course._targetKm;
      let touched = false;

      if (OVERRIDE_BASE[course.n]) {
        touched = true;
        let base = OVERRIDE_BASE[course.n];
        let baseKm;
        try { baseKm = await routeValhalla(base); await sleep(SLEEP_MS); }
        catch (e) { rows.push(`${course.n}\tBASE ROUTE FAILED: ${e.message}`); continue; }
        const { pts, km } = await extendToTarget(base, baseKm, target);
        course.r = pts;
        rows.push(`${course.n}\toverride+extend\t${km.toFixed(2)}km / ${target}km`);
      } else if (TRIM_ONLY.includes(course.n)) {
        touched = true;
        let baseKm;
        try { baseKm = await routeValhalla(course.r); await sleep(SLEEP_MS); }
        catch (e) { rows.push(`${course.n}\tREROUTE FAILED: ${e.message}`); continue; }
        const { pts, km } = await trimToTarget(course.r, baseKm, target);
        course.r = pts;
        rows.push(`${course.n}\ttrim\t${km.toFixed(2)}km / ${target}km`);
      }
      if (touched) console.log(rows[rows.length - 1]);
    }
  }

  fs.writeFileSync(fixedPath, JSON.stringify(raw, null, 2), 'utf8');
  console.log('patched waypoints-fixed.json');
}

main();
