// No.7 高輪ゲートウェイ～品川: A=品川駅周辺の歩行（台場は入らない）、B=芝浦ふ頭経由で台場まで。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const takanawaGw = P('takanawa_gw', '高輪ゲートウェイ駅', 35.6354, 139.74066, 'OSM node 7502284289 station; exit pending');
const shinagawaHigh = P('shinagawa_high', '品川駅（高輪口）', 35.62832, 139.7377, 'OSM node 3938821105 品川駅高輪口');
const okido = P('takanawa_okido', '高輪大木戸跡', 35.64017, 139.74093, 'OSM node 31296890 高輪大木戸跡');
const sengakujiSt = P('sengakuji_st', '泉岳寺駅', 35.63972, 139.74035, 'OSM node 2270731393 泉岳寺駅（高輪大木戸跡側の出口）; 境内は拝観のため入らない');
const shinagawaSt = P('shinagawa_st', '品川駅（港南口）', 35.62867, 139.73917, 'OSM station node 品川（港南口側）');
const yatsuyama = P('yatsuyama', '八ツ山橋', 35.62487, 139.73825, 'OSM node 1304248741 八ツ山橋');
const kitaShinagawa = P('kita_shinagawa', '北品川', 35.62053, 139.74001, 'OSM node 1081989778 北品川');
const shinagawaJinja = P('shinagawa_jinja', '品川神社', 35.61837, 139.74066, 'OSM node 5336284605 品川神社');
const aomonoSt = P('aomono_st', '青物横丁駅', 35.61024, 139.74315, 'OSM node 1893803482 青物横丁駅');
const shibauraStation = P('shibaura_st', '芝浦ふ頭駅', 35.64173, 139.75777, 'OSM node 31252846 芝浦ふ頭');
const daiba = P('daiba', '台場（橋の台場側入口方面）', 35.63494, 139.76868, 'OSM node 31236584 台場; レインボーブリッジの台場口（スロープ・階段）の位置は利用者提供の情報で台場公園のすぐ横、座標は要確認');
const odaibaKaihin = P('odaiba_kaihin', 'お台場海浜公園駅前', 35.6294, 139.7747, 'OSM bus_stop お台場海浜公園駅前; station exit needs map review');
const variants = {
  standard: { points: [takanawaGw, sengakujiSt, okido, shinagawaHigh, shinagawaSt, yatsuyama, kitaShinagawa, shinagawaJinja, aomonoSt], label: 'A 高輪ゲートウェイ→泉岳寺駅→高輪大木戸→品川→北品川→品川神社→青物横丁駅' },
  extended: { points: [takanawaGw, shinagawaSt, shibauraStation, daiba, odaibaKaihin], label: 'B 高輪ゲートウェイ→品川→芝浦ふ頭→台場→お台場海浜公園駅前' },
};
const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway|secondary|primary';
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (p) => p.slice(1).reduce((s, v, i) => s + meters(p[i], v), 0);
const repeatedM = (p) => { const e = new Map(); for (let i = 1; i < p.length; i++) { const a = p[i - 1].map((n) => n.toFixed(5)).join(','), b = p[i].map((n) => n.toFixed(5)).join(','); if (a === b) continue; const k = a < b ? a + '|' + b : b + '|' + a; const v = e.get(k) || { c: 0, l: meters(p[i - 1], p[i]) }; v.c++; e.set(k, v); } return [...e.values()].reduce((s, v) => s + Math.max(0, v.c - 1) * v.l, 0); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const cache = path.join(root, 'data/research/no-7-walkway-snap.json');
let known = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : {};
async function snapAll(points) {
  const missing = [...new Map(points.filter((p) => !known[p.id]).map((p) => [p.id, p])).values()];
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => `way(around:70,${p.coord[0]},${p.coord[1]})["highway"~"^(${WALKWAY})$"];`).join('') + ');out geom;';
    let res;
    for (let i = 0; i < 3; i++) { res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) }); if (res.ok) break; await wait(20000); }
    if (!res.ok) throw new Error('Overpass ' + res.status);
    const ways = (await res.json()).elements.filter((e) => e.geometry);
    for (const p of missing) { let best = null; for (const w of ways) for (const v of w.geometry) { const d = meters(p.coord, [v.lat, v.lon]); if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id }; } known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId } : { snapped: null }; }
    fs.writeFileSync(cache, JSON.stringify(known, null, 1));
  }
  return (list) => list.map((p) => (known[p.id]?.snapped ? { ...p, original: p.coord, coord: known[p.id].snapped, movedToWalkwayM: known[p.id].movedM } : { ...p, original: p.coord, movedToWalkwayM: null }));
}
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error('Valhalla ' + res.status);
    const json = await res.json(); if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 200));
    legs.push(...json.trip.legs); await wait(1200);
  }
  const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
  return { shape, distanceM: lengthM(shape), engineM: legs.reduce((s, l) => s + l.summary.length * 1000, 0), legKm: legs.map((l) => l.summary.length) };
}
const out = { calculatedAt: new Date().toISOString(), variants: {} };
const snap = await snapAll(Object.values(variants).flatMap((v) => v.points));
for (const [key, v] of Object.entries(variants)) {
  v.points = snap(v.points);
  const r = await route(v.points);
  const rep = repeatedM(r.shape);
  const offsets = v.points.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  if (Math.abs(r.distanceM - r.engineM) > Math.max(30, r.distanceM * 0.02)) throw new Error('engine/shape mismatch');
  fs.writeFileSync(path.join(root, `data/candidates/no-7-${key}.geojson`), JSON.stringify({ type: 'Feature', id: `No.7-${key}-candidate`, properties: { courseId: 'No.7', variant: key, status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  out.variants[key] = { label: v.label, distanceM: Math.round(r.distanceM), engineDistanceM: Math.round(r.engineM), repeatedGeometryM: Math.round(rep), legKm: r.legKm.map((x) => Math.round(x * 100) / 100), stops: v.points.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, osmCentre: p.original, movedToWalkwayM: p.movedToWalkwayM, source: p.source, offsetM: Math.round(offsets[i]) })) };
  console.log(v.label, (r.distanceM / 1000).toFixed(2) + ' km', 'repeat ' + Math.round(rep) + ' m', 'legs ' + out.variants[key].legKm.join(' '), 'maxOffset ' + Math.round(Math.max(...offsets)));
}
fs.writeFileSync(path.join(root, 'data/research/no-7-route-build.json'), JSON.stringify(out, null, 2));
