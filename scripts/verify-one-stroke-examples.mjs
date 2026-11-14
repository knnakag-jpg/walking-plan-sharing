import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeDistances, playbackStops } from '../atlas/assets/route-playback.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const plan = read('data/research/one-stroke-examples-plan.json');
const build = read('data/research/one-stroke-examples-build.json');
const old = new Map(read('data/catalog.json').courses.map((course) => [course.id, course]));
if (plan.plans.length !== 3 || build.results.length !== 3 || new Set(build.results.map((item) => item.courseId)).size !== 3) throw new Error('expected three distinct examples');
for (const item of plan.plans) {
  const result = build.results.find((entry) => entry.courseId === item.courseId);
  if (!result || !old.has(item.courseId) || !item.distanceException || !item.omittedFromMainLine?.length || !item.officialEvidence?.length) throw new Error(`${item.courseId}: incomplete route plan`);
  const feature = read(result.geometryUrl);
  if (feature.type !== 'Feature' || feature.properties.courseId !== item.courseId || feature.properties.status !== 'routed_candidate_not_map_reviewed' || feature.geometry.type !== 'LineString') throw new Error(`${item.courseId}: invalid candidate feature`);
  const coordinates = feature.geometry.coordinates;
  if (coordinates.length < 2 || coordinates.some(([lon, lat]) => lon < 120 || lon > 150 || lat < 20 || lat > 50)) throw new Error(`${item.courseId}: invalid coordinates`);
  const cumulative = routeDistances(coordinates);
  const distanceM = cumulative.at(-1);
  if (Math.abs(distanceM - result.distanceM) > 1 || Math.abs(distanceM - result.engineDistanceM) > Math.max(30, distanceM * .02)) throw new Error(`${item.courseId}: distance mismatch`);
  const seen = new Set();
  const seenRounded = new Set();
  let repeatedM = 0;
  let repeatedRoundedM = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const edge = [coordinates[i - 1].join(','), coordinates[i].join(',')].sort().join('|');
    const rounded = [coordinates[i - 1], coordinates[i]].map((point) => point.map((value) => value.toFixed(5)).join(',')).sort().join('|');
    const segmentM = cumulative[i] - cumulative[i - 1];
    if (seen.has(edge)) repeatedM += segmentM;
    if (seenRounded.has(rounded)) repeatedRoundedM += segmentM;
    seen.add(edge);
    seenRounded.add(rounded);
  }
  if (repeatedM > 1 || repeatedRoundedM > 1 || result.repeatedExactM > 1 || result.repeatedRoundedM > 1 || result.oneStrokeScreening !== 'pass_geometry_only') throw new Error(`${item.courseId}: still retraces saved geometry`);
  const stops = playbackStops(item.waypoints.map((waypoint) => ({ ...waypoint, point: [waypoint.coord[1], waypoint.coord[0]], description: item.checkpointNarration?.[waypoint.id] })), coordinates, cumulative);
  if (stops.length !== item.waypoints.length || item.waypoints.some((waypoint) => !item.checkpointNarration?.[waypoint.id])) throw new Error(`${item.courseId}: a checkpoint is missing or off route`);
  console.log(`${item.courseId}: ${result.distanceM} m; old ${old.get(item.courseId).route.distanceM} m; repeated geometry ${result.repeatedExactM} m`);
}
console.log('Three routed candidate examples passed geometry checks; map and field review remain open.');
