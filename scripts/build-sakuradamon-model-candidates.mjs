// 利用者提供のモデルコース（桜田門駅→市場前駅、約6.5km、媒体名不明・出典URL未提供）の順序を参考に、OSM地点+Valhallaで自前試作。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const sakurada = P('sakuradamon', '桜田門駅', 35.67708, 139.75287, 'OSM node 413481709 subway_entrance');
const iwaida = P('iwaidabashi', '祝田橋', 35.67675, 139.75599, 'OSM node 251731817');
const sukiya = P('sukiyabashi', '数寄屋橋公園', 35.67422, 139.76083, 'OSM node 数寄屋橋交差点 (35.6742121,139.7608135); park is the block west of 数寄屋通り per user-supplied map');
const mitsukoshi = P('ginza_lion', '銀座三越ライオン像', 35.67200, 139.76558, 'OSM node ライオン像(重要文化財) 35.6720021,139.765582; the lion statue is at the 銀座4丁目 corner of 銀座三越 per user-supplied map');
const tsukiji = P('tsukiji_hongwanji', '築地本願寺', 35.66768, 139.77202, 'OSM node 31254383 traffic_signals 築地本願寺前');
const kachidoki = P('kachidoki_bridge', '勝鬨橋', 35.66275, 139.77442, 'OSM way near 勝鬨橋 (35.66275,139.77442) from the 勝鬨橋 query; the 橋脚塔 stands on the bridge centre per user-supplied map; footway confirmed by OSM ways 228050647/286507872');
const harumiPark = P('harumi_rinkai', '晴海臨海公園', 35.65484, 139.78582, 'OSM way 晴海臨海公園; entrance needs confirmation');
const toyosuBridge = P('toyosu_ohashi', '豊洲大橋（東端）', 35.64887, 139.78138, 'OSM way 557451914 centre; east/west ends need map review');
const senkyaku = P('senkyaku', '豊洲 千客万来', 35.64546, 139.78366, 'OSM way 1159017723 centre');
const ichiba = P('ichibamae', '市場前駅', 35.64576, 139.78578, 'OSM node 3349961082 station');
const variants = {
  model: { label: 'A 桜田門駅→…→千客万来→市場前駅（提供モデルコース順）', points: [sakurada, iwaida, sukiya, mitsukoshi, tsukiji, kachidoki, harumiPark, toyosuBridge, senkyaku, ichiba] },
};

const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway';
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (pts) => pts.slice(1).reduce((s, v, i) => s + meters(pts[i], v), 0);
const repeatedM = (pts) => {
  const edges = new Map();
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1].map((n) => n.toFixed(5)).join(',');
    const b = pts[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const k = a < b ? a + '|' + b : b + '|' + a;
    const e = edges.get(k) || { c: 0, l: meters(pts[i - 1], pts[i]) };
    e.c++;
    edges.set(k, e);
  }
  return [...edges.values()].reduce((s, e) => s + Math.max(0, e.c - 1) * e.l, 0);
};

async function snapAll(points) {
  const cache = path.join(root, 'data/research/sakuradamon-model-walkway-snap.json');
  const all = new Map(points.map((p) => [p.id, p]));
  let known = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : {};
  const missing = [...all.values()].filter((p) => !known[p.id]);
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => 'way(around:70,' + p.coord[0] + ',' + p.coord[1] + ')["highway"~"^(' + WALKWAY + ')$"];').join('') + ');out geom;';
    let res;
    for (let i = 0; i < 2; i++) {
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
        if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id, highway: w.tags?.highway, name: w.tags?.name };
      }
      known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId, highway: best.highway, name: best.name || null } : { snapped: null };
    }
    fs.writeFileSync(cache, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', ...known }, null, 1));
    known = JSON.parse(fs.readFileSync(cache, 'utf8'));
  }
  return (list) => list.map((p) => {
    const k = known[p.id];
    return k?.snapped ? { ...p, coord: k.snapped, original: p.coord, snap: k } : { ...p, original: p.coord, snap: { snapped: null } };
  });
}

// Valhalla's public demo caps locations at 10 per request: chunk with a shared endpoint.
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error('Valhalla HTTP ' + res.status);
    const json = await res.json();
    if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 250));
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
  const offsets = variant.points.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  out.variants[key] = {
    label: variant.label,
    distanceM: Math.round(r.distanceM),
    engineDistanceM: Math.round(r.engineM),
    repeatedGeometryM: Math.round(rep),
    legKm: r.legKm.map((v) => Math.round(v * 100) / 100),
    maxStopOffsetM: Math.round(Math.max(...offsets)),
    stops: variant.points.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, osmCentre: p.original, movedToWalkwayM: p.snap.movedM ?? null, walkway: p.snap.snapped ? { wayId: p.snap.wayId, highway: p.snap.highway, name: p.snap.name } : null, source: p.source, offsetM: Math.round(offsets[i]) })),
  };
  fs.writeFileSync(path.join(root, 'data/candidates/sakuradamon-model-' + key + '.geojson'), JSON.stringify({ type: 'Feature', id: 'sakuradamon-model-' + key + '-candidate', properties: { courseId: 'user-model-sakuradamon', variant: key, status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  console.log(variant.label + ': ' + (r.distanceM / 1000).toFixed(2) + ' km, repeated ' + Math.round(rep) + ' m, max stop offset ' + Math.round(Math.max(...offsets)) + ' m, legs(km) ' + r.legKm.map((v) => v.toFixed(2)).join(' '));
}
fs.writeFileSync(path.join(root, 'data/research/sakuradamon-model-route-build.json'), JSON.stringify(out, null, 2));
