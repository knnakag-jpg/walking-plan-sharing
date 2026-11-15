// No.5: named OSM features inside/around 大國魂神社 (torii, gates, sando, hall) and the racecourse gates.
import fs from 'node:fs';
const q = '[out:json][timeout:60];(nwr["name"~"大鳥居|随神門|拝殿|本殿|参道|大國魂|大国魂|西大鳥居"](35.665,139.474,35.676,139.486);nwr["historic"](35.667,139.476,35.671,139.481);nwr["name"~"正門|東門|西門|ウインズ|ゲート|入口|競馬場"](35.660,139.478,35.672,139.492););out center tags 120;';
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const items = j.elements.map((e) => { const c = e.center || e; return { type: e.type, id: e.id, name: e.tags?.name || null, kind: e.tags?.historic || e.tags?.amenity || e.tags?.highway || e.tags?.building || e.tags?.leisure || null, lat: +(c.lat).toFixed(5), lon: +(c.lon).toFixed(5) }; }).filter((x) => x.name);
fs.writeFileSync('data/research/no-5-osm-shrine.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) console.log(x.type[0] + x.id, x.name, x.kind, x.lat, x.lon);
