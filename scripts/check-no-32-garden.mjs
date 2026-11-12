// Screen whether the calculated B line actually crosses the mapped garden.
// This is geometry QA, not an entrance, opening-hours or field verification.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-32-garden-check.json');
const route = JSON.parse(fs.readFileSync(path.join(root, 'data/routes/no-32-extended.geojson'), 'utf8')).geometry.coordinates;
let polygon = fs.existsSync(output) && !process.argv.includes('--refresh') ? JSON.parse(fs.readFileSync(output, 'utf8')).polygon : null;
if (!polygon) {
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
    body: new URLSearchParams({ data: '[out:json][timeout:25];way(20028327);out geom;' }),
  });
  if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
  const data = await response.json();
  const way = data.elements.find((element) => element.type === 'way' && element.id === 20028327);
  if (!way?.geometry?.length) throw new Error('garden way geometry missing');
  polygon = way.geometry.map(({ lon, lat }) => [lon, lat]);
}
const gates = [
  { id: 'east', point: [139.7513341, 35.7040336] },
  { id: 'west', point: [139.7477674, 35.7049655] },
];
const nearestIndex = (point) => route.reduce((best, value, index) => {
  const distance = Math.hypot((value[0] - point[0]) * 91000, (value[1] - point[1]) * 111000);
  return distance < best.distanceM ? { index, distanceM: distance } : best;
}, { index: -1, distanceM: Infinity });
const pointInPolygon = ([x, y]) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const located = gates.map((gate) => ({ ...gate, ...nearestIndex(gate.point) }));
const [start, end] = located.map(({ index }) => index).sort((a, b) => a - b);
if (start < 0 || end <= start) throw new Error('garden gate order invalid');
let insideM = 0, outsideM = 0;
for (let i = start + 1; i <= end; i++) {
  const a = route[i - 1], b = route[i];
  const length = Math.hypot((b[0] - a[0]) * 91000, (b[1] - a[1]) * 111000);
  const middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (pointInPolygon(middle)) insideM += length; else outsideM += length;
}
const result = { checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', osmGardenWay: 20028327, method: 'B route segment between nearest east/west gate shape vertices; midpoint-in-polygon screening', gates: located, insideM: Math.round(insideM), outsideM: Math.round(outsideM), insidePct: Number((insideM / (insideM + outsideM) * 100).toFixed(1)), note: 'Polygon containment does not prove that the line follows open visitor paths or that the two gates are correctly identified.', polygon };
fs.writeFileSync(output, JSON.stringify(result, null, 2));
console.log(`Garden segment ${Math.round(insideM + outsideM)}m; ${result.insidePct}% inside mapped garden`);
