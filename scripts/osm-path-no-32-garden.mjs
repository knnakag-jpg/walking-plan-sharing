// Bounded OSM footpath geometry research inside and around Koishikawa Korakuen.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-32-garden-paths.json');
if (fs.existsSync(output) && !process.argv.includes('--refresh')) { console.log('Using cached garden paths'); process.exit(0); }
const bbox = '35.7038,139.7475,35.707,139.7515';
const query = `[out:json][timeout:25];way["highway"~"^(footway|path)$"](${bbox});out geom tags;`;
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
const data = await response.json();
const ways = data.elements.map((element) => ({ osmId: element.id, tags: element.tags, coordinates: element.geometry.map(({ lat, lon }) => [lon, lat]) }));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', bbox, query, ways }, null, 2));
console.log(`${ways.length} garden-area footpaths`);
