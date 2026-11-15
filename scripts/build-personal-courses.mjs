// 個人散歩の新案を作る：OSM上の名前付き地点（駅・展望・公園）を歩道へ寄せ、Valhalla歩行者で一筆書きにする。
// 結果は data/personal/<id>.json（台帳用スペック）と data/routes/<slug>.geojson に書く。
// 座標は OSM の実在ノード/ウェイのみ。距離合わせの延伸はしない。宿泊は未予約の方針欄のみ（具体的な宿名は作らない）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ONLY = process.argv[2] ? new Set(process.argv.slice(2)) : null;
const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });

const pts = {
  sendai: P('sendai', '仙台駅', 38.25975, 140.88002, 'OSM node 264415884 station'),
  nishikoen: P('omachi_nishikoen', '大町西公園駅', 38.259, 140.86446, 'OSM node 3651059967 station'),
  kokusai: P('kokusai_center', '国際センター駅', 38.26025, 140.85678, 'OSM node 3594254135 station'),
  jouseki: P('sendai_castle', '仙台城跡', 38.25365, 140.85546, 'OSM node 4782747521 仙台城跡'),
  joMinami: P('sendai_castle_south', '仙台城跡南（バス停）', 38.25113, 140.85485, 'OSM node 3521468493 bus_stop'),
  atago: P('atago_shrine', '愛宕神社', 38.24587, 140.87552, 'OSM way 246449487 愛宕神社'),
  nagamachi: P('nagamachi', '長町駅', 38.2268, 140.88556, 'OSM node 3570916496 station'),
  kitasendai: P('kita_sendai', '北仙台駅', 38.28176, 140.86969, 'OSM node 3585108876 station'),
  toshogu: P('toshogu_station', '東照宮駅', 38.27736, 140.8864, 'OSM node 3585108737 station'),
  ishinomakiSt: P('ishinomaki', '石巻駅', 38.43524, 141.3038, 'OSM node 3570916493 station'),
  mangakan: P('ishinomori_mangakan', '石ノ森萬画館', 38.42958, 141.31076, 'OSM node 1217256687 museum'),
  hiyoriyama: P('hiyoriyama', '日和山公園', 38.42322, 141.30805, 'OSM way 318426659 park centre; entrance needs map review'),
  watanoha: P('watanoha', '渡波駅', 38.41984, 141.36501, 'OSM node 264404860 station'),
  yui: P('yui', '由比駅', 35.09719, 138.55295, 'OSM node 3999393709 station'),
  satta: P('satta_pass', '薩埵峠（展望）', 35.06592, 138.53931, 'OSM node 12303563079 viewpoint'),
  okitsu: P('okitsu', '興津駅', 35.05256, 138.52197, 'OSM node 3999393692 station'),
  numazu: P('numazu', '沼津駅', 35.10313, 138.85934, 'OSM node 3999393691 station'),
  senbon: P('senbonhama', '千本浜公園', 35.09429, 138.84766, 'OSM node 5772244871 park'),
  byuo: P('byuo', 'びゅうお', 35.08134, 138.85456, 'OSM node 14234231494 attraction'),
  kanuki: P('kanukiyama', '香貫山', 35.09225, 138.87759, 'OSM node 3281418319 peak'),
};

// plan: 旅行レギュレーションの前提（撮影優先・鉄道＋徒歩・駅近の個室宿・コンビニ）。具体的な宿名・予約は作らない。
const lodging = (hub) => ({ policy: 'ビジネスホテルまたは快活CLUBのナイト12時間パック（鍵付完全個室・フラット、100V電源・CPAP可）を駅徒歩10分以内で。WEB予約は無料キャンセル期限内で仮押さえ。', hub, status: '未予約（候補探しのみ。宿名・料金は未確認）', luggage: 'CPAPと着替えは拠点駅のコインロッカーへ。' });
const specs = [
  { id: 'P-SD1', title: '仙台駅発着・青葉城跡の見晴らし周遊', mode: 'loop', stops: [pts.sendai, pts.kokusai, pts.jouseki, pts.nishikoen, pts.sendai], targetM: 6750, tags: ['展望', '城跡', '川', '個人散歩', '周遊'], summary: '仙台駅を出て広瀬川を渡り青葉城跡の見晴らしへ上り、西公園側へ下って駅へ戻る周遊。', plan: { mode: 'station_loop', hub: '仙台駅', photo: '城跡の展望は朝の順光側を狙う。時間帯・太陽の向きは未計算。', transit: '仙台駅発着。JR・地下鉄の乗車は不要（徒歩のみ）。', lodging: lodging('仙台駅'), food: 'コンビニ。地域限定商品は未調査。' } },
  { id: 'P-SD2', title: '長町駅から国際センター駅へ・愛宕と青葉城跡の駅間', mode: 'oneway', stops: [pts.nagamachi, pts.atago, pts.jouseki, pts.kokusai], targetM: 6500, tags: ['展望', '城跡', '川', '個人散歩', '駅間'], summary: '長町駅から愛宕神社、仙台城跡南を経て城跡の見晴らしへ。国際センター駅へ下りる駅間ワンウェイ。', plan: { mode: 'station_to_station', hub: '仙台駅（宿・コインロッカー）', photo: '長町駅を朝に出発し、城跡へ午前中に着く順。時間帯・太陽の向きは未計算。', transit: '仙台駅→長町駅はJR（普通）、ゴールは地下鉄東西線の国際センター駅。', lodging: lodging('仙台駅'), food: 'コンビニ。' } },
  { id: 'P-SD3', title: '北仙台駅から仙台駅へ・東照宮を通る駅間', mode: 'oneway', stops: [pts.kitasendai, pts.toshogu, pts.sendai], targetM: null, tags: ['神社', '街並み', '個人散歩', '駅間'], summary: '北仙台駅から東照宮駅の東照宮を経て仙台駅へ。計算上の距離をそのまま記載する（距離合わせの延伸はしない）。', plan: { mode: 'station_to_station', hub: '仙台駅', photo: '東照宮の参道は朝の斜光を想定。未計算。', transit: '仙台駅→北仙台駅は仙山線（または地下鉄南北線）。', lodging: lodging('仙台駅'), food: 'コンビニ。' } },
  { id: 'P-IS1', title: '石巻駅から渡波駅へ・日和山の見晴らしと港町', mode: 'oneway', stops: [pts.ishinomakiSt, pts.hiyoriyama, pts.watanoha], targetM: 6600, tags: ['港', '川', '展望', '個人散歩', '駅間'], summary: '石巻駅から日和山公園の見晴らしへ上り、港町を東へ歩いて渡波駅へ抜ける。', plan: { mode: 'station_to_station', hub: '石巻駅', photo: '日和山からの旧北上川と港は午前の順光側。未計算。', transit: '仙台駅→石巻駅は仙石線、ゴールの渡波駅からは石巻線で石巻駅へ。', lodging: lodging('石巻駅'), food: 'コンビニ（地域限定商品は未調査）。' } },
  { id: 'P-SZ1', title: '由比駅から興津駅へ・薩埵峠の富士と駿河湾', mode: 'oneway', stops: [pts.yui, pts.satta, pts.okitsu], targetM: 6500, tags: ['展望', '海', '富士山', '個人散歩', '駅間'], summary: '由比駅から薩埵峠の展望へ上り、東海道本線沿いに興津駅へ下る駅間。峠道の歩道状況は未確認。', plan: { mode: 'station_to_station', hub: '静岡駅または沼津駅', photo: '薩埵峠の富士と海は朝の順光側を想定。未計算。', transit: '東海道本線（普通）。青春18きっぷ向き。', lodging: lodging('静岡駅'), food: 'コンビニ。' } },
  { id: 'P-NM1', title: '沼津駅発着・千本浜とびゅうおの海辺周遊', mode: 'loop', stops: [pts.numazu, pts.senbon, pts.byuo, pts.numazu], targetM: 6500, tags: ['海', '展望', '個人散歩', '周遊'], summary: '沼津駅から千本浜公園の海岸線、びゅうお水門の見晴らしを経て駅へ戻る周遊。', plan: { mode: 'station_loop', hub: '沼津駅', photo: '千本浜の富士と海は朝の順光側を想定。未計算。', transit: '東海道本線（普通）で沼津駅へ。', lodging: lodging('沼津駅'), food: 'コンビニ。' } },
];

// 往復・距離の理由（方針：必要な往復は理由を明記して可。距離合わせの往復は不可）。原因は反復検出の位置からの推定で、地図・現地では未確認。
const notes = {
  'P-SD1': { retraceException: '西公園付近で同じ道を約200m重ねる。大町西公園駅のピンを通るための出入りと見られ、地図で別の抜け道がないか未確認。距離合わせの往復ではない。' },
  'P-SD2': { distanceException: '計算上7.65km。目標6.5km前後より長い。愛宕神社から城跡への登りの経路をそのまま採用し、距離合わせの延伸は作らない。' },
  'P-SD3': { retraceException: '東照宮駅のピン付近で約200m重ねる（駅と神社の出入り）。距離は約4.5kmで目標に届かないが、延伸は作らない。', distanceException: '計算上4.51km。北仙台駅から仙台駅への最短に近い流れを優先し、距離合わせの延伸は作らない。' },
  'P-IS1': { distanceException: '計算上8.46km。目標6.6km前後より長い。日和山公園から渡波駅までの経路（6.45km）をそのまま採用した。' },
  'P-SZ1': { retraceException: '薩埵峠の展望ピン付近で約660m重ねる。展望地点が本道から外れた位置にあり、同じ道を戻る必要があるためと見られる（地図・現地で未確認）。距離合わせではない。', distanceException: '計算上8.13km。目標6.5km前後より長い。薩埵峠の展望を経由する最短の経路で、距離合わせの延伸は作らない。' },
  'P-NM1': { retraceException: 'びゅうお付近で約800m重ねる（うち約660mが水門の先への出入り）。水門の先端が行き止まりと見られ、同じ道を戻る必要があるためで、距離合わせではない。先端まで入らない場合は短くなる（地図で未確認）。' },
};
const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway|secondary|primary';
const rad = (n) => n * Math.PI / 180;
const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const lengthM = (p) => p.slice(1).reduce((s, v, i) => s + meters(p[i], v), 0);
const repeatedM = (p) => {
  const e = new Map();
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1].map((n) => n.toFixed(5)).join(','); const b = p[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const k = a < b ? a + '|' + b : b + '|' + a;
    const v = e.get(k) || { c: 0, l: meters(p[i - 1], p[i]) };
    v.c++; e.set(k, v);
  }
  return [...e.values()].reduce((s, v) => s + Math.max(0, v.c - 1) * v.l, 0);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const snapCache = path.join(root, 'data/research/personal-walkway-snap.json');
let known = fs.existsSync(snapCache) ? JSON.parse(fs.readFileSync(snapCache, 'utf8')) : {};
async function snap(points) {
  const missing = [...new Map(points.filter((p) => !known[p.id]).map((p) => [p.id, p])).values()];
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => `way(around:70,${p.coord[0]},${p.coord[1]})["highway"~"^(${WALKWAY})$"];`).join('') + ');out geom;';
    let res;
    for (let i = 0; i < 3; i++) {
      res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
      if (res.ok) break;
      await wait(20000);
    }
    if (!res.ok) throw new Error('Overpass HTTP ' + res.status);
    const ways = (await res.json()).elements.filter((e) => e.geometry);
    for (const p of missing) {
      let best = null;
      for (const w of ways) for (const v of w.geometry) { const d = meters(p.coord, [v.lat, v.lon]); if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id, highway: w.tags?.highway }; }
      known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId, highway: best.highway } : { snapped: null };
    }
    fs.writeFileSync(snapCache, JSON.stringify(known, null, 1));
  }
  return points.map((p) => (known[p.id]?.snapped ? { ...p, original: p.coord, coord: known[p.id].snapped, snap: known[p.id] } : { ...p, original: p.coord, snap: { snapped: null } }));
}
async function route(points) {
  const legs = [];
  for (let i = 0; i < points.length - 1; i += 9) {
    const chunk = points.slice(i, i + 10);
    const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
    if (!res.ok) throw new Error('Valhalla HTTP ' + res.status);
    const json = await res.json();
    if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 200));
    legs.push(...json.trip.legs);
    await wait(1200);
  }
  const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
  return { shape, distanceM: lengthM(shape), engineM: legs.reduce((s, l) => s + l.summary.length * 1000, 0), legKm: legs.map((l) => l.summary.length) };
}

fs.mkdirSync(path.join(root, 'data/personal'), { recursive: true });
for (const spec of specs) {
  if (ONLY && !ONLY.has(spec.id)) continue;
  const stops = await snap(spec.stops);
  const r = await route(stops);
  const rep = repeatedM(r.shape);
  const slug = spec.id.toLowerCase();
  const offsets = stops.map((p) => Math.min(...r.shape.map((s) => meters(p.coord, s))));
  const calculatedAt = new Date().toISOString();
  fs.writeFileSync(path.join(root, `data/routes/${slug}.geojson`), JSON.stringify({ type: 'Feature', id: `${slug}-personal`, properties: { courseId: spec.id, routeVariant: 'personal', verificationStatus: 'routed', reviewNote: 'Pins are OSM named nodes snapped to the nearest walkway; map review pending', engine: 'valhalla-pedestrian', calculatedAt, distanceM: Math.round(r.distanceM), engineDistanceM: Math.round(r.engineM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: r.shape.map(([lat, lon]) => [lon, lat]) } }));
  const out = { ...spec, ...(notes[spec.id] || {}), slug, geometryUrl: `data/routes/${slug}.geojson`, distanceM: Math.round(r.distanceM), engineDistanceM: Math.round(r.engineM), repeatedGeometryM: Math.round(rep), calculatedAt, legKm: r.legKm.map((v) => Math.round(v * 100) / 100), stops: stops.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, osmCentre: p.original, movedToWalkwayM: p.snap.movedM ?? null, source: p.source, offsetM: Math.round(offsets[i]) })) };
  fs.writeFileSync(path.join(root, `data/personal/${slug}.json`), JSON.stringify(out, null, 2));
  console.log(spec.id, spec.title, (r.distanceM / 1000).toFixed(2) + ' km', 'repeat ' + Math.round(rep) + ' m', 'legs ' + out.legKm.join(' '), 'maxOffset ' + Math.round(Math.max(...offsets)) + ' m');
}
