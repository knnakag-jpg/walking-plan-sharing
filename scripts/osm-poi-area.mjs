// 駅・公園・寺社の名前付き地点を OSM から取り、駅・施設中心の座標を手掛かりに候補を選ぶ（入口ではないので採用前に地図レビュー）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const [s, w, n, e] = spec.bbox;
const q = `[out:json][timeout:90];(nwr["railway"~"^(station|halt)$"](${s},${w},${n},${e});nwr["name"~"${spec.names}"](${s},${w},${n},${e}););out center tags 400;`;
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const items = j.elements.map((x) => {
  const c = x.center || x;
  const t = x.tags || {};
  return { t: x.type[0], id: x.id, name: t.name || null, kind: t.railway || t.leisure || t.tourism || t.amenity || t.historic || t.place || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) };
}).filter((x) => x.name);
const uniq = [...new Map(items.map((x) => [x.name, x])).values()];
fs.writeFileSync(path.join(root, `data/research/${spec.id}-osm-poi.json`), JSON.stringify({ checkedAt: new Date().toISOString(), bbox: spec.bbox, source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
console.log(spec.id, 'stations', uniq.filter((x) => ['station', 'halt'].includes(x.kind)).map((x) => x.name).join('|'));
console.log(spec.id, 'features', uniq.filter((x) => !['station', 'halt'].includes(x.kind)).map((x) => x.name + '(' + x.kind + ')').join('|'));
