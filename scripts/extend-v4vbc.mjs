// 6km 未満の V4/VBC を、周辺の名称付き観光地点（OSM）を既存の順路の間に足して延ばす。
// 追加は直線で見た迂回が小さい地点だけ。組み直した後の重なりは where-repeats で確認する。
import { P, buildCourse, rd, meters, lengthM } from './lib-rebuild.mjs';
const [slug, courseId, target = '6300'] = process.argv.slice(2);
const build = rd(`data/research/${slug}-route-build.json`);
let stops = build.variants.standard.stops.map((s) => P(s.id, s.label, s.coord[0], s.coord[1], s.source));
const lats = stops.map((s) => s.coord[0]), lons = stops.map((s) => s.coord[1]);
const [s, w, n, e] = [Math.min(...lats) - 0.006, Math.min(...lons) - 0.007, Math.max(...lats) + 0.006, Math.max(...lons) + 0.007];
const q = `[out:json][timeout:90];(nwr["tourism"~"^(attraction|museum|gallery|viewpoint)$"]["name"](${s},${w},${n},${e});nwr["leisure"="park"]["name"](${s},${w},${n},${e});nwr["historic"~"^(castle|ruins|monument|building|archaeological_site)$"]["name"](${s},${w},${n},${e});nwr["amenity"="place_of_worship"]["name"~"神社|寺|院|宮|天満|不動"](${s},${w},${n},${e}););out center tags 300;`;
let j; for (let i = 0; i < 5; i++) { const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) }); if (r.ok) { j = await r.json(); break; } await new Promise((x) => setTimeout(x, 20000)); }
const have = new Set(stops.map((x) => x.label));
const seen = new Set();
let cands = j.elements.map((el) => { const c = el.center || el; const t = el.tags; return { name: t.name, coord: [+(+c.lat).toFixed(5), +(+c.lon).toFixed(5)], kind: t.tourism || t.leisure || t.historic || t.amenity }; }).filter((c) => !have.has(c.name) && !seen.has(c.name) && seen.add(c.name) && !/公衆|トイレ|駐車|教会|幼稚園|[0-9０-９一二三四五六七八九十]丁目|児童遊園|ガスの科学館|Viewpoint|Terrace|[A-Za-z]{4,}/.test(c.name));
let cur = build.variants.standard;
let accepted = stops.slice();
let trials = 0, lastOk = true;
while (cur.distanceM < +target && cands.length && trials < 14) {
  let best = null;
  for (const c of cands) for (let k = 1; k < accepted.length; k++) {
    const d = meters(accepted[k - 1].coord, c.coord) + meters(c.coord, accepted[k].coord) - meters(accepted[k - 1].coord, accepted[k].coord);
    if (!best || d < best.d) best = { d, c, k };
  }
  if (!best || best.d > 600) break;
  cands = cands.filter((c) => c !== best.c); trials++;
  const trial = accepted.slice(); trial.splice(best.k, 0, P(`x${trials}`, best.c.name, best.c.coord[0], best.c.coord[1], `OSM ${best.c.kind} ${best.c.name}`));
  let res;
  try { res = (await buildCourse({ courseId, slug, variants: { standard: trial } })).variants.standard; } catch (err) { console.log('skip', best.c.name, String(err).slice(0, 60)); lastOk = false; continue; }
  const ok = res.repeatedGeometryPct <= Math.max(9.5, cur.repeatedGeometryPct) && res.distanceM > cur.distanceM && res.distanceM - cur.distanceM < 2500;
  console.log(ok ? 'accept' : 'reject', best.c.name, res.distanceM, res.repeatedGeometryPct);
  if (ok) { accepted = trial; cur = res; lastOk = true; } else lastOk = false;
}
if (!lastOk) await buildCourse({ courseId, slug, variants: { standard: accepted } });
console.log('final', slug, cur.distanceM, cur.repeatedGeometryPct);
