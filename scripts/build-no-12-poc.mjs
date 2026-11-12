// No.12 map-review candidates, using individually checked OSM features.
// Public Valhalla demo is used only for these two bounded research calls.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const point = (id, label, lat, lon, note) => ({ id, label, coord: [lat, lon], source: `OpenStreetMap via Overpass; ${note}` });
const shared = [
  point('tachikawa_station', '立川駅', 35.6977473, 139.4138779, 'station feature; exit pending'),
  point('faret', 'ファーレ立川センタースクエア', 35.7021632, 139.4141024, 'art area'),
  point('green_springs', 'GREEN SPRINGS', 35.7034083, 139.411371, 'facility point; walking entrance pending'),
  point('tachikawa_gate', '昭和記念公園・立川口', 35.7022439, 139.4036071, 'entrance=yes'),
  point('fureai', 'ふれあい広場付近', 35.7036919, 139.4002309, 'restaurant vicinity, not plaza entrance'),
  point('pond', '水鳥の池', 35.7058623, 139.3949054, 'waterbody center; shore path pending'),
];
const plans = [
  { variant: 'standard', waypoints: [...shared,
    point('west_gate', '昭和記念公園・西立川口', 35.7036353, 139.3952508, 'entrance=yes'),
    point('nishitachikawa_station', '西立川駅', 35.7035276, 139.3936344, 'station vicinity; exit pending')],
  },
  { variant: 'extended', waypoints: [...shared,
    point('japanese_garden', '日本庭園', 35.7142767, 139.3954371, 'garden center; entrance pending'),
    point('komorebi', 'こもれびの里', 35.7164587, 139.397876, 'area center; entrance pending'),
    point('sunagawa_gate', '昭和記念公園・砂川口', 35.7196183, 139.3973692, 'gate vicinity'),
    point('musashisunagawa_station', '武蔵砂川駅', 35.7289155, 139.3922831, 'station vicinity; exit pending')],
  },
];
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => {
  const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(q));
};
const lengthM = (points) => points.slice(1).reduce((sum, value, i) => sum + meters(points[i], value), 0);
const repeatM = (points) => {
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
const results = [];
for (const plan of plans) {
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' },
    body: JSON.stringify({ locations: plan.waypoints.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }),
  });
  if (!response.ok) throw new Error(`${plan.variant}: HTTP ${response.status}`);
  const json = await response.json();
  if (!json.trip?.legs?.length) throw new Error(`${plan.variant}: no pedestrian route`);
  const points = json.trip.legs.flatMap((leg, i) => { const decoded = decodePolyline(leg.shape, 6); return i ? decoded.slice(1) : decoded; });
  const distanceM = lengthM(points); const repeatedM = repeatM(points);
  if (Math.abs(distanceM - json.trip.summary.length * 1000) > Math.max(30, distanceM * .02)) throw new Error(`${plan.variant}: engine/shape distance mismatch`);
  const feature = { type: 'Feature', id: `No.12-${plan.variant}`, properties: { courseId: 'No.12', routeVariant: plan.variant, verificationStatus: 'routed', reviewNote: 'Map and facility entrance review pending; pond and garden are area centroids', engine: 'valhalla-pedestrian', calculatedAt: new Date().toISOString(), distanceM: Math.round(distanceM), engineDistanceM: Math.round(json.trip.summary.length * 1000) }, geometry: { type: 'LineString', coordinates: points.map(([lat, lon]) => [lon, lat]) } };
  const geometryUrl = `data/routes/no-12-${plan.variant}.geojson`;
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify(feature));
  results.push({ variant: plan.variant, distanceM: Math.round(distanceM), engineDistanceM: Math.round(json.trip.summary.length * 1000), repeatedGeometryM: Math.round(repeatedM), repeatedGeometryPct: Number((repeatedM / distanceM * 100).toFixed(1)), waypoints: plan.waypoints, legDistancesKm: json.trip.legs.map((leg) => leg.summary.length), geometryUrl });
  console.log(`${plan.variant}: ${(distanceM / 1000).toFixed(2)} km, repeat clue ${(repeatedM / distanceM * 100).toFixed(1)}%`);
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
fs.writeFileSync(path.join(root, 'data/research/no-12-route-build.json'), JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results }, null, 2));
