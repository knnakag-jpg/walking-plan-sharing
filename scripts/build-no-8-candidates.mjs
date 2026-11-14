// No.8 Ueno museums: one-stroke A/B candidates. Replaces the legacy out-and-back
// "東尾久一丁目方面へ延伸（往復約2.5km）", which had no real coordinate behind it.
// Every point is a named OSM feature (data/research/no-8-osm-poi.json). Centres are
// not entrances, so the output stays "routed_candidate_not_map_reviewed".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const station = P('ueno_station', '上野駅公園口付近', 35.71292, 139.77674, 'OSM node 3259272053 train_station_entrance; exit name needs confirmation');
const bunka = P('bunka_kaikan', '東京文化会館（外観のみ・休館中）', 35.71428, 139.77519, 'OSM relation 5419119 centre; closed for renovation from 2026-05-07 per t-bunka.jp');
const saigo = P('saigo', '西郷隆盛像付近', 35.71186, 139.77417, 'OSM way 138585434');
const benten = P('benten', '不忍池弁天堂付近', 35.71213, 139.77116, 'OSM way 91725747');
const toshogu = P('toshogu', '上野東照宮付近', 35.7154, 139.77063, 'OSM way 145344085 centre; entrance needs confirmation');
const nmwa = P('nmwa', '国立西洋美術館付近', 35.71541, 139.77585, 'OSM way 203960903 centre; entrance needs confirmation');
const kahaku = P('kahaku', '国立科学博物館付近', 35.71599, 139.77659, 'OSM way 203960902 centre; entrance needs confirmation');
const tnm = P('tnm', '東京国立博物館付近', 35.71907, 139.77582, 'OSM way 33439660 centre; 正門 location not confirmed (tnm.jp does not state it)');
const sogakudo = P('sogakudo', '旧東京音楽学校奏楽堂付近', 35.71799, 139.77331, 'OSM node 13881133162');
const kuroda = P('kuroda', '黒田記念館付近', 35.7189, 139.77331, 'OSM way 152340249 centre');
const kaneiji = P('kaneiji', '寛永寺付近', 35.72158, 139.77437, 'OSM way 153990148 centre; worship hall access not confirmed');
const yanaka_gate = P('yanaka_gate', '谷中霊園の入口付近（公衆トイレ脇）', 35.72277, 139.77029, 'OSM node 14156023120; entrance location is the toilet, needs map review');
const gojuto = P('gojuto_ato', '谷中五重塔跡地', 35.72527, 139.77081, 'OSM node 4218532821 (官公庁表記: 天王寺五重塔の跡)');
const tennoji = P('tennoji', '天王寺付近', 35.72662, 139.77142, 'OSM way 1367250759 centre');
const asakura = P('asakura', '朝倉彫塑館付近', 35.72681, 139.76852, 'OSM way 209190478 centre; opening days not checked');
const yuyake = P('yuyake', '夕焼けだんだん', 35.72765, 139.76717, 'OSM way 340/733 steps 夕焼けだんだん (w433... via name); steps, not step-free');
const ginza = P('yanaka_ginza', '谷中銀座商店街付近', 35.72766, 139.76697, 'OSM node 8691137817 attraction');
const nippori = P('nippori', '日暮里駅南改札口付近', 35.72779, 139.77171, 'OSM node 7040915508 train_station_entrance');

// Dropped after the first computation because their snapped walkways are dead-end stubs
// that produced out-and-back spurs: 奏楽堂, 黒田記念館 (not in the legacy text either),
// 上野東照宮 (154m+156m spur), 寛永寺 and 不忍池弁天堂 (dead-end stubs) and 谷中銀座 (same steps as 夕焼けだんだん). See no-8-route-research.json.
const variants = {
  standard: { label: 'A 標準', points: [station, bunka, nmwa, kahaku, tnm, yanaka_gate, gojuto, tennoji, nippori] },
  extended: { label: 'B 延長', points: [station, saigo, nmwa, kahaku, tnm, yanaka_gate, gojuto, tennoji, asakura, yuyake, nippori] },
};

// Building centres sit inside buildings, so a pin there makes the router walk in from the
// road and back out (a spur that shows up as repeated geometry). Each pin is moved to the
// nearest vertex of a real OSM walkway within 70m; the original OSM centre is kept as the
// source. If no walkway is that close the pin is not moved and the offset is reported.
const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track';
async function snapAll(points) {
  const cache = path.join(root, 'data/research/no-8-walkway-snap.json');
  const all = new Map(points.map((p) => [p.id, p]));
  let known = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : {};
  const missing = [...all.values()].filter((p) => !known[p.id]);
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => `way(around:70,${p.coord[0]},${p.coord[1]})["highway"~"^(${WALKWAY})$"];`).join('') + ');out geom;';
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
    if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
    const ways = (await res.json()).elements.filter((e) => e.geometry);
    for (const p of missing) {
      let best = null;
      for (const w of ways) for (const v of w.geometry) { const d = meters(p.coord, [v.lat, v.lon]); if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id, highway: w.tags?.highway, name: w.tags?.name }; }
      known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId, highway: best.highway, name: best.name || null } : { snapped: null };
    }
    fs.writeFileSync(cache, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', ...known }, null, 1));
    known = JSON.parse(fs.readFileSync(cache, 'utf8'));
  }
  return (list) => list.map((p) => { const k = known[p.id]; return k?.snapped ? { ...p, coord: k.snapped, original: p.coord, snap: k } : { ...p, original: p.coord, snap: { snapped: null } }; });
}
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (pts) => pts.slice(1).reduce((s, v, i) => s + meters(pts[i], v), 0);
const repeatedM = (pts) => { const edges = new Map(); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1].map((n) => n.toFixed(5)).join(','); const b = pts[i].map((n) => n.toFixed(5)).join(','); if (a === b) continue; const k = a < b ? `${a}|${b}` : `${b}|${a}`; const e = edges.get(k) || { c: 0, l: meters(pts[i - 1], pts[i]) }; e.c++; edges.set(k, e); } return [...edges.values()].reduce((s, e) => s + Math.max(0, e.c - 1) * e.l, 0); };

// Valhalla's public demo caps locations at 10 per request: chunk with a shared endpoint.
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error(`Valhalla HTTP ${res.status}`);
    const json = await res.json();
    if (!json.trip?.legs?.length) throw new Error(`Valhalla: ${JSON.stringify(json).slice(0, 250)}`);
    legs.push(...json.trip.legs);
    await new Promise((r) => setTimeout(r, 1200));
  }
  const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
  const engineM = legs.reduce((s, leg) => s + leg.summary.length * 1000, 0);
  const distanceM = lengthM(shape);
  if (Math.abs(distanceM - engineM) > Math.max(30, distanceM * .02)) throw new Error('engine/shape distance mismatch');
  return { shape, distanceM, engineM, legKm: legs.map((leg) => leg.summary.length) };
}

const out = { calculatedAt: new Date().toISOString(), engine: 'valhalla-pedestrian', variants: {} };
const everyPoint = [...new Map(Object.values(variants).flatMap((v) => v.points).map((p) => [p.id, p])).values()];
const snap = await snapAll(everyPoint);
for (const [key, variant] of Object.entries(variants)) {
  variant.points = snap(variant.points);
  const r = await route(variant.points);
  const rep = repeatedM(r.shape);
  // distance from each stop to the drawn line (stop order check is done by the verifier)
  const offsets = variant.points.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  out.variants[key] = { label: variant.label, distanceM: Math.round(r.distanceM), engineDistanceM: Math.round(r.engineM), repeatedGeometryM: Math.round(rep), legKm: r.legKm.map((v) => Math.round(v * 100) / 100), maxStopOffsetM: Math.round(Math.max(...offsets)), stops: variant.points.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, osmCentre: p.original, movedToWalkwayM: p.snap.movedM ?? null, walkway: p.snap.snapped ? { wayId: p.snap.wayId, highway: p.snap.highway, name: p.snap.name } : null, source: p.source, offsetM: Math.round(offsets[i]) })) };
  fs.writeFileSync(path.join(root, `data/candidates/no-8-${key}.geojson`), JSON.stringify({ type: 'Feature', id: `No.8-${key}-candidate`, properties: { courseId: 'No.8', variant: key, status: 'trial_not_adopted_repeats_remain', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  console.log(`${variant.label}: ${(r.distanceM / 1000).toFixed(2)} km, repeated ${Math.round(rep)} m, max stop offset ${Math.round(Math.max(...offsets))} m, legs(km) ${r.legKm.map((v) => v.toFixed(2)).join(' ')}`);
}
fs.writeFileSync(path.join(root, 'data/research/no-8-route-build.json'), JSON.stringify(out, null, 2));
