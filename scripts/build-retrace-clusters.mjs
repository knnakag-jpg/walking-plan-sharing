import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { routeDistances } from '../atlas/assets/route-playback.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file));
const reported = JSON.parse(read('data/research/retrace-reports.json'));
const courses = JSON.parse(read('data/catalog.json')).courses;
const cases = reported.courseIds.map((id) => {
  const course = courses.find((item) => item.id === id);
  if (!course) throw new Error(`missing reported course: ${id}`);
  const body = read(course.route.geometryUrl);
  const coordinates = JSON.parse(body).geometry.coordinates;
  const cumulative = routeDistances(coordinates);
  const visits = new Map();
  for (let i = 1; i < coordinates.length; i++) {
    const edge = [coordinates[i - 1].join(','), coordinates[i].join(',')].sort().join('|');
    visits.set(edge, [...(visits.get(edge) || []), i]);
  }
  const repeated = [];
  for (let i = 1; i < coordinates.length; i++) {
    const edge = [coordinates[i - 1].join(','), coordinates[i].join(',')].sort().join('|');
    if (visits.get(edge)[0] !== i) repeated.push({ index: i, meters: cumulative[i] - cumulative[i - 1] });
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
  return {
    courseId: id, title: course.title, geometryUrl: course.route.geometryUrl,
    geometrySha256: crypto.createHash('sha256').update(body).digest('hex'),
    repeatedExactM: Math.round(repeated.reduce((sum, edge) => sum + edge.meters, 0)),
    clusters: clusters.map(({ firstIndex, lastIndex, repeatedM, start, end }) => ({ firstIndex, lastIndex, repeatedM: Math.round(repeatedM), start, end })),
    status: 'geometry_screening_only',
  };
});
const output = { generatedAt: reported.reportedAt, method: 'Exact repeated undirected coordinate edges at six-decimal precision; clusters follow the saved route order. This does not identify OSM road edges or safe alternatives.', cases };
fs.writeFileSync(path.join(root, 'data/research/retrace-clusters.json'), JSON.stringify(output, null, 2));
console.log(`Screened ${cases.length} user-reported routes, ${cases.reduce((sum, item) => sum + item.clusters.length, 0)} repeated-edge clusters.`);
