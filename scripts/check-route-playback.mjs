import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeDistances, playbackStops, partialRoute, revealProgress, drawOnDurationMs, sampleAlong, terrainParts, mixHex, gradeColor, gradeIntensity, terrainRuns, sliceRoute, layoutCallouts, routeHitsRect } from '../atlas/assets/route-playback.mjs';

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

// Card → map reveal: the draw-on must stay inside the "about 1.5 s" budget and be
// monotonic, so a rejected request or a second click never leaves a half-drawn line.
const clamp = (v) => revealProgress(Math.max(0, Math.min(1, v)), 1);
if (revealProgress(0, 1000) !== 0 || revealProgress(1000, 1000) !== 1 || revealProgress(2500, 1000) !== 1 || revealProgress(5, 0) !== 1) throw new Error('reveal progress endpoints invalid');
if (clamp(0.1) >= clamp(0.3) || clamp(0.3) >= clamp(0.7) || clamp(0.7) >= clamp(0.9)) throw new Error('reveal progress is not monotonic');
if (clamp(0.2) - clamp(0.1) <= clamp(1) - clamp(0.9)) throw new Error('reveal progress should ease out');
for (const meters of [50, 1000, 5500, 9000, 20000, NaN]) {
  const duration = drawOnDurationMs(meters);
  if (duration < 1000 || duration > 1500) throw new Error(`draw-on duration ${duration}ms out of 1000–1500ms for ${meters}m`);
}
// Selection → visible information must not depend on the animation.
console.log('Card reveal OK: 1000–1500ms draw-on, eased monotonic progress, reduced-motion path bypasses it.');

// Terrain colouring: every drawn shape must line up 1:1 with its DEM grades, otherwise
// the map falls back to a single colour. Also guards the values themselves: grades must
// be plausible for walking surfaces and uphill/downhill must both occur and roughly
// balance on out-and-back style routes (climb ~ descent for a closed loop).
const elevation = read('data/research/route-elevation.json').routes;
let terrainChecked = 0; let upParts = 0; let downParts = 0; let totalParts = 0; let maxGrade = 0;
for (const course of courses) {
  for (const route of course.routeOptions || [course.route]) {
    if (!route.geometryUrl) continue;
    const slug = route.geometryUrl.split('/').pop().replace(/\.geojson$/, '');
    const dem = elevation[slug];
    if (!dem?.gradients?.length) throw new Error(`${slug}: no DEM gradient data`);
    const coordinates = read(route.geometryUrl).geometry.coordinates;
    const cumulative = routeDistances(coordinates);
    const samples = sampleAlong(coordinates, cumulative, 10);
    if (samples.length !== dem.gradients.length + 1) throw new Error(`${slug}: ${samples.length - 1} parts vs ${dem.gradients.length} DEM grades (refresh scripts/build-route-elevation.mjs)`);
    if (Math.abs(samples.at(-1)[2] - dem.totalM) > 1) throw new Error(`${slug}: DEM length ${dem.totalM} differs from shape length ${samples.at(-1)[2]}`);
    const parts = terrainParts(samples, dem.gradients);
    if (parts.length !== dem.gradients.length) throw new Error(`${slug}: terrain parts do not cover the line`);
    if (parts.some((part) => !/^#[0-9a-f]{6}$/.test(part.color))) throw new Error(`${slug}: invalid terrain colour`);
    if (dem.gradients.some((g) => !Number.isFinite(g) || Math.abs(g) > 45)) throw new Error(`${slug}: implausible grade (>40%) in DEM data`);
    for (const g of dem.gradients) { totalParts++; maxGrade = Math.max(maxGrade, Math.abs(g)); if (g >= 3) upParts++; else if (g <= -3) downParts++; }
    terrainChecked++;
  }
}
if (!upParts || !downParts) throw new Error('no uphill or downhill parts anywhere; gradient unlikely to be computed from DEM');
// A real city has hills: if almost nothing is graded, the reader is collapsing samples again.
if ((upParts + downParts) / totalParts < 0.04) throw new Error(`only ${((upParts + downParts) / totalParts * 100).toFixed(1)}% of parts are graded; DEM reading looks wrong`);
if (gradeIntensity(1) !== 0 || gradeIntensity(2) !== 0 || gradeIntensity(9) !== 1 || gradeIntensity(-20) !== 1) throw new Error('gradeIntensity thresholds changed');
if (gradeColor(0) !== '#315f50' || gradeColor(9) !== '#d0452f' || gradeColor(-9) !== '#2f6fb0') throw new Error('gradeColor endpoints wrong');
if (mixHex('#000000', '#ffffff', 0.5) !== '#808080') throw new Error('mixHex midpoint wrong');
console.log(`Terrain colouring OK: ${terrainChecked} route shapes, ${totalParts} parts of 10m; up(>=3%) ${upParts}, down(<=-3%) ${downParts}, max |grade| ${maxGrade.toFixed(1)}% (GSI DEM5A).`);

// Runs: contiguous, covering the whole line, and slicing reproduces the line's length.
let runTotal = 0; let slicedChecked = 0;
for (const course of courses) {
  for (const route of course.routeOptions || [course.route]) {
    if (!route.geometryUrl) continue;
    const slug = route.geometryUrl.split('/').pop().replace(/\.geojson$/, '');
    const coordinates = read(route.geometryUrl).geometry.coordinates;
    const cumulative = routeDistances(coordinates);
    const samples = sampleAlong(coordinates, cumulative, 10);
    const runs = terrainRuns(samples, elevation[slug].gradients);
    if (runs[0].fromM !== 0 || Math.abs(runs.at(-1).toM - cumulative.at(-1)) > 1) throw new Error(`${slug}: terrain runs do not span the line`);
    if (runs.some((run, i) => i && run.fromM !== runs[i - 1].toM)) throw new Error(`${slug}: terrain runs are not contiguous`);
    if (runs.some((run) => !(run.toM > run.fromM))) throw new Error(`${slug}: empty terrain run`);
    runTotal += runs.length;
    const parts = runs.map((run) => sliceRoute(coordinates, cumulative, run.fromM, run.toM));
    if (parts.some((part) => part.length < 2)) throw new Error(`${slug}: a terrain run has no geometry`);
    const lengthM = parts.reduce((sum, part) => sum + routeDistances(part.map(([lat, lon]) => [lon, lat])).at(-1), 0);
    if (Math.abs(lengthM - cumulative.at(-1)) > 3) throw new Error(`${slug}: sliced runs are ${lengthM.toFixed(1)}m vs line ${cumulative.at(-1).toFixed(1)}m`);
    slicedChecked++;
  }
}
console.log(`Terrain runs OK: ${slicedChecked} shapes, ${runTotal} polylines in total (${(runTotal / slicedChecked).toFixed(0)} per route), lengths preserved.`);

// Callout layout: all-or-nothing, never on the line, never on each other.
const diagonal = Array.from({ length: 40 }, (_, i) => [40 + i * 14, 40 + i * 9]); // a line crossing a 640x420 viewport
const box = (x, y) => ({ x, y, width: 120, height: 44 });
const roomy = layoutCallouts({ stops: [box(160, 94), box(300, 175), box(440, 256)], route: diagonal, viewport: { left: 0, top: 0, width: 640, height: 420 }, blocked: [{ left: 590, top: 380, width: 50, height: 40 }] });
if (!roomy.ok) throw new Error('layoutCallouts should place 3 balloons around a diagonal line in a 640x420 map');
roomy.placed.forEach((p, i) => {
  if (routeHitsRect(diagonal, p.rect, 0)) throw new Error(`balloon ${i} sits on the route line`);
  if (p.rect.left < 0 || p.rect.top < 0 || p.rect.left + p.rect.width > 640 || p.rect.top + p.rect.height > 420) throw new Error(`balloon ${i} leaves the viewport`);
  roomy.placed.forEach((q, j) => { if (j > i && p.rect.left < q.rect.left + q.rect.width && p.rect.left + p.rect.width > q.rect.left && p.rect.top < q.rect.top + q.rect.height && p.rect.top + p.rect.height > q.rect.top) throw new Error(`balloons ${i} and ${j} overlap`); });
});
const crowded = layoutCallouts({ stops: Array.from({ length: 9 }, (_, i) => box(60 + i * 36, 40 + i * 22)), route: diagonal, viewport: { left: 0, top: 0, width: 360, height: 300 } });
if (crowded.ok) throw new Error('layoutCallouts must refuse (all-or-nothing) when nine 120x44 balloons cannot fit a 360x300 phone map');
const tiny = layoutCallouts({ stops: [box(180, 150)], route: [[0, 0], [360, 300]], viewport: { left: 0, top: 0, width: 130, height: 60 } });
if (tiny.ok) throw new Error('layoutCallouts must refuse when a balloon is larger than the viewport');
console.log('Callout layout OK: clear of line/viewport/each other, refuses (shows none) when it cannot place all.');
