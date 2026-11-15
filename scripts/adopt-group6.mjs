// 第6グループ（No.31, No.33, No.34, No.35, No.36）を台帳へ。Bは作らず、理由をAの説明に書く。
// No.33〜35 は地下通路の座標が OSM になく、地上の駅・施設を結ぶ案。地下通路の座標は作らない。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const UG = '地下通路の座標はOSMにないため経路には含めていない（地上の駅・施設の前を通る徒歩経路のみ）。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・施設・公園の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });

const C = {
  'no-31': {
    title: '赤坂見附から四ツ谷・紀尾井の谷底', summary: '赤坂見附駅から弁慶橋、紀尾井町、上智大学の前を経て四ツ谷駅へ抜ける短い駅間。清水谷公園と喰違見附跡は名称の点が見つからず、経由点に含めていない。旧案の四谷三栄町方面の往復延伸は採らない。',
    themes: ['谷', '橋', '坂道', '堀'], reason: '赤坂見附駅から弁慶橋、紀尾井町、上智大学、四ツ谷駅へ。計算上1.88km。清水谷公園と喰違見附跡は名称ノードが見つからず、座標を作らずに含めていない。' + B_NO,
    distance: '1.88km。実在の立ち寄り先だけで組んだため5〜6kmに届かない。旧案の往復延伸は座標を作る必要があるため採らない。',
    retrace: '計算上の重なりは0m。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は赤坂見附駅の構内通路と四ツ谷駅のコンコースを中心にした短縮案。連続した屋内徒歩コースとしては未検証。', segments: [{ kind: 'walk_outdoor', from: '赤坂見附駅', to: '弁慶橋', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '赤坂見附駅', to: '駅構内の通路', distanceM: null, note: '構内の連続性は未確認。' }, { kind: 'rail', from: '四ツ谷駅', to: '赤坂見附駅', distanceM: null, note: '地下鉄丸ノ内線。' }], conditions: ['弁慶橋の歩道と堀端の路面は雨天で濡れやすい。', '紀尾井ホールの公演日は当日確認。'] },
    evidence: [osm('赤坂見附駅・弁慶橋・紀尾井町・上智大学・四ツ谷駅'), old('No.31', '四谷三栄町方面の往復延伸は採用していない。')],
    open: ['清水谷公園と喰違見附跡の座標（OSMに名称ノードなし）', '紀尾井ホールの位置', '弁慶橋の歩道', '紀尾井町から四ツ谷駅への歩道'],
    decision: '2026-11-16 新Aを計算（1.88km・反復0m）。清水谷公園・喰違見附跡は名称ノードがなく含めていない。',
  },
  'no-33': {
    title: '東京駅周辺（地上の周回）', summary: '東京駅丸の内側の動輪の広場から二重橋前、大手町、KITTE、東京国際フォーラム、日比谷公園を結ぶ地上の周回。旧案の地下周回は、' + UG,
    themes: ['駅', '建築', '広場', '公園', '都心'], reason: '動輪の広場から東京駅丸の内中央口、二重橋前駅、大手町駅前、KITTE、東京国際フォーラム西、日比谷公園へ。計算上4.15km。' + UG + B_NO,
    distance: '4.15km。地上の駅・施設を結ぶ案で5〜6kmに届かない。地下通路の座標を作る延伸は採らない。',
    retrace: '東京駅丸の内中央口から二重橋前駅へ向かう区間で約148m、他に約22mの短い重なり（計約185m）。駅前広場と改札の出入りで生じる往復と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は東京駅の地下街・丸の内の地下通路を中心にする案（本来の旧案）。地下通路の座標は取れていないため、距離は未確定。', segments: [{ kind: 'walk_indoor', from: '東京駅', to: '丸ビル・新丸ビル（地下通路）', distanceM: null, note: '地下通路の連続性・営業時間は当日確認。' }, { kind: 'walk_indoor', from: '丸ビル', to: 'KITTE', distanceM: null, note: '地下接続の有無は未確認。' }, { kind: 'walk_outdoor', from: 'KITTE', to: '東京国際フォーラム', distanceM: null, note: '地上の屋根なし区間あり。' }], conditions: ['地下通路の開放時間は当日確認。', '工事で通路が変わる可能性がある。'] },
    evidence: [osm('東京駅・動輪の広場・KITTE・東京国際フォーラム・大手町駅前・日比谷公園'), old('No.33', '地下周回と北通路方面の往復延伸は採用していない。')],
    open: ['東京駅丸の内側の地下通路の座標（OSMにない）', '丸ビル・新丸ビルの屋内動線', '東京国際フォーラム内の通り抜け', '日比谷国際ビル・日比谷仲通りの位置'],
    decision: '2026-11-16 地上の周回として新Aを計算（4.15km・反復185m）。地下通路は座標を作れないため案から外した。',
  },
  'no-34': {
    title: '新宿駅周辺（地上の周回）', summary: '新宿駅南口から新宿の目、西口ロータリー、西新宿一丁目、東口、新宿三丁目を結ぶ地上の周回。旧案の地下周回は、' + UG,
    themes: ['駅', '都心', '芸術', '街並み'], reason: '新宿駅南口から新宿の目（アート）、新宿西口ロータリー、西新宿一丁目、新宿駅東口、新宿三丁目へ。計算上2.61km。' + UG + B_NO,
    distance: '2.61km。地上の駅・施設を結ぶ案で5〜6kmに届かない。地下通路の座標を作る延伸は採らない。',
    retrace: '西新宿一丁目付近で約67m、他に約23mの短い重なり（計約92m）。交差点の横断で生じる往復と推定。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は新宿駅の地下通路（メトロプロムナード・サブナード・京王モール）を中心にする案（本来の旧案）。地下通路の座標は取れていないため、距離は未確定。', segments: [{ kind: 'walk_indoor', from: '新宿駅東口', to: 'メトロプロムナード・サブナード', distanceM: null, note: '地下通路の連続性は当日確認。' }, { kind: 'walk_indoor', from: '新宿駅', to: '地下東西自由通路・京王モール', distanceM: null, note: '連続性は未確認。' }, { kind: 'walk_outdoor', from: '西新宿', to: '新宿駅西口', distanceM: null, note: '屋根のない区間あり。' }], conditions: ['地下通路の開放時間・工事は当日確認。', '新宿駅は構造が複雑で迷いやすい。'] },
    evidence: [osm('新宿駅南口・新宿の目・新宿西口ロータリー・西新宿・新宿駅東口・新宿三丁目'), old('No.34', '地下周回は採用していない。')],
    open: ['新宿駅の地下通路の座標（OSMにない）', 'サブナード・京王モールの屋内動線', '新宿の目の位置', '新宿西口ロータリーの歩行者動線'],
    decision: '2026-11-16 地上の周回として新Aを計算（2.61km・反復92m）。地下通路は座標を作れないため案から外した。',
  },
  'no-35': {
    title: '池袋駅周辺（地上の周回）', summary: '池袋駅から駅東口、サンシャイン前、サンシャイン国際水族館、東池袋中央公園、東池袋駅を結ぶ地上の周回。旧案の地下周回は、' + UG,
    themes: ['駅', '水族館', '公園', '街並み'], reason: '池袋駅から駅東口、サンシャイン前、サンシャイン国際水族館、東池袋中央公園、東池袋駅へ。計算上2.20km。' + UG + B_NO,
    distance: '2.20km。地上の駅・施設を結ぶ案で5〜6kmに届かない。地下通路の座標を作る延伸は採らない。',
    retrace: 'サンシャイン国際水族館から東池袋中央公園へ向かう区間で約117m、他に約62mの短い重なり（計約179m）。施設の出入口と公園の入口を行き来する形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は池袋駅の地下通路（Echika池袋・ISP）とサンシャインシティの館内を中心にする案（本来の旧案）。地下通路の座標は取れていないため、距離は未確定。', segments: [{ kind: 'walk_indoor', from: '池袋駅', to: 'Echika池袋・地下通路', distanceM: null, note: '地下通路の連続性は当日確認。' }, { kind: 'walk_indoor', from: 'サンシャインシティ', to: '館内', distanceM: null, note: '営業時間・水族館の入場料は当日確認。' }, { kind: 'walk_outdoor', from: 'サンシャイン前', to: '東池袋中央公園', distanceM: null, note: '屋根なし。' }], conditions: ['サンシャイン国際水族館の営業は当日確認。', '地下通路の工事は当日確認。'] },
    evidence: [osm('池袋駅・サンシャイン前・サンシャイン国際水族館・東池袋中央公園・東池袋駅'), old('No.35', '地下周回とみたけ通り方面の往復延伸は採用していない。')],
    open: ['池袋駅の地下通路の座標（OSMにない）', 'いけふくろう・豊島区役所・ダイヤゲート池袋の位置', 'サンシャインシティの屋内動線', '大塚駅前の地上短区間'],
    decision: '2026-11-16 地上の周回として新Aを計算（2.20km・反復179m）。地下通路は座標を作れないため案から外した。',
  },
  'no-36': {
    title: '多摩川 丸子橋・浅間神社', summary: '多摩川駅から丸子橋、沼部駅、下丸子駅を経て蒲田駅へ抜ける駅間。浅間神社と多摩川大橋・六郷橋の名称ノードが見つからず含めていない。旧案の右岸堤防路の往復延伸は採らない。',
    themes: ['川', '橋', '堤防', '駅間'], reason: '多摩川駅から丸子橋、沼部駅、下丸子駅を経て蒲田駅へ。計算上6.23km。多摩川の堤防路の位置は未確認のため、名称付きの駅と橋のみを経由点にした。浅間神社と多摩川大橋・六郷橋は名称ノードが見つからず含めていない。' + B_NO,
    distance: '6.23km。5〜6kmを少し超えるが、駅と橋を結んだ自然な駅間で、切り詰めはしない。',
    retrace: '計算上の重なりは約45m（沼部駅と下丸子駅の出入口付近）。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は駅から駅へ電車で移動し、多摩川沿いの歩きを短縮する案。堤防路は屋根がなく強風に注意。', segments: [{ kind: 'walk_outdoor', from: '多摩川駅', to: '丸子橋', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'rail', from: '沼部駅', to: '蒲田駅', distanceM: null, note: '東急多摩川線。' }, { kind: 'walk_indoor', from: '蒲田駅', to: '駅ビル・駅前アーケード', distanceM: null, note: '屋根のある通路の有無は未確認。' }], conditions: ['堤防路は増水時に立入規制がある。', '強風時は丸子橋の歩道が危険。'] },
    evidence: [osm('多摩川駅・丸子橋・沼部駅・下丸子駅・蒲田駅'), old('No.36', '右岸堤防路の往復延伸は採用していない。')],
    open: ['浅間神社（多摩川浅間神社）の座標', '多摩川大橋・六郷橋の座標', '堤防路の位置と通行条件', '蒲田駅から京急蒲田駅への経路'],
    decision: '2026-11-16 新Aを計算（6.23km・反復45m）。浅間神社と六郷橋は名称ノードがなく含めていない。',
  },
};

const cat = rd('data/catalog.json');
for (const [slug, c] of Object.entries(C)) {
  const build = rd(`data/research/${slug}-route-build.json`);
  const v = build.variants.standard;
  const id = `No.${Number(slug.split('-')[1])}`;
  const buildFile = `data/research/${slug}-adopted-build.json`;
  wr(buildFile, { generatedAt: build.calculatedAt, method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results: [{ variant: 'standard', distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: v.repeatedGeometryPct, waypoints: v.stops.map((s) => ({ id: s.id, label: s.label, coord: s.coord, source: s.source })), legDistancesKm: v.legKm, geometryUrl: v.geometryUrl }] });
  const inRange = v.distanceM >= 5000 && v.distanceM <= 6000;
  wr(`data/curated/${slug}.json`, {
    id, buildFile, title: c.title, summary: c.summary, themes: c.themes,
    routeReasons: { standard: c.reason, extended: B_NO },
    distanceExceptions: inRange ? {} : { standard: c.distance ?? `${(v.distanceM / 1000).toFixed(2)}km。実在の立ち寄り先だけで組んだため5〜6kmの範囲外。延伸は作らない。` },
    retraceExceptions: { standard: c.retrace }, rainy: c.rainy, evidence: c.evidence, openQuestions: c.open,
  });
  const rp = `data/research/${slug}-route-research.json`;
  const r = fs.existsSync(path.join(root, rp)) ? rd(rp) : { id, title: c.title, stage: 'source_research_in_progress', checkedAt: '2026-11-16', evidence: [], trials: [], files: [] };
  r.id = id; r.title = c.title; r.evidence = c.evidence; r.openQuestions = c.open; r.decision = c.decision;
  r.trials = [...(r.trials || []), { n: (r.trials || []).length + 1, variant: 'A 新規（OSMの駅・地点）', result: `${(v.distanceM / 1000).toFixed(2)}km・反復${v.repeatedGeometryM}m`, finding: c.retrace }];
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group6.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
