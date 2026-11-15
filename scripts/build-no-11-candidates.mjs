// No.11 Toyosu: one-stroke candidates from named OSM points (千客万来 / 屋上緑化広場 / ぐるり公園 / 六丁目公園 / 豊洲駅).
// Pins are venue centres, so output stays routed_candidate_not_map_reviewed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const ichiba = P('ichibamae', '市場前駅', 35.64576, 139.78578, 'OSM node 3349961082 station');
const senkyaku = P('senkyaku', '千客万来', 35.64546, 139.78366, 'OSM way 1159017723 centre; entrance needs confirmation');
const ashiyu = P('ashiyu', '千客万来 足湯庭園（8F）', 35.64611, 139.78319, 'OSM node 13110259613 public_bath 千客万来足湯; hours/fee not confirmed');
const okujo = P('okujo', '豊洲市場 屋上緑化広場', 35.64371, 139.78081, 'OSM way 1202384855 centre; 5:00-23:00 free per user-supplied web summary, not official');
const gururi = P('gururi_s', '豊洲ぐるり公園（市場南側の水際）', 35.64369, 139.78763, 'OSM node 11374672984 information board');
const rokuchome = P('rokuchome', '豊洲六丁目公園（テプコ豊洲ビル外観を望む）', 35.64651, 139.79089, 'OSM node 11374672985 information; TEPCO building is not enterable (user-supplied, not official)');
const teamlab = P('teamlab', 'teamLab Planets 付近', 35.64938, 139.78973, 'OSM node 6291685287; paid museum, entry not assumed');
const shintoyosu = P('shintoyosu', '新豊洲駅', 35.64875, 139.79019, 'OSM node 3349961084 station');
const toyosu = P('toyosu', '豊洲駅', 35.65443, 139.79589, 'OSM node 1131996015 subway_entrance');
const toyosuPark = P('toyosu_park', '豊洲公園', 35.65361, 139.7937, 'OSM way 22823726 centre');
const variants = {
  direct: { label: 'A 市場前→屋上緑化広場→千客万来→六丁目公園→豊洲駅', points: [ichiba, okujo, senkyaku, rokuchome, toyosuPark, toyosu] },
  direct_ashiyu: { label: 'B 足湯庭園経由', points: [ichiba, okujo, ashiyu, rokuchome, toyosuPark, toyosu] },
};

const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway';
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (pts) => pts.slice(1).reduce((s, v, i) => s + meters(pts[i], v), 0);
const repeatedM = (pts) => {
  const edges = new Map();
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1].map((n) => n.toFixed(5)).join(',');
    const b = pts[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const k = a < b ? a + '|' + b : b + '|' + a;
    const e = edges.get(k) || { c: 0, l: meters(pts[i - 1], pts[i]) };
    e.c++;
    edges.set(k, e);
  }
  return [...edges.values()].reduce((s, e) => s + Math.max(0, e.c - 1) * e.l, 0);
};

async function snapAll(points) {
  const cache = path.join(root, 'data/research/no-11-walkway-snap.json');
  const all = new Map(points.map((p) => [p.id, p]));
  let known = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : {};
  const missing = [...all.values()].filter((p) => !known[p.id]);
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => 'way(around:70,' + p.coord[0] + ',' + p.coord[1] + ')["highway"~"^(' + WALKWAY + ')$"];').join('') + ');out geom;';
    let res;
    for (let i = 0; i < 2; i++) {
      res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
      if (res.ok) break;
      await new Promise((r) => setTimeout(r, 20000));
    }
    if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
    const ways = (await res.json()).elements.filter((e) => e.geometry);
    for (const p of missing) {
      let best = null;
      for (const w of ways) for (const v of w.geometry) {
        const d = meters(p.coord, [v.lat, v.lon]);
        if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id, highway: w.tags?.highway, name: w.tags?.name };
      }
      known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId, highway: best.highway, name: best.name || null } : { snapped: null };
    }
    fs.writeFileSync(cache, JSON.stringify({ checkedAt: new Date().toISOString(), source: 'OpenStreetMap via Overpass API; © OpenStreetMap contributors', ...known }, null, 1));
    known = JSON.parse(fs.readFileSync(cache, 'utf8'));
  }
  return (list) => list.map((p) => {
    const k = known[p.id];
    return k?.snapped ? { ...p, coord: k.snapped, original: p.coord, snap: k } : { ...p, original: p.coord, snap: { snapped: null } };
  });
}

// Valhalla's public demo caps locations at 10 per request: chunk with a shared endpoint.
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error('Valhalla HTTP ' + res.status);
    const json = await res.json();
    if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 250));
    legs.push(...json.trip.legs);
    await new Promise((r) => setTimeout(r, 1200));
  }
  const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
  const engineM = legs.reduce((s, leg) => s + leg.summary.length * 1000, 0);
  const distanceM = lengthM(shape);
  if (Math.abs(distanceM - engineM) > Math.max(30, distanceM * .02)) throw new Error('engine/shape distance mismatch');
  return { shape, distanceM, engineM, legKm: legs.map((leg) => leg.summary.length) };
}

const out = { calculatedAt: new Date().toISOString(), engine: 'valhalla-pedestrian', variants: {} };
const everyPoint = [...new Map(Object.values(variants).flatMap((v) => v.points).map((p) => [p.id, p])).values()];
const snap = await snapAll(everyPoint);
for (const [key, variant] of Object.entries(variants)) {
  variant.points = snap(variant.points);
  const r = await route(variant.points);
  const rep = repeatedM(r.shape);
  const offsets = variant.points.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  out.variants[key] = {
    label: variant.label,
    distanceM: Math.round(r.distanceM),
    engineDistanceM: Math.round(r.engineM),
    repeatedGeometryM: Math.round(rep),
    legKm: r.legKm.map((v) => Math.round(v * 100) / 100),
    maxStopOffsetM: Math.round(Math.max(...offsets)),
    stops: variant.points.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, osmCentre: p.original, movedToWalkwayM: p.snap.movedM ?? null, walkway: p.snap.snapped ? { wayId: p.snap.wayId, highway: p.snap.highway, name: p.snap.name } : null, source: p.source, offsetM: Math.round(offsets[i]) })),
  };
  fs.writeFileSync(path.join(root, 'data/candidates/no-11-' + key + '.geojson'), JSON.stringify({ type: 'Feature', id: 'No.11-' + key + '-candidate', properties: { courseId: 'No.11', variant: key, status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  console.log(variant.label + ': ' + (r.distanceM / 1000).toFixed(2) + ' km, repeated ' + Math.round(rep) + ' m, max stop offset ' + Math.round(Math.max(...offsets)) + ' m, legs(km) ' + r.legKm.map((v) => v.toFixed(2)).join(' '));
}
fs.writeFileSync(path.join(root, 'data/research/no-11-route-build.json'), JSON.stringify(out, null, 2));
