// Bounded research query for No.32. OSM centres are candidates, not entrances.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-32-osm-poi.json');
if (fs.existsSync(output) && !process.argv.includes('--refresh')) {
  console.log('Using cached No.32 OSM candidates');
  process.exit(0);
}
const bbox = '35.685,139.713,35.708,139.752';
const names = '飯田橋駅|兵庫横丁|善國寺|善国寺|赤城神社|宮城道雄記念館|外濠公園|曙橋駅|市ケ谷駅|市ヶ谷駅|牛込神楽坂駅|神楽坂駅|かくれんぼ横丁|見番横丁|神楽坂通り|四ツ谷駅|四谷見附橋|牛込見附|市谷見附';
const query = `[out:json][timeout:25];(nwr["name"~"${names}"](${bbox}););out center tags;`;
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
const data = await response.json();
const features = data.elements.map((element) => ({
  type: element.type, osmId: element.id, name: element.tags?.name,
  lat: element.lat ?? element.center?.lat, lon: element.lon ?? element.center?.lon,
  tags: element.tags,
}));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', bbox, query, note: 'Way centres and station features do not identify pedestrian entrances.', features }, null, 2));
console.log(`${features.length} No.32 named features`);
