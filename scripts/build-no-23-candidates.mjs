// No.23 葛西臨海公園: one-stroke loop candidates from named OSM points.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const station = P('kasai_station', '葛西臨海公園駅', 35.64382, 139.86263, 'OSM node 7249081833');
const ferris = P('ferris', 'ダイヤと花の大観覧車', 35.64394, 139.85725, 'OSM way 161931777 centre');
const shiokaze = P('shiokaze', '汐風の広場', 35.64062, 139.85677, 'OSM way 693987764 centre');
const nishinagisa = P('nishinagisa', '西なぎさ', 35.6377, 139.8543, 'OSM relation 9644979 centre');
const crystal = P('crystal', 'クリスタルビュー', 35.6406, 139.85959, 'OSM way 161731857 centre');
const aquarium = P('aquarium', '葛西臨海水族園', 35.64078, 139.86195, 'OSM way 191044572 centre');
const bird = P('bird', '鳥類園ウォッチングセンター', 35.63983, 139.86557, 'OSM way 156492882 centre');
const sogo = P('sogo', '総合レクリエーション公園（フラワーガーデン側）', 35.65033, 139.87423, 'OSM way 154151038 centre');
const sogoN = P('sogo_n', '総合レクリエーション公園（北側）', 35.66047, 139.85806, 'OSM way 258039003 centre');
const variants = {
  no_sogo: { label: 'A 総合レクリエーション公園を外す：駅→観覧車→汐風→西なぎさ→クリスタル→水族園→鳥類園→駅', points: [station, ferris, shiokaze, nishinagisa, crystal, aquarium, bird, station] },
  no_sogo_counter: { label: 'B 同・逆回り', points: [station, bird, aquarium, crystal, nishinagisa, shiokaze, ferris, station] },
};

const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway';
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (pts) => pts.slice(1).reduce((s, v, i) => s + meters(pts[i], v), 0);
const repeatedM = (pts) => {
  const e = new Map();
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1].map((n) => n.toFixed(5)).join(',');
    const b = pts[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const k = a < b ? a + '|' + b : b + '|' + a;
    const v = e.get(k) || { c: 0, l: meters(pts[i - 1], pts[i]) };
    v.c++;
    e.set(k, v);
  }
  return [...e.values()].reduce((s, v) => s + Math.max(0, v.c - 1) * v.l, 0);
};
async function snapAll(points) {
  const cache = path.join(root, 'data/research/no-23-walkway-snap.json');
  let known = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : {};
  const missing = points.filter((p) => !known[p.id]);
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => 'way(around:70,' + p.coord[0] + ',' + p.coord[1] + ')["highway"~"^(' + WALKWAY + ')$"];').join('') + ');out geom;';
    let res;
    for (let i = 0; i < 3; i++) {
      res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
      if (res.ok) break;
      await new Promise((r) => setTimeout(r, 20000));
    }
    if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
    const ways = (await res.json()).elements.filter((e) => e.geometry);
    for (const p of missing) {
      let best = null;
      for (const w of ways) for (const v of w.geometry) {
        const d = meters(p.coord, [v.lat, v.lon]);
        if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id, highway: w.tags?.highway };
      }
      known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId, highway: best.highway } : { snapped: null };
    }
    fs.writeFileSync(cache, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', ...known }, null, 1));
    known = JSON.parse(fs.readFileSync(cache, 'utf8'));
  }
  return (list) => list.map((p) => {
    const k = known[p.id];
    return k?.snapped ? { ...p, coord: k.snapped, original: p.coord, snap: k } : { ...p, original: p.coord, snap: { snapped: null } };
  });
}
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error('Valhalla HTTP ' + res.status);
    const json = await res.json();
    if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 200));
    legs.push(...json.trip.legs);
    await new Promise((r) => setTimeout(r, 1200));
  }
  const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
  return { shape, distanceM: lengthM(shape), engineM: legs.reduce((s, l) => s + l.summary.length * 1000, 0), legKm: legs.map((l) => l.summary.length) };
}
const out = { calculatedAt: new Date().toISOString(), engine: 'valhalla-pedestrian', variants: {} };
const every = [...new Map(Object.values(variants).flatMap((v) => v.points).map((p) => [p.id, p])).values()];
const snap = await snapAll(every);
for (const [key, variant] of Object.entries(variants)) {
  variant.points = snap(variant.points);
  const r = await route(variant.points);
  const rep = repeatedM(r.shape);
  const offsets = variant.points.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  out.variants[key] = {
    label: variant.label,
    distanceM: Math.round(r.distanceM),
    repeatedGeometryM: Math.round(rep),
    legKm: r.legKm.map((v) => Math.round(v * 100) / 100),
    stops: variant.points.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, movedToWalkwayM: p.snap.movedM ?? null, highway: p.snap.highway ?? null, source: p.source, offsetM: Math.round(offsets[i]) })),
  };
  fs.writeFileSync(path.join(root, 'data/candidates/no-23-' + key + '.geojson'), JSON.stringify({ type: 'Feature', id: 'No.23-' + key + '-candidate', properties: { courseId: 'No.23', variant: key, status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  console.log(variant.label + ': ' + (r.distanceM / 1000).toFixed(2) + ' km, repeated ' + Math.round(rep) + ' m, legs ' + r.legKm.map((v) => v.toFixed(2)).join(' '));
}
fs.writeFileSync(path.join(root, 'data/research/no-23-route-build.json'), JSON.stringify(out, null, 2));
