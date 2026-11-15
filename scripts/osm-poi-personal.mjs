// Personal-course candidates (先行ページの個人系 + 今回は新案の駅探索) — named OSM stations only.
import fs from 'node:fs';
const groups = {
  sendai: ['仙台駅', '長町駅', '北仙台駅', '榴ヶ岡駅', '大年寺山公園', '榴岡公園', '仙台東照宮', '愛宕神社', '青葉城跡', '仙台城跡', '西公園', '定禅寺通', 'AER'],
  ishinomaki: ['石巻駅', '渡波駅', '日和山公園', '石ノ森萬画館', '石巻南浜津波復興祈念公園', '内海橋', 'マンガロード', '陸前山下駅', '蛇田駅', '石巻あゆみ野駅'],
  suruga: ['由比駅', '興津駅', '薩埵峠', '沼津駅', '千本浜公園', 'びゅうお', '香貫山', '大浜駅', '原駅'],
};
for (const [name, names] of Object.entries(groups)) {
  const q = '[out:json][timeout:60];(' + names.map((n) => `nwr["name"="${n}"];`).join('') + ');out center tags 60;';
  let j;
  for (let i = 0; i < 3; i++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q.replace('";', '"') }) });
    if (res.ok) { j = await res.json(); break; }
    if (res.status === 400) break;
    await new Promise((r) => setTimeout(r, 20000));
  }
  if (!j) { console.log(name + ': query failed'); continue; }
  const items = j.elements.map((e) => { const c = e.center || e; return { t: e.type[0], id: e.id, name: e.tags?.name, kind: e.tags?.railway || e.tags?.leisure || e.tags?.tourism || e.tags?.amenity || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; });
  fs.writeFileSync(`data/research/personal-${name}-osm-poi.json`, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
  console.log(name, items.length);
  for (const x of items) console.log('  ', x.t + x.id, x.name, x.kind, x.lat, x.lon);
  await new Promise((r) => setTimeout(r, 2000));
}
