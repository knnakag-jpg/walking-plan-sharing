// Elevation profiles via Valhalla pedestrian (same engine as build-routes.mjs).
// Reads route-geom.json keys (all courses) + waypoints-raw.json waypoints,
// requests elevation_interval:20, smooths (median3+ma5), writes elevation-out.json.
//
// Usage:
//   node tools/build-elevation.mjs                 # run all, skip ok:true entries (resume)
//   node tools/build-elevation.mjs --only=No.7,No.33
//   node tools/build-elevation.mjs --verify        # check output completeness, exit 1 on gap
import fs from 'node:fs';
import { decodePolyline } from './lib-polyline.mjs';

const VERIFY_ONLY = process.argv.includes('--verify');
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : null;

const GEOM_PATH = new URL('./route-geom.json', import.meta.url);
const RAW_PATH = new URL('./waypoints-raw.json', import.meta.url);
const OUT_PATH = new URL('./elevation-out.json', import.meta.url);

const SLEEP_MS = 1100;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

function haversine(a, b) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Same fake-tail rule as build-routes.mjs: last point = prev + (~0.005 lat, ~0.002 lng).
function stripFakeTail(pts) {
  if (pts.length < 2) return pts;
  const a = pts[pts.length - 2], b = pts[pts.length - 1];
  if (Math.abs((b[0] - a[0]) - 0.005) < 0.0006 && Math.abs((b[1] - a[1]) - 0.002) < 0.0006) {
    return pts.slice(0, -1);
  }
  return pts;
}

// Median-3 then moving-average-5 on the elevation series.
function smooth(z) {
  const n = z.length;
  const med = z.map((v, i) => {
    const w = [z[Math.max(0, i - 1)], v, z[Math.min(n - 1, i + 1)]].slice().sort((a, b) => a - b);
    return w[1];
  });
  return med.map((_, i) => {
    let s = 0, c = 0;
    for (let k = -2; k <= 2; k++) {
      const j = i + k;
      if (j >= 0 && j < n) { s += med[j]; c++; }
    }
    return s / c;
  });
}

// Demo server caps locations at 10 per request: split longer waypoint lists into
// overlapping chunks (shared endpoint) and concatenate the returned legs.
const MAX_LOCS = 10;
async function fetchElev(pts) {
  const chunks = [];
  for (let i = 0; i < pts.length; i += MAX_LOCS - 1) {
    chunks.push(pts.slice(i, i + MAX_LOCS));
    if (i + MAX_LOCS >= pts.length) break;
  }
  const post = async (body) => {
    const res = await fetch('https://valhalla1.openstreetmap.de/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('valhalla HTTP ' + res.status);
    return res.json();
  };
  const tryOnce = async (body) => {
    try {
      return await post(body);
    } catch (e) {
      await sleep(2000); // single retry
      return await post(body);
    }
  };
  const allLegs = [];
  for (const chunk of chunks) {
    const data = await tryOnce({
      locations: chunk.map(([lat, lon]) => ({ lat, lon })),
      costing: 'pedestrian',
      units: 'kilometers',
      elevation_interval: 20,
    });
    const legs = (data.trip && data.trip.legs) || [];
    if (!legs.length) throw new Error('no trip.legs in response');
    allLegs.push(...legs);
    if (chunks.length > 1) await sleep(400);
  }
  return allLegs;
}

// Build per-course metrics from combined shape coords + raw elevations.
function analyze(coords, elev) {
  const zs = smooth(elev);
  const n = coords.length;
  const cum = [0];
  for (let i = 1; i < n; i++) cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  const total = cum[n - 1];
  let climb = 0, descent = 0, up = 0, down = 0, flat = 0, upSteep = 0, downSteep = 0;
  let climbFirst = 0, descentFirst = 0, maxG = 0, maxSeg = 0;
  let mn = Infinity, mx = -Infinity;
  for (const z of zs) { if (z < mn) mn = z; if (z > mx) mx = z; }
  for (let i = 1; i < n; i++) {
    const dz = zs[i] - zs[i - 1];
    const h = haversine(coords[i - 1], coords[i]);
    if (h < 0.5) continue; // ignore near-duplicate points
    if (dz > 0) climb += dz; else descent -= dz;
    const g = (dz / h) * 100;
    if (Math.abs(g) > Math.abs(maxG)) { maxG = g; maxSeg = h; }
    if (g > 3) up += h; else if (g < -3) down += h; else flat += h;
    if (g > 8) upSteep += h;
    if (g < -8) downSteep += h;
    if (cum[i] <= total / 2) { if (dz > 0) climbFirst += dz; else descentFirst -= dz; }
  }
  // Chart profile, thinned to <= 700 points.
  let prof = cum.map((d, i) => ({ d: Math.round(d), z: r1(zs[i]) }));
  if (prof.length > 700) {
    const stride = Math.ceil(prof.length / 700);
    prof = prof.filter((_, i) => i % stride === 0 || i === prof.length - 1);
  }
  return {
    climb_m: r1(climb), descent_m: r1(descent),
    climb_first_m: r1(climbFirst), descent_first_m: r1(descentFirst),
    min_m: r1(mn), max_m: r1(mx),
    max_grade_pct: [r1(maxG), Math.round(maxSeg)],
    up_km: r2(up / 1000), down_km: r2(down / 1000), flat_km: r2(flat / 1000),
    up_steep_km: r2(upSteep / 1000), down_steep_km: r2(downSteep / 1000),
    profile: prof,
  };
}

// Elevation samples come back at fixed distance steps (elevation_interval, 20m),
// NOT per shape vertex: interpolate a position along the leg shape for each sample.
function legSamples(shape, elev, interval) {
  const cum = [0];
  for (let i = 1; i < shape.length; i++) cum.push(cum[i - 1] + haversine(shape[i - 1], shape[i]));
  const total = cum[cum.length - 1];
  let seg = 0;
  const at = (d) => {
    while (seg < cum.length - 2 && cum[seg + 1] < d) seg++;
    const a = cum[seg], b = cum[seg + 1];
    const t = b > a ? Math.min(1, Math.max(0, (d - a) / (b - a))) : 0;
    return [shape[seg][0] + (shape[seg + 1][0] - shape[seg][0]) * t,
      shape[seg][1] + (shape[seg + 1][1] - shape[seg][1]) * t];
  };
  return elev.map((z, j) => ({ p: at(Math.min(j * interval, total)), z }));
}

function loadOut() {
  if (!fs.existsSync(OUT_PATH)) {
    return { _meta: { generated: new Date().toISOString(), engine: 'valhalla-pedestrian', interval_m: 20, smoothing: 'median3+ma5' }, courses: {} };
  }
  return JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
}

function saveOut(out) {
  out._meta.generated = new Date().toISOString();
  fs.writeFileSync(OUT_PATH, JSON.stringify(out), 'utf8');
}

async function main() {
  const geom = JSON.parse(fs.readFileSync(GEOM_PATH, 'utf8'));
  const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
  const byN = new Map();
  for (const series of raw) for (const c of series.courses) byN.set(c.n, c.r);

  let keys = Object.keys(geom);
  if (ONLY) keys = keys.filter((k) => ONLY.includes(k));
  if (ONLY && keys.length === 0) { console.error('no matching courses for --only=' + ONLY.join(',')); process.exit(1); }

  if (VERIFY_ONLY) {
    if (!fs.existsSync(OUT_PATH)) { console.error('elevation-out.json not found'); process.exit(1); }
    const out = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    const missing = [];
    for (const k of Object.keys(geom)) {
      const e = out.courses && out.courses[k];
      if (!e || e.ok !== true || !Array.isArray(e.profile) || e.profile.length < 3 ||
        typeof e.climb_m !== 'number' || typeof e.descent_m !== 'number') {
        missing.push(k);
      }
    }
    if (missing.length) { console.error('INCOMPLETE: ' + missing.join(', ')); process.exit(1); }
    console.log(`elevation verify OK: ${Object.keys(geom).length}/${Object.keys(geom).length} courses`);
    return;
  }

  const out = loadOut();
  for (const key of keys) {
    const prev = out.courses[key];
    if (prev && prev.ok === true) { console.log(`${key}\tskip (ok)`); continue; }
    const waypoints = byN.get(key);
    if (!waypoints) {
      out.courses[key] = { ok: false, error: 'no waypoints in waypoints-raw.json' };
      saveOut(out);
      continue;
    }
    const pts = stripFakeTail(waypoints);
    try {
      const legs = await fetchElev(pts);
      if (!legs.length) throw new Error('no trip.legs in response');
      // Combine per-leg 20m samples; a leg without a usable elevation array is null (excluded).
      let coords = [], elev = [];
      const legInfo = [];
      for (const l of legs) {
        const shape = decodePolyline(l.shape, 6);
        const okLen = Array.isArray(l.elevation) && l.elevation.length >= 2 && shape.length >= 2;
        legInfo.push({ km: r2(l.summary ? l.summary.length : 0), points: Array.isArray(l.elevation) ? l.elevation.length : 0, elev_ok: okLen });
        if (!okLen) continue;
        const s = legSamples(shape, l.elevation, l.elevation_interval || 20);
        const ps = s.map((e) => e.p), zs = s.map((e) => e.z);
        coords = coords.concat(coords.length ? ps.slice(1) : ps);
        elev = elev.concat(elev.length ? zs.slice(1) : zs);
      }
      if (coords.length < 3 || elev.length < 3) throw new Error('elevation unusable (mismatched lengths)');
      const m = analyze(coords, elev);
      const loop = haversine(pts[0], pts[pts.length - 1]) < 30;
      out.courses[key] = { ok: true, ...m, loop, legs: legInfo };
      console.log(`${key}\tOK\tclimb ${m.climb_m}m\tdesc ${m.descent_m}m\tpts ${m.profile.length}`);
    } catch (e) {
      out.courses[key] = { ok: false, error: String(e.message || e) };
      console.log(`${key}\tFAIL\t${e.message}`);
    }
    saveOut(out); // incremental write so an interrupt can resume
    await sleep(SLEEP_MS);
  }
  const okN = keys.filter((k) => out.courses[k] && out.courses[k].ok).length;
  console.log(`\nDone: ${okN}/${keys.length} ok (this run scope)`);
}

main();
