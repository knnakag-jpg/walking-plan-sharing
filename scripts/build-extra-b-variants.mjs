// No.17 / No.23 の B 案：終点を別の駅へ抜ける（実在の OSM 地点のみ）。既存Aの停車地は試作ビルドから再利用する。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const reuse = (build, key, ids) => ids.map((id) => { const s = rd(build).variants[key].stops.find((x) => x.id === id); if (!s) throw new Error('no stop ' + id); return { id: s.id, label: s.label, coord: s.coord, source: s.source, preSnapped: true }; });
const b23 = 'data/research/no-23-route-build.json';
const b17 = 'data/research/no-17-route-build.json';
const jobs = {
  'no-23': { courseId: 'No.23', variant: 'extended', label: 'B 葛西臨海公園駅→…→鳥類園→葛西駅（隣駅へ抜ける）', points: [...reuse(b23, 'no_sogo', ['kasai_station', 'ferris', 'shiokaze', 'nishinagisa', 'crystal', 'aquarium', 'bird']), P('kasai_st', '葛西駅', 35.66363, 139.87269, 'OSM node 1923746881 station')] },
  'no-17': { courseId: 'No.17', variant: 'extended', label: 'B 神谷町駅→東京タワー→増上寺→芝公園→愛宕神社→虎ノ門ヒルズ駅', points: [...reuse(b17, 'through', ['kamiyacho_cross', 'tower_road', 'zojoji']), P('shiba_park2', '芝公園（園内）', 35.65557, 139.75027, 'OSM way 745301120 park centre'), P('atago', '愛宕神社', 35.66463, 139.7494, 'OSM node 4740994270 愛宕神社'), P('toranomon_hills', '虎ノ門ヒルズ駅', 35.66747, 139.74776, 'OSM node 7786715973 station')] },
};
const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway';
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (p) => p.slice(1).reduce((s, v, i) => s + meters(p[i], v), 0);
const repeatedM = (p) => { const e = new Map(); for (let i = 1; i < p.length; i++) { const a = p[i - 1].map((n) => n.toFixed(5)).join(','), b = p[i].map((n) => n.toFixed(5)).join(','); if (a === b) continue; const k = a < b ? a + '|' + b : b + '|' + a; const v = e.get(k) || { c: 0, l: meters(p[i - 1], p[i]) }; v.c++; e.set(k, v); } return [...e.values()].reduce((s, v) => s + Math.max(0, v.c - 1) * v.l, 0); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function snapNew(points) {
  const todo = points.filter((p) => !p.preSnapped);
  const q = '[out:json][timeout:60];(' + todo.map((p) => `way(around:70,${p.coord[0]},${p.coord[1]})["highway"~"^(${WALKWAY})$"];`).join('') + ');out geom;';
  let res;
  for (let i = 0; i < 3; i++) { res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) }); if (res.ok) break; await wait(20000); }
  if (!res.ok) throw new Error('Overpass ' + res.status);
  const ways = (await res.json()).elements.filter((e) => e.geometry);
  return points.map((p) => { if (p.preSnapped) return p; let best = null; for (const w of ways) for (const v of w.geometry) { const d = meters(p.coord, [v.lat, v.lon]); if (d <= 70 && (!best || d < best.d)) best = { d, c: [v.lat, v.lon] }; } return best ? { ...p, original: p.coord, coord: best.c, movedM: Math.round(best.d) } : p; });
}
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error('Valhalla ' + res.status);
    const json = await res.json();
    if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 200));
    legs.push(...json.trip.legs); await wait(1200);
  }
  const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
  return { shape, distanceM: lengthM(shape), engineM: legs.reduce((s, l) => s + l.summary.length * 1000, 0), legKm: legs.map((l) => l.summary.length) };
}
const only = process.argv[2];
for (const [key, job] of Object.entries(jobs)) {
  if (only && only !== key) continue;
  const pts = await snapNew(job.points);
  const r = await route(pts);
  const rep = repeatedM(r.shape);
  const offsets = pts.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  const calculatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(root, `data/candidates/${key}-extra-b.geojson`), JSON.stringify({ type: 'Feature', id: `${job.courseId}-extra-b`, properties: { courseId: job.courseId, variant: 'extended', status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  fs.writeFileSync(path.join(root, `data/research/${key}-extra-b-build.json`), JSON.stringify({ calculatedAt, label: job.label, distanceM: Math.round(r.distanceM), engineDistanceM: Math.round(r.engineM), repeatedGeometryM: Math.round(rep), legKm: r.legKm.map((v) => Math.round(v * 100) / 100), stops: pts.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, source: p.source, offsetM: Math.round(offsets[i]) })) }, null, 2));
  console.log(job.label, (r.distanceM / 1000).toFixed(2) + ' km', 'repeat ' + Math.round(rep) + ' m', 'legs ' + r.legKm.map((v) => v.toFixed(2)).join(' '), 'maxOffset ' + Math.round(Math.max(...offsets)));
}
