// No.5 Tokyo Racecourse / Fuchu: one-stroke candidates from named OSM points.
// Legacy route started ~350 m west of the station, never reached 大國魂神社, and repeated 1510 m.
// Pins are building/venue centres, so the output stays "routed_candidate_not_map_reviewed".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
const station = P('seimon_station', '府中競馬正門前駅', 35.66842, 139.48471, 'OSM node 7956324705 station');
const bridge = P('bridge', '東京競馬場連絡歩道橋', 35.66727, 139.48469, 'OSM way 172050737 centre');
const museum = P('jra_museum', 'JRA競馬博物館', 35.66625, 139.48814, 'OSM node 1420800632');
const westgate = P('west_gate', '東京競馬場口（府中本町側）', 35.66617, 139.47738, 'OSM node 2655167442 train_station_entrance of 府中本町');
const shrine = P('okunitama', '大國魂神社', 35.6675, 139.47897, 'OSM way 172007556 centre; entrance needs confirmation');
const kyodoGate = P('kyodo_gate', '郷土の森正門前', 35.65598, 139.4746, 'OSM node 2526032127 bus_stop');
const koremasaBridge = P('koremasa_bridge', '是政橋北', 35.65554, 139.48771, 'OSM node 292640007');
const museumRoad = P('jra_museum_road', 'JRA競馬博物館前（道路側）', 35.66711, 139.4881, 'OSM node 13109040231 bus_stop 競馬博物館; public road side, interior of the racecourse is not routed');
const kyodoSignal = P('kyodo_signal', '郷土の森入口（交差点）', 35.65539, 139.47483, 'OSM node 1054131520 traffic_signals 郷土の森入口; road junction, not a park gate');
const shrineSignal = P('okunitama_signal', '大国魂神社前（交差点）', 35.67001, 139.47909, 'OSM node 1835345346 traffic_signals 大国魂神社前; road junction at the keyaki avenue, not the shrine gate');
const shrineWest = P('okunitama_west', '大国魂神社西（交差点）', 35.6682, 139.47709, 'OSM node 292613513 traffic_signals 大国魂神社西; road junction west of the precinct');
const zuijin = P('zuijinmon', '随神門', 35.66821, 139.47901, 'OSM way 172007543 historic 随神門');
const ootorii = P('ootorii', '大鳥居（大国魂神社前）', 35.67001, 139.47909, 'OSM node 1835345346 traffic_signals 大国魂神社前; the 大鳥居 stands at this junction on 旧甲州街道 per the shrine map');
const seimon = P('racecourse_seimon', '競馬場正門前（交差点）', 35.66679, 139.48324, 'OSM node 683442071 traffic_signals; outside the gate');
const tomon = P('racecourse_east', '競馬場東門（バス停）', 35.6664, 139.48955, 'OSM node 13109040237 bus_stop 競馬場東門');
const gateIn = P('gate_in', '東京競馬場 けやき門（正門）内側の歩道', 35.66691, 139.48328, 'OSM way 342309782 footway west end; gate position from user-supplied Google map');
const museumWalk = P('museum_walk', 'JRA競馬博物館前の園内歩道（東門寄り）', 35.6668, 139.4881, 'on OSM way 342309782 footway; museum stands by 東門 per user-supplied Google map (OSM node of the museum is ~85 m south, inside the grounds)');
const higashifuchu = P('higashifuchu', '東府中駅', 35.6689, 139.49515, 'OSM node 7683014978 station; 京王競馬場線 from 東府中 is the weekday access to 東門 (user-supplied web summary, official source not confirmed)');
const eastGate = P('east_gate', '競馬場東門（バス停位置）', 35.6664, 139.48955, 'OSM node 13109040237 bus_stop 競馬場東門; gate position needs map review');
const hommachi = P('fuchu_hommachi', '府中本町駅', 35.66611, 139.4771, 'OSM node 264813956 station');
const fuchu = P('fuchu_station', '府中駅', 35.67222, 139.48001, 'OSM node 7682981674 station');
const keyaki = P('keyaki', '馬場大門のケヤキ並木', 35.67295, 139.47928, 'OSM node 7168610370 monument (天然記念物 馬場大門けやき並木)');
const koremasa = P('koremasa', '是政駅', 35.65631, 139.48932, 'OSM node 412187550 station');

const variants = {
  weekday_east: { label: '非開催日・東府中駅から東門へ（駅→東門→博物館前→東門→是政橋北→郷土の森入口→神社西→随神門→大鳥居→府中駅）', points: [higashifuchu, eastGate, museumWalk, eastGate, koremasaBridge, kyodoSignal, shrineWest, zuijin, ootorii, fuchu] },
  outside_from_higashifuchu: { label: '場外・東府中駅から大鳥居を回って府中駅へ（競馬場に入らない）', points: [higashifuchu, koremasaBridge, kyodoSignal, shrineWest, zuijin, ootorii, fuchu] },
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
  const cache = path.join(root, 'data/research/no-5e-walkway-snap.json');
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
  fs.writeFileSync(path.join(root, 'data/candidates/no-5e-' + key + '.geojson'), JSON.stringify({ type: 'Feature', id: 'No.5-' + key + '-candidate', properties: { courseId: 'No.5', variant: key, status: 'trial_not_adopted', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(r.distanceM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  console.log(variant.label + ': ' + (r.distanceM / 1000).toFixed(2) + ' km, repeated ' + Math.round(rep) + ' m, max stop offset ' + Math.round(Math.max(...offsets)) + ' m, legs(km) ' + r.legKm.map((v) => v.toFixed(2)).join(' '));
}
fs.writeFileSync(path.join(root, 'data/research/no-5e-route-build.json'), JSON.stringify(out, null, 2));
