// 有明アリーナコース (reference only: stops order from the public course page; route is built here, not copied).
import fs from 'node:fs';
const q = '[out:json][timeout:60];(nwr["name"~"^(新豊洲駅|有明アリーナ|晴海大橋|築地大橋|浜離宮恩賜庭園|芝公園駅|東京タワー|大門駅|浜松町駅|汐留|勝どき橋|勝どき駅|増上寺|旧芝離宮恩賜庭園|芝公園)$"](35.62,139.73,35.67,139.80););out center tags 80;';
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const items = j.elements.map((e) => { const c = e.center || e; return { id: e.type[0] + e.id, name: e.tags.name, kind: e.tags.railway || e.tags.tourism || e.tags.leisure || e.tags.highway || e.tags.bridge || e.tags.building || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; });
fs.writeFileSync('data/research/ariake-arena-osm-poi.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
for (const x of items) console.log(x.id, x.name, x.kind, x.lat, x.lon);
