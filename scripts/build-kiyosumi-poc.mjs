// Research-stage route calculation. Requires external pedestrian-routing access.
// It produces map-review candidates, never a field-verified route.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = JSON.parse(fs.readFileSync(path.join(root, 'data/research/kiyosumi-geocoding.json'), 'utf8')).results;
const point = (id) => {
  const candidate = cache[id]?.candidates?.[0];
  if (!candidate) throw new Error(`missing researched point: ${id}`);
  return [candidate.lat, candidate.lon];
};
const shared = [
  { id: 'kiyosumi_station', label: '清澄白河駅', coord: point('kiyosumi_station'), source: 'OpenStreetMap Nominatim' },
  { id: 'fukagawa_museum', label: '深川江戸資料館', coord: point('fukagawa_museum'), source: 'OpenStreetMap Nominatim' },
  { id: 'kiyosumi_garden', label: '清澄庭園 北側付近', coord: [35.681, 139.7975], source: 'legacy waypoint; entrance not confirmed' },
  { id: 'basho_museum', label: '芭蕉記念館', coord: point('basho_museum'), source: 'OpenStreetMap Nominatim' },
  { id: 'ryogoku_station', label: '両国駅付近', coord: [35.696, 139.7935], source: 'legacy waypoint; exit not confirmed' },
  { id: 'hokusai_museum', label: 'すみだ北斎美術館', coord: point('hokusai_museum'), source: 'OpenStreetMap Nominatim' },
  { id: 'kinshicho_station', label: '錦糸町駅', coord: point('kinshicho_station'), source: 'OpenStreetMap Nominatim' },
];
const plans = [
  { id: 'standard', label: 'A 標準', waypoints: shared },
  { id: 'extended', label: 'B 延長', waypoints: [...shared.slice(0, -1), { id: 'kameido_tenjin', label: '亀戸天神社', coord: [35.702053, 139.820358], source: 'NII historical place dataset; vicinity only' }, { id: 'kameido_station', label: '亀戸駅', coord: point('kameido_station'), source: 'OpenStreetMap Nominatim; Tobu side, JR entrance unresolved' }] },
];
const rad = (x) => x * Math.PI / 180;
const meters = (a, b) => {
  const dLat = rad(b[0] - a[0]); const dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(h));
};
const geometryMeters = (points) => points.slice(1).reduce((sum, point, i) => sum + meters(points[i], point), 0);
const repeatedMeters = (points) => {
  const edges = new Map();
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].map((n) => n.toFixed(5)).join(',');
    const b = points[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const item = edges.get(key) || { n: 0, m: meters(points[i - 1], points[i]) };
    item.n++; edges.set(key, item);
  }
  return [...edges.values()].reduce((sum, edge) => sum + Math.max(0, edge.n - 1) * edge.m, 0);
};
const reportPath = path.join(root, 'data/research/kiyosumi-route-build.json');
const previous = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, 'utf8')).results : [];
const results = [...previous];
const only = process.argv.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);
for (const plan of plans.filter((item) => !only || item.id === only)) {
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' },
    body: JSON.stringify({ locations: plan.waypoints.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }),
  });
  if (!response.ok) throw new Error(`${plan.id}: HTTP ${response.status}`);
  const json = await response.json();
  if (!json.trip?.legs?.length) throw new Error(`${plan.id}: no pedestrian legs`);
  const points = json.trip.legs.flatMap((leg, i) => { const decoded = decodePolyline(leg.shape, 6); return i ? decoded.slice(1) : decoded; });
  const distanceM = geometryMeters(points);
  const repeatM = repeatedMeters(points);
  const out = {
    type: 'Feature', id: `No.47-${plan.id}`,
    properties: { courseId: 'No.47', routeVariant: plan.id, routingStrategy: 'scenic', verificationStatus: 'routed', reviewNote: 'Research candidate; map and field review pending', engine: 'valhalla-pedestrian', calculatedAt: new Date().toISOString(), distanceM: Math.round(distanceM), engineDistanceM: Math.round(json.trip.summary.length * 1000) },
    geometry: { type: 'LineString', coordinates: points.map(([lat, lon]) => [lon, lat]) },
  };
  const filename = path.join(root, 'data/routes', `no-47-${plan.id}.geojson`);
  fs.writeFileSync(filename, JSON.stringify(out));
  const result = { variant: plan.id, distanceM: Math.round(distanceM), engineDistanceM: Math.round(json.trip.summary.length * 1000), repeatedGeometryM: Math.round(repeatM), repeatedGeometryPct: Number((repeatM / distanceM * 100).toFixed(1)), waypoints: plan.waypoints, legDistancesKm: json.trip.legs.map((leg) => leg.summary.length), geometryUrl: `data/routes/no-47-${plan.id}.geojson` };
  const oldIndex = results.findIndex((item) => item.variant === plan.id);
  if (oldIndex < 0) results.push(result); else results[oldIndex] = result;
  console.log(`${plan.id}: ${(distanceM / 1000).toFixed(2)} km, repeated-geometry clue ${(repeatM / distanceM * 100).toFixed(1)}%`);
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Valhalla pedestrian; exact geometry edge repeat is a screening clue, not OSM edge identity', results }, null, 2));
