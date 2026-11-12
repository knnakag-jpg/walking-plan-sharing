// Bounded OSM lookup for the garden extension of No.32; centres need review.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-32-garden-poi.json');
if (fs.existsSync(output) && !process.argv.includes('--refresh')) { console.log('Using cached No.32 garden candidates'); process.exit(0); }
const bbox = '35.698,139.733,35.712,139.755';
const names = '水道橋駅|小石川後楽園|東門|西門|大泉水|唐門';
const query = `[out:json][timeout:25];(nwr["name"~"${names}"](${bbox});node["barrier"="gate"](35.702,139.746,35.708,139.752);node["entrance"](35.702,139.746,35.708,139.752););out center tags;`;
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
const data = await response.json();
const features = data.elements.map((element) => ({ type: element.type, osmId: element.id, name: element.tags?.name, lat: element.lat ?? element.center?.lat, lon: element.lon ?? element.center?.lon, tags: element.tags }));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', bbox, query, note: 'Garden gates and visitor paths need map review.', features }, null, 2));
console.log(`${features.length} No.32 garden features`);
