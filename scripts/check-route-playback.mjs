import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeDistances, playbackStops, partialRoute } from '../atlas/assets/route-playback.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const courses = read('data/catalog.json').courses;
let checked = 0;
for (const course of courses) {
  for (const route of course.routeOptions || [course.route]) {
    if (!route.geometryUrl) continue;
    const coordinates = read(route.geometryUrl).geometry.coordinates;
    const cumulative = routeDistances(coordinates);
    const total = cumulative.at(-1);
    if (!Number.isFinite(total) || total < 100 || Math.abs(total - route.distanceM) > 15) throw new Error(`${route.id}: invalid replay distance`);
    const waypoints = route.waypoints || course.waypoints;
    const stops = playbackStops(waypoints, coordinates, cumulative);
    if (waypoints.length && !stops.length) throw new Error(`${route.id}: no checkpoints can be placed on the line`);
    if (stops.some((stop, i) => stop.atM < 0 || stop.atM > total || stop.offsetM > 40 || (i > 0 && stop.atM <= stops[i - 1].atM))) throw new Error(`${route.id}: invalid checkpoint order`);
    const start = partialRoute(coordinates, cumulative, 0).at(-1);
    const end = partialRoute(coordinates, cumulative, total).at(-1);
    if (Math.hypot(start[0] - coordinates[0][1], start[1] - coordinates[0][0]) > 1e-8 || Math.hypot(end[0] - coordinates.at(-1)[1], end[1] - coordinates.at(-1)[0]) > 1e-8) throw new Error(`${route.id}: replay endpoints differ`);
    checked++;
  }
}
console.log(`Playback geometry OK: ${checked} route shapes, checkpoint order and endpoints.`);
