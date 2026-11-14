import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeDistances } from '../atlas/assets/route-playback.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const plan = read('data/research/one-stroke-examples-plan.json');
const build = read('data/research/one-stroke-examples-build.json');
const cases = build.results.map((result) => {
  const item = plan.plans.find((entry) => entry.courseId === result.courseId);
  const coordinates = read(result.geometryUrl).geometry.coordinates;
  const cumulative = routeDistances(coordinates);
  const firstVisits = new Map();
  const repeated = [];
  for (let i = 1; i < coordinates.length; i++) {
    const edge = [coordinates[i - 1].join(','), coordinates[i].join(',')].sort().join('|');
    if (firstVisits.has(edge)) repeated.push({ index: i, meters: cumulative[i] - cumulative[i - 1] });
    else firstVisits.set(edge, i);
  }
  const clusters = [];
  for (const edge of repeated) {
    let cluster = clusters.at(-1);
    if (!cluster || edge.index > cluster.lastIndex + 2) {
      cluster = { firstIndex: edge.index, lastIndex: edge.index, repeatedM: 0, start: coordinates[edge.index - 1], end: coordinates[edge.index] };
      clusters.push(cluster);
    }
    cluster.lastIndex = edge.index;
    cluster.repeatedM += edge.meters;
    cluster.end = coordinates[edge.index];
  }
  const closeWaypoints = clusters.map((cluster) => {
    const nearest = item.waypoints.map((waypoint) => ({ id: waypoint.id, meters: Math.hypot((waypoint.coord[0] - cluster.start[1]) * 111000, (waypoint.coord[1] - cluster.start[0]) * 91000) })).sort((a, b) => a.meters - b.meters)[0];
    return { firstIndex: cluster.firstIndex, lastIndex: cluster.lastIndex, repeatedM: Math.round(cluster.repeatedM), start: cluster.start, end: cluster.end, nearestWaypoint: nearest.id, nearestWaypointDistanceM: Math.round(nearest.meters) };
  });
  return { courseId: result.courseId, repeatedExactM: Math.round(repeated.reduce((sum, edge) => sum + edge.meters, 0)), clusters: closeWaypoints };
});
fs.writeFileSync(path.join(root, 'data/research/one-stroke-examples-audit.json'), JSON.stringify({ generatedAt: build.generatedAt, method: 'Repeated identical coordinate edges, grouped by route order; nearest waypoint is only a proximity hint.', cases }, null, 2));
for (const item of cases) console.log(`${item.courseId}: ${item.repeatedExactM} m; ${item.clusters.map((cluster) => `${cluster.repeatedM}m near ${cluster.nearestWaypoint}`).join(', ')}`);
