// Bounded research query for No.8 Ueno museums. OSM centres are candidates, not entrances.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-8-osm-poi.json');
if (fs.existsSync(output) && !process.argv.includes('--refresh')) { console.log('Using cached No.8 OSM candidates'); process.exit(0); }
const bbox = '35.704,139.762,35.735,139.784';
const names = '上野駅|公園口|東京国立博物館|表慶館|国立西洋美術館|国立科学博物館|東京文化会館|上野東照宮|上野動物園|旧寛永寺五重塔|寛永寺|谷中霊園|天王寺|谷中|日暮里駅|西郷隆盛|不忍池|弁天堂|黒田記念館|法隆寺宝物館|東洋館|平成館|本館|上野の森美術館|旧東京音楽学校奏楽堂|国際子ども図書館|朝倉彫塑館|谷中銀座|夕焼けだんだん|御殿坂|上野桜木|桜木|花園稲荷|竹の台';
const query = `[out:json][timeout:30];(nwr["name"~"${names}"](${bbox}););out center tags;`;
const response = await fetch('https://overpass-api.de/api/interpreter', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' },
  body: new URLSearchParams({ data: query }),
});
if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
const data = await response.json();
const features = data.elements.map((e) => ({ type: e.type, osmId: e.id, name: e.tags?.name, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, kind: e.tags?.tourism || e.tags?.railway || e.tags?.amenity || e.tags?.historic || e.tags?.landuse || e.tags?.highway || e.tags?.leisure || '' }));
fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', bbox, query, note: 'Way centres and station features do not identify pedestrian entrances.', features }, null, 2));
console.log(`${features.length} No.8 named features`);
