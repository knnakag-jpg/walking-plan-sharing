// 第3グループ（No.14, No.15, No.16, No.18）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';

const C = {
  'no-14': {
    title: '大宮の氷川参道と大宮公園',
    summary: '大宮駅から氷川参道を北上して武蔵一宮氷川神社、大宮公園へ。公園の東口から大宮公園駅へ抜ける。鉄道博物館はニューシャトル（鉄道博物館駅）が最寄りで、今回の徒歩経路には含めない。',
    themes: ['神社', '参道', '公園', '桜', '野球場'],
    reason: '大宮駅から氷川参道の二の鳥居・三の鳥居を北上し、武蔵一宮氷川神社の境内、大宮公園、公園東口を経て大宮公園駅へ。参道は約2kmの一直線で、同じ道を戻らない。' + B_NO,
    retrace: '計算上の重なりは約46m（神社境内・公園内の分岐戻り）。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は氷川参道の樹の下を歩き、鉄道博物館の館内を中心にする案。館内の連続歩行距離は未計測。', segments: [{ kind: 'walk_outdoor', from: '大宮駅', to: '氷川神社', distanceM: null, note: '参道の舗装側は樹木で雨が当たりにくいが、屋根はない。' }, { kind: 'rail', from: '大宮駅', to: '鉄道博物館駅', distanceM: null, note: 'ニューシャトル。運行・運賃は当日確認。' }, { kind: 'walk_indoor', from: '鉄道博物館', to: '館内', distanceM: null, note: '開館日・料金・予約を当日公式で確認。' }], conditions: ['鉄道博物館の開館日・料金は当日確認。', 'ニューシャトルの運行状況は当日確認。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（大宮駅・氷川参道・氷川神社・大宮公園・大宮公園駅）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・参道・神社・公園の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.14（先行ページ index.html）', url: null, checkedAt: '2026-11-16', supports: '旧案の立ち寄り先。堀の内町方面の往復延伸は採用していない。' }],
    open: ['氷川参道の舗装側（歩行者専用）の歩道と車道の区分', '武蔵一宮氷川神社の境内の入口と拝観条件', '大宮公園の小動物園・野球場周辺の開放状況', '鉄道博物館を含める場合の徒歩接続（駅から徒歩約1km）'],
    decision: '2026-11-16 新Aを計算。氷川参道を北上して大宮公園駅へ抜ける一方向。旧案の堀の内町方面の往復延伸と鉄道博物館の昼食は不採用。',
  },
  'no-15': {
    title: '天王洲アイル 水辺アートと北品川',
    summary: '天王洲アイル駅から天王洲公園、運河沿いの天王洲橋を経て、品川浦の北品川舟だまり、北品川駅、新馬場駅へ抜ける短い駅間。運河沿いの歩道・ボードウォークの位置は地図で未確認。',
    themes: ['水辺', 'アート', '運河', '街並み'],
    reason: '天王洲アイル駅から天王洲公園、天王洲橋、品川浦（北品川舟だまり）、北品川駅を経て新馬場駅へ。計算上2.48km。天王洲運河沿いのボードウォークは名称ノードが見つかったが、歩道としては経由せず、運河沿いの道路を通った。' + B_NO,
    distance: '2.48km。駅間の短い案で5〜6kmに届かない。延伸は作らない。',
    retrace: '計算上の重なりは約5m。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は天王洲アイル駅周辺のギャラリー・館内展示を中心にする案。運河沿いのボードウォークは屋根がない。', segments: [{ kind: 'walk_outdoor', from: '天王洲アイル駅', to: '倉庫改装のギャラリー群', distanceM: null, note: '屋根のない区間あり。傘が必要。' }, { kind: 'walk_indoor', from: 'ギャラリー群', to: '館内', distanceM: null, note: '各館の営業日・料金を当日確認。' }, { kind: 'rail', from: '北品川駅', to: '天王洲アイル駅', distanceM: null, note: '京急・りんかい線の乗り換え。' }], conditions: ['各ギャラリーの営業日は当日確認。', '運河沿いの歩道は雨天で濡れやすい。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（天王洲アイル駅・天王洲公園・天王洲橋・品川浦・北品川駅・新馬場駅）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・公園・橋の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.15（先行ページ index.html）', url: null, checkedAt: '2026-11-16', supports: '旧案の立ち寄り先。広町一丁目方面の往復延伸は採用していない。' }],
    open: ['天王洲運河沿いのボードウォークの歩道の位置', '倉庫改装ギャラリー・壁画エリアの座標（OSMに名称ノードなし）', '品川浦の舟だまりの岸の歩行可否', '天王洲アイル駅の出口'],
    decision: '2026-11-16 新Aを計算（2.48km・反復5m）。運河を一周する旧案は往復が大きく不採用。',
  },
  'no-16': {
    title: '横須賀 ヴェルニー公園と三笠公園',
    summary: '横須賀駅からヴェルニー公園、汐入桟橋、汐入駅、三笠公園、記念艦みかさを経て横須賀中央駅へ。どぶ板通りの名称ノードが見つからず、経由点に含めていない。軍港めぐりの遊覧船は徒歩経路に含めない。',
    themes: ['軍港', '公園', '歴史', '海辺', '艦'],
    reason: '横須賀駅からヴェルニー公園、汐入桟橋、汐入駅、三笠公園、記念艦みかさを経て横須賀中央駅へ。計算上3.97km。軍港めぐり（遊覧船）は鉄道の駅間にはなく、徒歩経路に含めない。どぶ板通りは名称ノードが見つからないため含めていない。' + B_NO,
    distance: '3.97km。実在の立ち寄り先だけで組んだため5〜6kmに届かない。どぶ板通りの座標を作る延伸は採らない。',
    retrace: 'ヴェルニー公園内で約86m、汐入駅の出入りで約175m、三笠公園内で約103m・約26m（計約429m）。公園や駅の出入口が道路側へ戻る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は記念艦みかさの艦内と横須賀市自然・人文博物館の館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '横須賀駅', to: 'ヴェルニー公園', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '記念艦みかさ', to: '艦内', distanceM: null, note: '開館日・料金を当日公式で確認。' }, { kind: 'rail', from: '横須賀中央駅', to: '横須賀駅', distanceM: null, note: '京急・JRの乗り換え。' }], conditions: ['記念艦みかさの開館日は当日確認。', '軍港めぐりは天候による欠航がある。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（横須賀駅・ヴェルニー公園・汐入・三笠公園・記念艦みかさ・横須賀中央駅）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・公園・艦の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.16（先行ページ index.html）', url: null, checkedAt: '2026-11-16', supports: '旧案の立ち寄り先。' }],
    open: ['どぶ板通りの座標（OSMに名称ノードが見つからない）', 'ヴェルニー公園から汐入桟橋への海沿い遊歩道', '三笠公園から横須賀中央駅への経路（海岸通り・どぶ板）', '軍港めぐりの乗船場の位置'],
    decision: '2026-11-16 新Aを計算（3.97km・反復429m）。どぶ板通りは名称ノードがなく含めていない。',
  },
  'no-18': {
    title: '小石川後楽園と東京ドームシティ',
    summary: '茗荷谷駅から小石川後楽園、東京ドームシティ、水道橋駅を通り、神田川沿いに聖橋、御茶ノ水駅へ抜ける駅間。昼食と館内展示を前提にした旧案の工程は採らず、屋外の通過だけを計算した。',
    themes: ['庭園', '川', '橋', '街並み', 'ドーム'],
    reason: '茗荷谷駅から小石川後楽園入口、園内、東京ドームシティ、水道橋駅、神田川沿いを経て聖橋、御茶ノ水駅へ。計算上5.98km。園内は主要園路のみで、庭園の有料区の通行と出入口は地図レビュー待ち。' + B_NO,
    retrace: '計算上の重なりは約389m（庭園の入口付近と東京ドームシティ周辺）。出入口が道路側へ戻る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は東京ドームシティの館内（ラクーア・スパ）と小石川後楽園の東屋を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '茗荷谷駅', to: '小石川後楽園', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '東京ドームシティ', to: 'ラクーア館内', distanceM: null, note: '営業時間は当日確認。' }, { kind: 'rail', from: '水道橋駅', to: '御茶ノ水駅', distanceM: null, note: 'JR中央線。' }], conditions: ['小石川後楽園の開園日・入園料は当日確認。', '神田川沿いの歩道は雨天で濡れやすい。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（茗荷谷駅・小石川後楽園・東京ドームシティ・水道橋駅・聖橋・御茶ノ水駅）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・庭園・橋の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.18（先行ページ index.html）', url: null, checkedAt: '2026-11-16', supports: '旧案の立ち寄り先。' }],
    open: ['小石川後楽園の開園日・入園料・出入口', '東京ドームシティから神田川沿いへの経路', '神田川沿いの遊歩道の連続性', '御茶ノ水橋と聖橋の歩道'],
    decision: '2026-11-16 新Aを計算（5.98km・反復389m）。昼食・IP系施設の館内見学は案から外した。',
  },
};

const cat = rd('data/catalog.json');
for (const [slug, c] of Object.entries(C)) {
  const build = rd(`data/research/${slug}-route-build.json`);
  const variants = build.variants;
  const v = variants.standard;
  const id = `No.${Number(slug.split('-')[1])}`;
  const buildFile = `data/research/${slug}-adopted-build.json`;
  wr(buildFile, { generatedAt: build.calculatedAt, method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results: [{ variant: 'standard', distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: v.repeatedGeometryPct, waypoints: v.stops.map((s) => ({ id: s.id, label: s.label, coord: s.coord, source: s.source })), legDistancesKm: v.legKm, geometryUrl: v.geometryUrl }] });
  const inRange = v.distanceM >= 5000 && v.distanceM <= 6000;
  wr(`data/curated/${slug}.json`, {
    id, buildFile, title: c.title, summary: c.summary, themes: c.themes,
    routeReasons: { standard: c.reason, extended: B_NO },
    distanceExceptions: inRange ? {} : { standard: c.distance ?? `${(v.distanceM / 1000).toFixed(2)}km。実在の立ち寄り先だけで組んだため5〜6kmに届かない。延伸は作らない。` },
    retraceExceptions: { standard: c.retrace }, rainy: c.rainy, evidence: c.evidence, openQuestions: c.open,
  });
  const rp = `data/research/${slug}-route-research.json`;
  const r = fs.existsSync(path.join(root, rp)) ? rd(rp) : { id, title: c.title, stage: 'source_research_in_progress', checkedAt: '2026-11-16', evidence: [], trials: [], files: [] };
  r.id = id; r.title = c.title; r.evidence = c.evidence; r.openQuestions = c.open; r.decision = c.decision;
  r.trials = [...(r.trials || []), { n: (r.trials || []).length + 1, variant: 'A 新規（OSMの駅・地点）', result: `${(v.distanceM / 1000).toFixed(2)}km・反復${v.repeatedGeometryM}m`, finding: c.retrace }];
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group3.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
