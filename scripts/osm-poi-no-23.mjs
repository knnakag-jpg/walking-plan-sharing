// No.23 葛西臨海公園: named OSM features for the loop course.
import fs from 'node:fs';
const q = '[out:json][timeout:60];(nwr["name"~"葛西臨海公園駅|大観覧車|汐風の広場|西なぎさ|クリスタルビュー|鳥類園|汽水池|葛西臨海水族園|総合レクリエーション公園|葛西海浜公園|なぎさ橋|葛西渚橋|地下鉄博物館|バーベキュー|BBQ"](35.635,139.85,35.67,139.88););out center tags 120;';
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const items = j.elements.map((e) => { const c = e.center || e; return { t: e.type[0], id: e.id, name: e.tags?.name || null, kind: e.tags?.leisure || e.tags?.tourism || e.tags?.amenity || e.tags?.railway || e.tags?.bridge || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; }).filter((x) => x.name);
fs.writeFileSync('data/research/no-23-osm-poi.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) console.log(x.t + x.id, x.name, x.kind, x.lat, x.lon);
