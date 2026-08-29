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

// Extend with a bounded acceptance band per round so a single spur can't blow past the gate.
async function extendBounded(basePts, baseKm, target) {
  let pts = basePts.slice(), km = baseKm;
  for (let round = 0; round < 4 && km / target < 0.93; round++) {
    const deficitKm = target - km;
    const last = pts[pts.length - 1];
    const prev = pts.length > 1 ? pts[pts.length - 2] : pts[0];
    const brg = bearing(prev, last) + round * 40;
    let spurKm = Math.min(deficitKm / 2, 2.2); // cap a single spur leg
    let accepted = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const straightM = (spurKm * 1000) / 1.25;
      const candidate = destinationPoint(last, straightM, brg);
      try {
        const legKm = await routeValhalla([last, candidate]); await sleep(SLEEP_MS);
        const newRatio = (km + legKm * 2) / target;
        if (newRatio <= 1.15) { accepted = candidate; break; }
        spurKm = spurKm * 0.6; // overshoot -> try shorter
      } catch (e) { break; }
    }
    if (!accepted) continue;
    const trial = pts.concat([accepted, last]);
    try { const newKm = await routeValhalla(trial); await sleep(SLEEP_MS); pts = trial; km = newKm; }
    catch (e) { /* keep prior */ }
  }
  return { pts, km };
}

async function trimBounded(basePts, baseKm, target) {
  let pts = basePts.slice(), km = baseKm;
  let guard = 0;
  while (pts.length > 2 && km / target > 1.07 && guard < 5) {
    guard++;
    let bestIdx = -1, bestSaving = -1;
    for (let i = 1; i < pts.length - 1; i++) {
      const saving = haversine(pts[i - 1], pts[i]) + haversine(pts[i], pts[i + 1]) - haversine(pts[i - 1], pts[i + 1]);
      if (saving > bestSaving) { bestSaving = saving; bestIdx = i; }
    }
    if (bestIdx === -1) break;
    const trial = pts.slice(); trial.splice(bestIdx, 1);
    try {
      const newKm = await routeValhalla(trial); await sleep(SLEEP_MS);
      if (newKm / target < 0.90) break; // would overshoot down too far — stop, leave slightly over instead
      pts = trial; km = newKm;
    } catch (e) { break; }
  }
  return { pts, km };
}

const JOBS = [
  { n: 'No.17', mode: 'reset', base: [[35.66147,139.74083],[35.65845,139.74554],[35.66031,139.75004],[35.66497,139.73885]] },
  { n: 'No.23', mode: 'reset', base: [[35.64468,139.86085],[35.64066,139.86205]] },
  { n: 'No.34', mode: 'current' },
  { n: 'No.46', mode: 'current' },
  { n: 'S5', mode: 'current' },
  { n: 'S7', mode: 'current' },
  { n: 'Z5', mode: 'current' },
];

async function main() {
  const fixedPath = new URL('./waypoints-fixed.json', import.meta.url);
  const raw = JSON.parse(fs.readFileSync(fixedPath, 'utf8'));
  const byName = new Map();
  for (const s of raw) for (const c of s.courses) byName.set(c.n, c);

  for (const job of JOBS) {
    const course = byName.get(job.n);
    const target = course._targetKm;
    let pts = job.mode === 'reset' ? job.base : course.r;
    let km;
    try { km = await routeValhalla(pts); await sleep(SLEEP_MS); }
    catch (e) { console.log(job.n, 'BASE FAILED', e.message); continue; }

    let result = { pts, km };
    if (km / target > 1.07) result = await trimBounded(pts, km, target);
    else if (km / target < 0.93) result = await extendBounded(pts, km, target);

    course.r = result.pts;
    console.log(job.n, result.km.toFixed(2) + 'km', '/', target + 'km', 'ratio', (result.km / target).toFixed(2));
  }

  fs.writeFileSync(fixedPath, JSON.stringify(raw, null, 2), 'utf8');
  console.log('saved');
}
main();
