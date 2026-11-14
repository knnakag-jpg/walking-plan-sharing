// Three bounded Valhalla requests for reviewable examples. Not a bulk rebuild.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';
import { routeDistances } from '../atlas/assets/route-playback.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const plan = JSON.parse(fs.readFileSync(path.join(root, 'data/research/one-stroke-examples-plan.json'), 'utf8'));
const outDir = path.join(root, 'data/candidates');
fs.mkdirSync(outDir, { recursive: true });
const selected = new Set(process.argv.slice(2));
const previousFile = path.join(root, 'data/research/one-stroke-examples-build.json');
const previous = fs.existsSync(previousFile) ? JSON.parse(fs.readFileSync(previousFile, 'utf8')).results : [];
const results = previous.filter((item) => selected.size && !selected.has(item.courseId));
for (const item of plan.plans.filter((entry) => !selected.size || selected.has(entry.courseId))) {
  const response = await fetch('https://valhalla1.openstreetmap.de/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-one-stroke-examples' },
    body: JSON.stringify({
      locations: item.waypoints.map((waypoint, index) => ({ lat: waypoint.coord[0], lon: waypoint.coord[1], type: index === 0 || index === item.waypoints.length - 1 ? 'break' : 'through' })),
      costing: 'pedestrian', units: 'kilometers',
    }),
  });
  if (!response.ok) throw new Error(`${item.courseId}: Valhalla HTTP ${response.status}`);
  const json = await response.json();
  if (!json.trip?.legs?.length) throw new Error(`${item.courseId}: no walking route in response`);
  const points = json.trip.legs.flatMap((leg, index) => { const decoded = decodePolyline(leg.shape, 6); return index ? decoded.slice(1) : decoded; });
  const coordinates = points.map(([lat, lon]) => [lon, lat]);
  const cumulative = routeDistances(coordinates);
  const distanceM = cumulative.at(-1);
  const engineDistanceM = json.trip.summary.length * 1000;
  if (!Number.isFinite(distanceM) || Math.abs(distanceM - engineDistanceM) > Math.max(30, distanceM * .02)) throw new Error(`${item.courseId}: engine/shape distance differs`);
  const seen = new Set(); let repeatedExactM = 0; let repeatedRoundedM = 0;
  const rounded = new Set();
  for (let i = 1; i < coordinates.length; i++) {
    const edge = [coordinates[i - 1].join(','), coordinates[i].join(',')].sort().join('|');
    const roundedEdge = [coordinates[i - 1].map((n) => n.toFixed(5)).join(','), coordinates[i].map((n) => n.toFixed(5)).join(',')].sort().join('|');
    const length = cumulative[i] - cumulative[i - 1];
    if (seen.has(edge)) repeatedExactM += length;
    if (rounded.has(roundedEdge)) repeatedRoundedM += length;
    seen.add(edge); rounded.add(roundedEdge);
  }
  const slug = item.courseId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const geometryUrl = `data/candidates/${slug}-one-stroke.geojson`;
  const calculatedAt = new Date().toISOString();
  const feature = {
    type: 'Feature', id: `${item.courseId}-one-stroke-candidate`,
    properties: { courseId: item.courseId, status: 'routed_candidate_not_map_reviewed', engine: 'valhalla-pedestrian', calculatedAt, distanceM: Math.round(distanceM), engineDistanceM: Math.round(engineDistanceM), sourcePlan: 'data/research/one-stroke-examples-plan.json' },
    geometry: { type: 'LineString', coordinates },
  };
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify(feature));
  results.push({
    courseId: item.courseId, geometryUrl, calculatedAt, distanceM: Math.round(distanceM), engineDistanceM: Math.round(engineDistanceM),
    repeatedExactM: Math.round(repeatedExactM), repeatedRoundedM: Math.round(repeatedRoundedM),
    repeatedExactPct: Number((repeatedExactM / distanceM * 100).toFixed(1)),
    oneStrokeScreening: repeatedExactM <= 50 && repeatedRoundedM <= 50 ? 'pass_geometry_only' : 'needs_replan',
    waypointIds: item.waypoints.map((waypoint) => waypoint.id),
    openChecks: ['道路エッジ同定', '徒歩可能な園路・施設出入口', '横断・坂・段差', '現地歩行', '旧線から除いた地点の扱い'],
  });
  console.log(`${item.courseId}: ${(distanceM / 1000).toFixed(2)} km, repeated exact ${Math.round(repeatedExactM)} m, rounded ${Math.round(repeatedRoundedM)} m`);
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
results.sort((a, b) => plan.plans.findIndex((item) => item.courseId === a.courseId) - plan.plans.findIndex((item) => item.courseId === b.courseId));
fs.writeFileSync(previousFile, JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Valhalla pedestrian with intermediate through points. Geometry screening is not a road-edge or map review.', results }, null, 2));
