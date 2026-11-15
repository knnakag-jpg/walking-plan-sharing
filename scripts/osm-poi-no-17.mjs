// No.17 麻布台ヒルズ～東京タワー: named OSM features for the legacy out-and-back extension.
import fs from 'node:fs';
const q = '[out:json][timeout:60];(nwr["railway"="station"](35.645,139.72,35.685,139.765);nwr["railway"="subway_entrance"](35.645,139.72,35.685,139.765);nwr["name"~"麻布台ヒルズ|ヒルズ|東京タワー|芝公園|増上寺|御成門|神谷町|六本木|虎ノ門|愛宕|日比谷線|アザブダイニング|中央広場|チームラボ|デジタルアート"](35.645,139.72,35.685,139.765););out center tags 200;';
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const items = j.elements.map((e) => { const c = e.center || e; return { t: e.type[0], id: e.id, name: e.tags?.name || null, kind: e.tags?.railway || e.tags?.tourism || e.tags?.leisure || e.tags?.highway || e.tags?.building || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; });
fs.writeFileSync('data/research/no-17-osm-poi.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) if (x.name) console.log(x.t + x.id, x.name, x.kind, x.lat, x.lon);
