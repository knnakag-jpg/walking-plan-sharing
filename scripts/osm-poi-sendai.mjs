import fs from 'node:fs';
const q = '[out:json][timeout:60];(node["railway"="station"](38.20,140.80,38.32,140.95);nwr["name"~"大年寺山|榴岡公園|東照宮|青葉城|仙台城|定禅寺|西公園|大橋|AER|愛宕大橋"](38.20,140.80,38.32,140.95);node["railway"="subway_entrance"]["name"~"西公園"](38.20,140.80,38.32,140.95););out center tags 80;';
let j;
for (let i = 0; i < 3; i++) {
  const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (r.ok) { j = await r.json(); break; }
  await new Promise((res) => setTimeout(res, 20000));
}
const items = j.elements.map((e) => { const c = e.center || e; return { t: e.type[0], id: e.id, name: e.tags?.name, kind: e.tags?.railway || e.tags?.leisure || e.tags?.tourism || e.tags?.highway || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; });
fs.writeFileSync('data/research/personal-sendai-osm-poi.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) console.log(x.t + x.id, x.name, x.kind, x.lat, x.lon);
