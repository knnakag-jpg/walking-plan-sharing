// Bounded OSM lookup for the Kanda River extension of No.32.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-32-kanda-poi.json');
if (fs.existsSync(output) && !process.argv.includes('--refresh')) { console.log('Using cached No.32 Kanda candidates'); process.exit(0); }
const bbox = '35.695,139.750,35.709,139.773';
const names = '御茶ノ水駅|お茶の水橋|御茶ノ水橋|水道橋|元町公園|聖橋';
const query = `[out:json][timeout:25];(nwr["name"~"${names}"](${bbox}););out center tags;`;
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
const data = await response.json();
const features = data.elements.map((element) => ({ type: element.type, osmId: element.id, name: element.tags?.name, lat: element.lat ?? element.center?.lat, lon: element.lon ?? element.center?.lon, tags: element.tags }));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', bbox, query, features }, null, 2));
console.log(`${features.length} No.32 Kanda features`);
