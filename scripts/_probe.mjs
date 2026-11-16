import fs from 'node:fs';
import { overpass } from './lib-rebuild.mjs';
const areas = {
  S1: [[35.695, 139.50, 35.715, 139.59], '三鷹駅|武蔵境駅|東小金井駅|玉川上水|仙川|井の頭通り|三鷹通り|ののみち|武蔵小金井駅'],
  S4: [[35.66, 139.66, 35.71, 139.71], '高井戸|久我山|三鷹台|井の頭公園駅|井の頭池|吉祥寺駅|神田川|関町'],
  S6: [[35.695, 139.62, 35.715, 139.68], '中野駅|高円寺|阿佐ヶ谷|荻窪駅|桃園川|青梅街道|中野通り'],
  S11: [[35.66, 139.35, 35.70, 139.41], '旭が丘中央公園|高倉町|北八王子駅|大和田橋|片倉駅|鑓水|みなみ野|八王子みなみ野駅'],
  S13: [[35.64, 139.38, 35.70, 139.42], '旭が丘中央公園|北八王子駅|湯殿川|浅川|新浅川橋|万願寺駅|川崎街道|高幡不動駅|高幡不動尊'],
};
for (const [id, [bbox, names]] of Object.entries(areas)) {
  let items; try { items = await overpass(bbox, names); } catch (e) { console.log(id, 'FAIL'); continue; }
  fs.writeFileSync(`data/research/${id.toLowerCase()}-osm-poi.json`, JSON.stringify({ checkedAt: new Date().toISOString(), bbox, source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', items }, null, 1));
  const uniq = [...new Map(items.map((x) => [x.name, x])).values()].filter((x) => ['station','halt','park','garden','place_of_worship','information','viewpoint'].includes(x.kind) || /橋|駅|公園/.test(x.name));
  console.log('##', id, uniq.map((x) => x.name + '(' + x.kind + ') ' + x.lat + ',' + x.lon).join(' | ').slice(0, 900));
  await new Promise((r) => setTimeout(r, 7000));
}
