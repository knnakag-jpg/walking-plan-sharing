// No.5 Tokyo Racecourse / Fuchu: named OSM features near the course, to replace legacy pins.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bbox = '35.64,139.46,35.69,139.51';
const q = `[out:json][timeout:60];(nwr["railway"~"^(station|halt|stop)$"](${bbox});nwr["name"~"大國魂神社|大国魂神社|東京競馬場|郷土の森|競馬博物館|是政|日本庭園|競馬正門前|けやき並木|あじさい|梅"](${bbox}););out center tags 200;`;
async function run() {
  for (let i = 0; i < 2; i++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
    if (res.ok) return res.json();
    await new Promise((r) => setTimeout(r, 20000));
  }
  throw new Error('Overpass failed');
}
const j = await run();
const items = j.elements.map((e) => { const c = e.center || e; return { type: e.type, id: e.id, name: e.tags?.name || null, kind: e.tags?.railway || e.tags?.tourism || e.tags?.amenity || e.tags?.leisure || e.tags?.highway || null, lat: +(c.lat ?? 0).toFixed(5), lon: +(c.lon ?? 0).toFixed(5) }; });
fs.writeFileSync(path.join(root, 'data/research/no-5-osm-poi.json'), JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) console.log(x.type, x.id, x.name, x.kind, x.lat, x.lon);
