// No.32 route candidates. All coordinates refer to named OSM features or gates;
// geometry remains a research candidate until entrance and map review.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const point = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const core = [
  point('iidabashi_east', '飯田橋駅東口', 35.7019085, 139.7456386, 'OSM node 1579304711; JR exit needs confirmation'),
  point('hyogo_yokocho', '兵庫横丁付近', 35.7024504, 139.7398422, 'OSM node 10681466205 is a restaurant, not the lane entrance'),
  point('zenkokuji', '善國寺付近', 35.7014555, 139.7394777, 'OSM way 1270865653 centre; entrance needs confirmation'),
  point('akagi_shrine', '赤城神社付近', 35.704607, 139.7360988, 'OSM way 143516722 centre; entrance needs confirmation'),
  point('ichigaya_mitsuke', '市谷見附付近', 35.6921485, 139.7352205, 'OSM node 1808422619; crossing needs map review'),
  point('sotobori_park', '外濠公園付近', 35.6892117, 139.7325038, 'OSM way 594546211 centre; park path needs map review'),
  point('yotsuya_jr', 'JR四ツ谷駅付近', 35.6859783, 139.7309525, 'OSM way 816262886 outdoor footway; station exit needs confirmation'),
];
const gardenPrefix = [
  point('suidobashi_west', '水道橋駅西口付近', 35.702067, 139.752137, 'OSM way 1053066681 outdoor footway'),
  point('korakuen_south_east', '小石川後楽園南側の道・東端付近', 35.7040336, 139.7513341, 'OSM gate node 1919930576 vicinity; main route stays outside garden'),
  point('korakuen_south_west', '小石川後楽園南側の道・西端付近', 35.7049655, 139.7477674, 'OSM gate node 5272766229 vicinity; main route stays outside garden'),
  core[0],
];
const riverPrefix = [
  point('ochanomizu_jr', '御茶ノ水駅御茶ノ水橋口', 35.6999152, 139.7636624, 'OSM node 6988063075 train station entrance'),
  point('ochanomizu_bridge', '御茶ノ水橋', 35.7002306, 139.763593, 'OSM way 375670605 centre; river viewpoint'),
  point('motomachi_park', '元町公園付近', 35.7022971, 139.7581029, 'OSM way 175996472 centre; park entrance and slope need review'),
  gardenPrefix[0],
];
const radians = (n) => n * Math.PI / 180;
const meters = (a, b) => {
  const q = Math.sin(radians(b[0] - a[0]) / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(radians(b[1] - a[1]) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(q));
};
const lengthM = (points) => points.slice(1).reduce((sum, value, i) => sum + meters(points[i], value), 0);
const repeatedM = (points) => {
  const edges = new Map();
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].map((n) => n.toFixed(5)).join(','); const b = points[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const item = edges.get(key) || { count: 0, length: meters(points[i - 1], points[i]) };
    item.count++; edges.set(key, item);
  }
  return [...edges.values()].reduce((sum, edge) => sum + Math.max(0, edge.count - 1) * edge.length, 0);
};
async function route(waypoints) {
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' },
    body: JSON.stringify({ locations: waypoints.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }),
  });
  if (!response.ok) throw new Error(`Valhalla HTTP ${response.status}`);
  const json = await response.json();
  if (!json.trip?.legs?.length) throw new Error(`Valhalla: ${JSON.stringify(json).slice(0, 250)}`);
  const shape = json.trip.legs.flatMap((leg, i) => { const decoded = decodePolyline(leg.shape, 6); return i ? decoded.slice(1) : decoded; });
  const distanceM = lengthM(shape);
  if (Math.abs(distanceM - json.trip.summary.length * 1000) > Math.max(30, distanceM * .02)) throw new Error('engine/shape distance mismatch');
  return { shape, distanceM, engineDistanceM: json.trip.summary.length * 1000, legDistancesKm: json.trip.legs.map((leg) => leg.summary.length) };
}
const standard = await route(core);
await new Promise((resolve) => setTimeout(resolve, 1200));
const prefix = await route(gardenPrefix);
await new Promise((resolve) => setTimeout(resolve, 1200));
const river = await route(riverPrefix);
const plans = [
  { variant: 'standard', waypoints: core, shape: standard.shape, engineDistanceM: standard.engineDistanceM, legDistancesKm: standard.legDistancesKm },
  { variant: 'extended', waypoints: [...riverPrefix, ...gardenPrefix.slice(1), ...core.slice(1)], shape: [...river.shape, ...prefix.shape.slice(1), ...standard.shape.slice(1)], engineDistanceM: river.engineDistanceM + prefix.engineDistanceM + standard.engineDistanceM, legDistancesKm: [...river.legDistancesKm, ...prefix.legDistancesKm, ...standard.legDistancesKm] },
];
const results = [];
for (const plan of plans) {
  const distanceM = lengthM(plan.shape); const repeat = repeatedM(plan.shape);
  const geometryUrl = `data/routes/no-32-${plan.variant}.geojson`;
  const feature = { type: 'Feature', id: `No.32-${plan.variant}`, properties: { courseId: 'No.32', routeVariant: plan.variant, verificationStatus: 'routed', reviewNote: 'Candidate only; facility entrances, garden internal path and crossings need map review', engine: 'valhalla-pedestrian', calculatedAt: new Date().toISOString(), distanceM: Math.round(distanceM), engineDistanceM: Math.round(plan.engineDistanceM) }, geometry: { type: 'LineString', coordinates: plan.shape.map(([lat, lon]) => [lon, lat]) } };
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify(feature));
  results.push({ variant: plan.variant, distanceM: Math.round(distanceM), engineDistanceM: Math.round(plan.engineDistanceM), repeatedGeometryM: Math.round(repeat), repeatedGeometryPct: Number((repeat / distanceM * 100).toFixed(1)), waypoints: plan.waypoints, legDistancesKm: plan.legDistancesKm, geometryUrl });
  console.log(`${plan.variant}: ${(distanceM / 1000).toFixed(2)} km, repeat clue ${(repeat / distanceM * 100).toFixed(1)}%`);
}
fs.writeFileSync(path.join(root, 'data/research/no-32-route-build.json'), JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Valhalla pedestrian; garden and street entrances require map review', results }, null, 2));
