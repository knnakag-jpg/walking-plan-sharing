// No.5: walkable ways inside the racecourse grounds (north concourse, 正門→東門/博物館).
import fs from 'node:fs';
const q = '[out:json][timeout:60];way["highway"~"^(footway|path|pedestrian|service|steps|track|living_street)$"](35.6655,139.4825,35.6690,139.4900);out geom tags;';
let j;
for (let i = 0; i < 3; i++) {
  const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
  if (res.ok) { j = await res.json(); break; }
  await new Promise((r) => setTimeout(r, 20000));
}
if (!j) throw new Error('Overpass failed');
const ways = j.elements.map((w) => ({ id: w.id, highway: w.tags.highway, name: w.tags.name || null, access: w.tags.access || null, foot: w.tags.foot || null, nodes: w.geometry.length, from: [w.geometry[0].lat, w.geometry[0].lon], to: [w.geometry.at(-1).lat, w.geometry.at(-1).lon] }));
fs.writeFileSync('data/research/no-5-inside-paths.json', JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', ways }, null, 1));
console.log(ways.length, 'ways');
for (const w of ways) console.log(w.id, w.highway, w.name, w.access, w.foot, w.nodes, w.from.map((n) => n.toFixed(5)).join(','), '->', w.to.map((n) => n.toFixed(5)).join(','));
