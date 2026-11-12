// One bounded OSM POI lookup for manual coordinate review; not used by site visitors.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-12-osm-poi-extended.json');
if (fs.existsSync(output)) { console.log(`${output}: cached`); process.exit(0); }
const query = '[out:json][timeout:25];(nwr["name"~"玉川上水駅|玉川上水口|砂川口|日本庭園|こもれびの里|花の丘"](35.68,139.37,35.75,139.46););out center tags;';
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'User-Agent': 'WalkingAtlasRouteResearch/0.1' },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
const json = await response.json();
const results = json.elements.map(({ type, id, lat, lon, center, tags }) => ({ type, id, name: tags.name, lat: lat ?? center?.lat, lon: lon ?? center?.lon, tags: { railway: tags.railway, tourism: tags.tourism, leisure: tags.leisure, entrance: tags.entrance } }));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', bounds: [35.68,139.37,35.75,139.46], results }, null, 2));
console.log(`${results.length} named POI candidates`);
