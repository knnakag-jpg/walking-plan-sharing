// Bounded OSM lookup for one-stroke route examples. Centres are not entrances.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/representative-poi.json');
if (fs.existsSync(output) && !process.argv.includes('--refresh')) {
  console.log('Using cached representative OSM candidates');
  process.exit(0);
}
const cases = [
  { id: 'No.17', bbox: '35.65,139.725,35.675,139.755', names: '神谷町駅|麻布台ヒルズ|東京タワー|増上寺|芝公園駅|御成門駅|赤羽橋駅|チームラボボーダレス|teamLab Borderless' },
  { id: 'No.11', bbox: '35.635,139.775,35.665,139.815', names: '市場前駅|豊洲 千客万来|豊洲ぐるり公園|豊洲駅|新豊洲駅|チームラボプラネッツ|teamLab Planets' },
  { id: 'No.23', bbox: '35.635,139.85,35.67,139.885', names: '葛西臨海公園駅|葛西臨海水族園|クリスタルビュー|鳥類園|葛西臨海公園|ダイヤと花の大観覧車|西なぎさ' },
];
const query = `[out:json][timeout:30];(${cases.map((item) => `nwr["name"~"${item.names}"](${item.bbox});`).join('')});out center tags;`;
let response;
let endpoint;
for (const url of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
  endpoint = url;
  response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
    body: new URLSearchParams({ data: query }),
  });
  if (response.ok || ![502, 503, 504].includes(response.status)) break;
}
if (!response.ok) throw new Error(`Overpass HTTP ${response.status} at ${endpoint}`);
const data = await response.json();
const features = data.elements.map((element) => ({
  type: element.type, osmId: element.id, name: element.tags?.name,
  lat: element.lat ?? element.center?.lat, lon: element.lon ?? element.center?.lon,
  tags: element.tags,
}));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', endpoint, query, note: 'Way centres are not pedestrian entrances and must be checked on a map.', features }, null, 2));
console.log(`${features.length} named OSM candidates`);
