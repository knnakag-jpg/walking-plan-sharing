// No.11 Toyosu: named OSM features for 千客万来 / 市場 / ぐるり公園 / teamLab / stations.
import fs from 'node:fs';
const bbox = '35.636,139.775,35.662,139.812';
const q = '[out:json][timeout:60];(nwr["name"~"千客万来|豊洲市場|豊洲ぐるり公園|豊洲公園|豊洲六丁目公園|テプコ|チームラボ|teamLab|ゆりかもめ|市場前|新豊洲|豊洲駅|豊洲ぐるり|見学者|ウォーターフロント|屋上緑化|足湯|ららぽーと豊洲|アーバンドック|豊洲大橋|ぐるり"](' + bbox + '););out center tags 200;';
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const items = j.elements.map((e) => { const c = e.center || e; return { type: e.type[0], id: e.id, name: e.tags?.name || null, kind: e.tags?.railway || e.tags?.tourism || e.tags?.leisure || e.tags?.amenity || e.tags?.highway || e.tags?.building || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; }).filter((x) => x.name);
fs.writeFileSync('data/research/no-11-osm-poi.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) console.log(x.type + x.id, x.name, x.kind, x.lat, x.lon);
