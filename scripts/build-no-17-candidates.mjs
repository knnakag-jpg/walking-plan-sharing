// No.17 麻布台ヒルズ～東京タワー: legacy has a fabricated "エリア方面へ延伸（往復約3.6km）".
// Candidates use named OSM points only; centres are not entrances, so output stays routed_candidate_not_map_reviewed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const kamiyacho = P('kamiyacho', '神谷町駅', 35.66298, 139.74507, 'OSM node 1926355403 stop');
const towerRoad = P('tower_road', '東京タワー前（交差点）', 35.65846, 139.74699, 'OSM node 1637283659 traffic_signals 東京タワー前');
const towerFoot = P('tower_foot', '東京タワー（道路側バス停）', 35.65835, 139.74612, 'OSM node 9497354785 bus_stop 東京タワー');
const zojoji = P('zojoji', '増上寺前', 35.65723, 139.75031, 'OSM node 337024823');
const onarimon = P('onarimon', '御成門（交差点）', 35.66096, 139.75151, 'OSM node 281679484 traffic_signals');
const shibaPark = P('shiba_park', '芝公園（園内）', 35.65557, 139.75027, 'OSM way 745301120 park centre');
const shibaSt = P('shiba_st', '芝公園駅', 35.65424, 139.74989, 'OSM node 6233834712 station');
const azabu = P('azabudai', '麻布台ヒルズ（中央広場側）', 35.6603, 139.7408, 'approx. 麻布台ヒルズ街区 centre; no OSM named node in the query, needs map review');
const kamiyachoCross = P('kamiyacho_cross', '神谷町（交差点）', 35.66318, 139.74533, 'OSM node 251857299 traffic_signals 神谷町');
const azabuWalk = P('azabu_walk', '麻布台ヒルズ前（歩道上の仮点）', 35.6596, 139.7428, 'placement on the street in front of 麻布台ヒルズ; needs map review');
const variants = {
  through: { label: 'D 交差点ピンのみ：神谷町→東京タワー前→増上寺→御成門→芝公園→芝公園駅', points: [kamiyachoCross, towerRoad, zojoji, onarimon, shibaPark, shibaSt] },
  through_azabu: { label: 'E 麻布台ヒルズに先に寄る：神谷町→麻布台ヒルズ前→東京タワー前→増上寺→御成門→芝公園→芝公園駅', points: [kamiyachoCross, azabuWalk, towerRoad, zojoji, onarimon, shibaPark, shibaSt] },
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
  const cache = path.join(root, 'data/research/no-17-walkway-snap.json');
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
  fs.writeFileSync(path.join(root, 'data/candidates/no-17-' + key + '.geojson'), JSON.stringify({ type: 'Feature', id: 'No.17-' + key + '-candidate', properties: { courseId: 'No.17', variant: key, status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  console.log(variant.label + ': ' + (r.distanceM / 1000).toFixed(2) + ' km, repeated ' + Math.round(rep) + ' m, legs ' + r.legKm.map((v) => v.toFixed(2)).join(' '));
}
fs.writeFileSync(path.join(root, 'data/research/no-17-route-build.json'), JSON.stringify(out, null, 2));
