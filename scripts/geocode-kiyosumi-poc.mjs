// One-time, sequential research lookup. Results are cached and never queried by site visitors.
// Public Nominatim policy: https://operations.osmfoundation.org/policies/nominatim/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'data', 'research', 'kiyosumi-geocoding.json');
fs.mkdirSync(path.dirname(output), { recursive: true });
const queries = [
  ['kiyosumi_station', '清澄白河駅 東京都'],
  ['kiyosumi_garden', '清澄庭園 江東区'],
  ['fukagawa_museum', '深川江戸資料館 江東区'],
  ['basho_museum', '江東区芭蕉記念館 東京都'],
  ['hokusai_museum', 'すみだ北斎美術館 墨田区'],
  ['kinshicho_station', '錦糸町駅 墨田区'],
  ['mot', '東京都現代美術館 江東区'],
  ['kameido_tenjin', '亀戸天神社 江東区'],
  ['kameido_station', '亀戸駅 江東区'],
];
const results = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')).results : {};
for (const [id, query] of queries) {
  if (results[id]?.candidates?.length) { console.log(`${id}: cached`); continue; }
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({ q: query, format: 'json', limit: '2', 'accept-language': 'ja' }).toString();
  const response = await fetch(url, { headers: { 'User-Agent': 'WalkingAtlasRouteResearch/0.1' } });
  if (!response.ok) { console.warn(`${query}: HTTP ${response.status}; leaving unresolved`); continue; }
  results[id] = { query, candidates: (await response.json()).map(({ osm_type, osm_id, name, display_name, lat, lon }) => ({ osm_type, osm_id, name, display_name, lat: Number(lat), lon: Number(lon) })) };
  console.log(`${id}: ${results[id].candidates[0]?.name ?? 'NOT FOUND'}`);
  fs.writeFileSync(output, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap Nominatim; © OpenStreetMap contributors', results }, null, 2));
  await new Promise((resolve) => setTimeout(resolve, 1200));
}
