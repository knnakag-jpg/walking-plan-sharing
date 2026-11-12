// One-time research geocoding. Cached results; no visitor-side calls.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data/research/no-12-geocoding.json');
const queries = [
  ['tachikawa_station', '立川駅 東京都'],
  ['faret', 'ファーレ立川 東京都'],
  ['green_springs', 'GREEN SPRINGS 立川'],
  ['akebono_gate', '昭和記念公園 あけぼの口'],
  ['tachikawa_gate', '昭和記念公園 立川口'],
  ['fureai', '昭和記念公園 ふれあい広場'],
  ['waterfowl_pond', '昭和記念公園 水鳥の池'],
  ['japanese_garden', '昭和記念公園 日本庭園'],
  ['nishitachikawa_gate', '昭和記念公園 西立川口'],
  ['nishitachikawa_station', '西立川駅 東京都'],
  ['musashisunagawa_station', '武蔵砂川駅 立川市 東京都'],
];
const results = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')).results : {};
for (const [id, query] of queries) {
  if (Object.hasOwn(results, id) && !process.argv.includes('--retry-missing')) { console.log(`${id}: cached`); continue; }
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({ q: query, format: 'json', limit: '2', 'accept-language': 'ja' }).toString();
  const response = await fetch(url, { headers: { 'User-Agent': 'WalkingAtlasRouteResearch/0.1' } });
  if (!response.ok) { results[id] = { query, candidates: [], errorStatus: response.status }; console.warn(`${id}: HTTP ${response.status}`); fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap Nominatim; © OpenStreetMap contributors', results }, null, 2)); await new Promise((resolve) => setTimeout(resolve, 1200)); continue; }
  results[id] = { query, candidates: (await response.json()).map(({ osm_type, osm_id, name, display_name, lat, lon }) => ({ osm_type, osm_id, name, display_name, lat: Number(lat), lon: Number(lon) })) };
  console.log(`${id}: ${results[id].candidates[0]?.display_name ?? 'NOT FOUND'}`);
  fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap Nominatim; © OpenStreetMap contributors', results }, null, 2));
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
