// Routes every course through Valhalla pedestrian (fallback: BRouter hiking-beta),
// validates against the gate table, and writes tools/route-geom.json + tools/route-report.md.
//
// Usage:
//   node tools/build-routes.mjs            # (re)route everything, write route-geom.json + report
//   node tools/build-routes.mjs --verify    # validate an existing route-geom.json only, exit 1 on failure
import fs from 'node:fs';
import { encodePolyline, decodePolyline } from './lib-polyline.mjs';

const VERIFY_ONLY = process.argv.includes('--verify');
const inputArg = process.argv.find((a) => a.startsWith('--input='));
const RAW_PATH = new URL('./' + (inputArg ? inputArg.slice('--input='.length) : 'waypoints-raw.json'), import.meta.url);
const GEOM_PATH = new URL('./route-geom.json', import.meta.url);
const REPORT_PATH = new URL('./route-report.md', import.meta.url);

const SLEEP_MS = 1100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function haversine(a, b) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Detects the fabricated "V6 flat-loop extension" tail: last point = second-to-last + (~0.005 lat, ~0.002 lng)
function stripFakeTail(pts) {
  if (pts.length < 2) return { pts, stripped: false };
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  const dLat = b[0] - a[0], dLng = b[1] - a[1];
  if (Math.abs(dLat - 0.005) < 0.0006 && Math.abs(dLng - 0.002) < 0.0006) {
    return { pts: pts.slice(0, -1), stripped: true };
  }
  return { pts, stripped: false };
}

async function routeValhalla(pts) {
  const body = {
    locations: pts.map(([lat, lon]) => ({ lat, lon })),
    costing: 'pedestrian',
    units: 'kilometers',
  };
  const res = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('valhalla HTTP ' + res.status);
  const data = await res.json();
  if (!data.trip || !data.trip.legs) throw new Error('valhalla: no trip');
  const legs = data.trip.legs.map((l) => ({
    km: l.summary.length,
    shape: decodePolyline(l.shape, 6),
  }));
  return { engine: 'valhalla-pedestrian', totalKm: data.trip.summary.length, legs };
}

async function routeBRouter(pts) {
  const lonlats = pts.map(([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`).join('|');
  const url = `https://brouter.de/brouter?lonlats=${lonlats}&profile=hiking-beta&alternativeidx=0&format=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('brouter HTTP ' + res.status);
  const data = await res.json();
  const feat = data.features && data.features[0];
  if (!feat) throw new Error('brouter: no feature');
  const coords = feat.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
  const totalKm = (feat.properties['track-length'] ? Number(feat.properties['track-length']) / 1000 : null)
    ?? (() => { let s = 0; for (let i = 1; i < coords.length; i++) s += haversine(coords[i - 1], coords[i]); return s / 1000; })();
  // BRouter returns one combined line, not per-leg; approximate legs by nearest-point split is skipped (single leg).
  return { engine: 'brouter-hiking-beta', totalKm, legs: [{ km: totalKm, shape: coords }] };
}

// Returns { hard: [...], soft: [...] }. HARD issues block --verify (exit 1) — they mean the
// course is actually broken (wrong distance, no route, structurally duplicated). SOFT issues are
// printed in route-report.md for a human to skim but don't fail the build — they're often fine
// (e.g. a deliberate short out-and-back spur, or 4-decimal precision on an already-good point).
function evaluateGates(course, cleanedPts, routed, targetKm) {
  const hard = [], soft = [];
  // per-leg straight-distance sanity (0.3-1.8km) computed on the INPUT waypoints, not the routed shape
  for (let i = 1; i < cleanedPts.length; i++) {
    const d = haversine(cleanedPts[i - 1], cleanedPts[i]) / 1000;
    if (d < 0.15) soft.push(`leg ${i} too short (${d.toFixed(2)}km)`);
    if (d > 2.2) soft.push(`leg ${i} too long (${d.toFixed(2)}km) — needs an intermediate waypoint`);
  }
  // non-adjacent node revisit (8-shape / backtrack), unless start===end (loop)
  const isLoop = haversine(cleanedPts[0], cleanedPts[cleanedPts.length - 1]) < 30;
  for (let i = 0; i < cleanedPts.length; i++) {
    for (let j = i + 2; j < cleanedPts.length; j++) {
      if (isLoop && i === 0 && j === cleanedPts.length - 1) continue;
      if (j === i + 2 && haversine(cleanedPts[i], cleanedPts[j]) < 5) continue; // intentional out-and-back spur (A, spur, A)
      if (haversine(cleanedPts[i], cleanedPts[j]) < 80) {
        soft.push(`non-adjacent points ${i} & ${j} are within 80m (possible backtrack/figure-8)`);
      }
    }
  }
  // coordinate precision (>=4 decimals ~= 11m; below that risks landing on the wrong block/path)
  for (const p of cleanedPts) {
    for (const v of p) {
      const dec = (String(v).split('.')[1] || '').length;
      if (dec < 4) { soft.push(`coordinate ${p} has < 4 decimal places (~110m+ error)`); break; }
    }
  }
  // distance vs target — this is the one that actually matters: it directly re-detects the
  // original bug class (itinerary and map disagreeing on how far you walk).
  if (targetKm != null) {
    const ratio = routed.totalKm / targetKm;
    if (ratio < 0.90 || ratio > 1.10) {
      hard.push(`routed ${routed.totalKm.toFixed(2)}km vs target ${targetKm}km (ratio ${ratio.toFixed(2)}) — outside +/-10%`);
    } else if (ratio < 0.93 || ratio > 1.07) {
      soft.push(`routed ${routed.totalKm.toFixed(2)}km vs target ${targetKm}km (ratio ${ratio.toFixed(2)}) — outside the preferred +/-7% band`);
    }
  } else {
    hard.push('no target km parsed for this course — add a 歩行：約X.Xkm (or title (約X.Xkm)) label');
  }
  return { hard, soft };
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));

  // Target km lives in index.html's card text, not in the SERIES literal (extract-series.mjs
  // only pulls n/name/c/r). Merge it in from tools/targets.json (regenerate first if missing —
  // see tools/extract-targets.mjs) so course._targetKm is always available for the ratio gate.
  const targetsPath = new URL('./targets.json', import.meta.url);
  if (fs.existsSync(targetsPath)) {
    const targets = JSON.parse(fs.readFileSync(targetsPath, 'utf8'));
    for (const series of raw) for (const course of series.courses) {
      if (course._targetKm == null && targets[course.n] != null) course._targetKm = targets[course.n];
    }
  } else {
    console.warn('WARNING: tools/targets.json not found — run `node tools/extract-targets.mjs` first, or every course will fail the "no target km" gate.');
  }

  let geomOut = {};
  if (VERIFY_ONLY) {
    if (!fs.existsSync(GEOM_PATH)) { console.error('route-geom.json not found'); process.exit(1); }
    geomOut = JSON.parse(fs.readFileSync(GEOM_PATH, 'utf8'));
  }

  const rows = [];
  let anyFail = false;

  for (const series of raw) {
    for (const course of series.courses) {
      const { pts: cleaned, stripped } = stripFakeTail(course.r);
      let routed, engine, errMsg = null;

      if (VERIFY_ONLY) {
        const g = geomOut[course.n];
        if (!g) { rows.push({ n: course.n, name: course.name, ok: false, note: 'MISSING from route-geom.json' }); anyFail = true; continue; }
        routed = { totalKm: g.km, legs: [{ km: g.km, shape: decodePolyline(g.shape, 6) }] };
        engine = g.engine;
      } else {
        try {
          routed = await routeValhalla(cleaned);
          engine = routed.engine;
        } catch (e1) {
          try {
            await sleep(400);
            routed = await routeBRouter(cleaned);
            engine = routed.engine;
          } catch (e2) {
            errMsg = `valhalla: ${e1.message}; brouter: ${e2.message}`;
          }
        }
        await sleep(SLEEP_MS);
      }

      if (errMsg) {
        rows.push({ n: course.n, name: course.name, ok: false, note: 'ROUTING FAILED: ' + errMsg });
        anyFail = true;
        continue;
      }

      const targetKm = course._targetKm ?? null;
      const { hard, soft } = evaluateGates(course, cleaned, routed, targetKm);
      const ok = hard.length === 0;
      if (!ok) anyFail = true;

      rows.push({
        n: course.n, name: course.name, ok, engine,
        routedKm: routed.totalKm.toFixed(2), targetKm,
        strippedFakeTail: stripped, issues: hard, warnings: soft,
      });

      if (!VERIFY_ONLY) {
        // flatten legs into one shape for embedding
        let fullShape = [];
        routed.legs.forEach((l, i) => {
          fullShape = fullShape.concat(i === 0 ? l.shape : l.shape.slice(1));
        });
        geomOut[course.n] = {
          km: Number(routed.totalKm.toFixed(3)),
          legs: routed.legs.map((l) => Number(l.km.toFixed(3))),
          engine,
          shape: encodePolyline(fullShape, 6),
          built: new Date().toISOString().slice(0, 10),
        };
      }
      process.stdout.write(`${course.n}\t${ok ? 'OK' : 'FAIL'}\t${routed.totalKm.toFixed(2)}km\t${engine}\n`);
    }
  }

  if (!VERIFY_ONLY) {
    fs.writeFileSync(GEOM_PATH, JSON.stringify(geomOut, null, 0), 'utf8');
  }

  const passCount = rows.filter((r) => r.ok).length;
  const lines = ['# Route build report', '', `Generated: ${new Date().toISOString()}`,
    `Result: ${passCount}/${rows.length} passed (hard gates). Soft warnings are informational only.`, '',
    '| No. | 名称 | 判定 | 実測km | 目標km | エンジン | 偽延伸点除去 | 課題（HARD） | 参考（soft） |', '|---|---|---|---|---|---|---|---|---|'];
  for (const r of rows) {
    lines.push(`| ${r.n} | ${r.name || ''} | ${r.ok ? 'OK' : 'FAIL'} | ${r.routedKm ?? '-'} | ${r.targetKm ?? '?'} | ${r.engine ?? '-'} | ${r.strippedFakeTail ? 'YES' : ''} | ${(r.issues || [r.note]).filter(Boolean).join('; ')} | ${(r.warnings || []).join('; ')} |`);
  }
  fs.writeFileSync(REPORT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log('\nReport written to tools/route-report.md (' + passCount + '/' + rows.length + ' passed)');
  if (VERIFY_ONLY && anyFail) process.exit(1);
}

main();
