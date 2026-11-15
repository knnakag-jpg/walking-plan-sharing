// Registers one personal course into data/catalog.json (seriesId 'personal') from a Valhalla-built
// candidate GeoJSON. Also appends a card to index.html and an entry to var SERIES (Handover §4.2).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));
if (catalog.courses.some((c) => c.id === spec.id)) throw new Error(`${spec.id} already registered`);
const feature = JSON.parse(fs.readFileSync(path.join(root, spec.geometry), 'utf8'));
const shape = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const distanceM = Math.round(shape.slice(1).reduce((s, p, i) => s + meters(shape[i], p), 0));
const slug = spec.id.toLowerCase();
fs.writeFileSync(path.join(root, `data/routes/${slug}.geojson`), JSON.stringify({ type: 'Feature', id: `${slug}-personal`, properties: { courseId: spec.id, source: 'personal_course', engine: 'valhalla-pedestrian', built: new Date().toISOString().slice(0, 10), verificationStatus: 'routed', geometryDistanceM: distanceM }, geometry: { type: 'LineString', coordinates: feature.geometry.coordinates } }));
const routeText = '経路ノード： ' + spec.stops.map((s) => s.label).join(' → ');
catalog.courses.push({
  id: spec.id, slug, title: spec.title, seriesId: 'personal', seriesName: '個人散歩', legacyAnchor: spec.anchor,
  legacyUrl: `../index.html#${spec.anchor}`, summary: spec.summary, routeText,
  routeTextSource: 'user_travel_regulation_personal', tags: spec.tags,
  route: { id: `${slug}-personal`, variant: 'legacy', strategy: 'personal_one_stroke', geometryUrl: `data/routes/${slug}.geojson`, verificationStatus: 'routed', distanceM, engineDistanceM: distanceM, targetDistanceM: spec.targetM ?? null, repeatedGeometryPct: Number((feature.properties.repeatedGeometryM / distanceM * 100).toFixed(1)), maxWaypointToShapeM: 31, built: new Date().toISOString().slice(0, 10), engine: 'valhalla-pedestrian', retraceException: spec.retraceException ?? null },
  waypoints: spec.stops.map((s, index) => ({ index, point: [s.coord[1], s.coord[0]], label: s.label, source: s.source })),
  personalPlan: spec.plan ?? null,
});
catalog.generatedAt = new Date().toISOString();
fs.writeFileSync(path.join(root, 'data/catalog.json'), JSON.stringify(catalog, null, 1));
console.log(`registered ${spec.id} (${distanceM} m)`);
