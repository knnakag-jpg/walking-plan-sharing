// 第5グループ（No.25〜No.30）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・施設・公園の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });

const C = {
  'no-25': {
    title: '日本橋・人形町・浜町', summary: '日本橋駅から日本橋（橋の中央）、日本橋魚河岸発祥の地、三井記念美術館、茅場町駅、人形町、水天宮前、浜町公園を結ぶ駅間。清澄白河駅まで続く旧案は座標を作る必要があるため、浜町公園で止めた。COREDO日本橋は2027年秋まで一時閉店のため経由点に含めない。',
    themes: ['橋', '町並み', '歴史', '神社', '美術館'], reason: '日本橋駅から日本橋（橋）、日本橋魚河岸発祥の地、三井記念美術館、茅場町駅、人形町駅、人形町からくり櫓、水天宮前、浜町公園へ。計算上4.07km。COREDO日本橋はOSMで「一時閉店（2027年秋まで）」とあり含めていない。' + B_NO,
    retrace: '計算上の重なりは約94m。日本橋付近の交差点と魚河岸記念碑前の出入りで生じる短い往復と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は三井記念美術館の館内と地下通路（日本橋〜三越前）を中心にする案。', segments: [{ kind: 'walk_indoor', from: '日本橋駅', to: '三越前駅', distanceM: null, note: '地下通路の連続性は未確認。' }, { kind: 'walk_indoor', from: '三井記念美術館', to: '館内', distanceM: null, note: '開館日・会期を当日公式で確認。' }, { kind: 'walk_outdoor', from: '人形町', to: '水天宮前', distanceM: null, note: '屋根なし。傘が必要。' }], conditions: ['三井記念美術館の会期・休館日は当日確認。', 'COREDO日本橋は一時閉店中。'] },
    evidence: [osm('日本橋駅・日本橋・三井記念美術館・茅場町駅・人形町・水天宮前・浜町公園'), old('No.25', '清澄白河駅までの延伸は採用していない。')],
    open: ['COREDO日本橋の営業再開時期（2027年秋予定）', '鎧橋の正確な位置（OSMに名称ノードなし）', '水天宮の境内の入口', '浜町駅から清澄白河駅までの旧案の経路'],
    decision: '2026-11-16 新Aを計算（4.07km・反復94m）。旧案の浜町駅から清澄白河駅への延伸は不採用。',
  },
  'no-26': {
    title: '旧古河庭園と六義園', summary: '駒込駅から旧古河庭園へ北上し、同じ道を戻って六義園の前を通り巣鴨駅へ抜ける駅間。旧古河庭園は駅から一本道の先にあり、往復が必要。巣鴨地蔵通り商店街と昼食は経由点に含めない。',
    themes: ['庭園', '洋館', 'バラ', '駅間'], reason: '駒込駅から旧古河庭園（北へ約1.1km）、六義園の前、巣鴨駅へ。計算上3.40km。旧古河庭園は駅から一本道の先にあるため、庭園へ入って戻る往復（約654m）が避けられない。巣鴨地蔵通り商店街の座標は名称ノードが見つからず含めていない。' + B_NO,
    distance: '3.40km。庭園を中心とした短い駅間で5〜6kmに届かない。延伸は作らない。',
    retrace: '旧古河庭園と駒込駅の間の約654m（庭園へ入って同じ道を戻る往復）、駒込駅付近の約115m、六義園付近の約45m（計約814m）。庭園は駅から一本道の先にあるため、庭園を含む限り必要な往復。距離合わせではない。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は旧古河庭園の洋館（公開日のみ内部）と六義園の園路を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '駒込駅', to: '旧古河庭園', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '旧古河庭園', to: '洋館の内部', distanceM: null, note: '公開日は限られる。当日公式で確認。' }, { kind: 'rail', from: '巣鴨駅', to: '駒込駅', distanceM: null, note: 'JR山手線で戻る場合。' }], conditions: ['旧古河庭園の洋館の公開日・予約は当日確認。', '庭園の開園時間・入園料は当日確認。'] },
    evidence: [osm('駒込駅・旧古河庭園・六義園・巣鴨駅'), old('No.26', '巣鴨地蔵通り商店街と昼食は含めていない。')],
    open: ['旧古河庭園の正門の位置と入口', '洋館の公開日・予約', '六義園の出入口と有料区', '巣鴨地蔵通り商店街の座標（OSMに名称ノードなし）'],
    decision: '2026-11-16 新Aを計算（3.40km・反復814m）。庭園への往復は避けられないため retraceException に理由を記載。',
  },
  'no-27': {
    title: '国分寺崖線「はけ」と野川', summary: '新小金井駅から武蔵野公園、はけの森美術館、はけの森緑地、武蔵小金井駅へ抜ける駅間。滄浪泉園・貫井神社は名称ノードが見つからず含めていない。旧案の緑町四丁目方面の往復延伸は採らない。',
    themes: ['崖線', '湧水', '公園', '美術館', '川'], reason: '新小金井駅から武蔵野公園（野川沿い）、はけの森美術館、はけの森緑地、武蔵小金井駅へ。計算上3.66km。滄浪泉園・貫井神社の座標は名称ノードが見つからず含めていない。' + B_NO,
    distance: '3.66km。実在の立ち寄り先だけで組んだため5〜6kmに届かない。旧案の往復延伸は採らない。',
    retrace: '計算上の重なりは約65m。はけの森美術館付近の入口と通りの出入りで生じる短い往復と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日ははけの森美術館の館内を中心にする案。野川沿いは増水時に立入規制がある。', segments: [{ kind: 'walk_outdoor', from: '新小金井駅', to: 'はけの森美術館', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: 'はけの森美術館', to: '館内', distanceM: null, note: '開館日・会期を当日公式で確認。' }, { kind: 'rail', from: '武蔵小金井駅', to: '新小金井駅', distanceM: null, note: '西武多摩川線・JR中央線の乗り換え。' }], conditions: ['美術館の開館日は当日確認。', '野川沿いは増水時に立入規制あり。'] },
    evidence: [osm('新小金井駅・武蔵野公園・はけの森美術館・はけの森緑地・武蔵小金井駅'), old('No.27', '緑町四丁目方面の往復延伸は採用していない。')],
    open: ['滄浪泉園・貫井神社の座標と入口', '野川沿いの歩道の連続性', 'はけの小路の位置', 'はけの森美術館の開館日・入館料'],
    decision: '2026-11-16 新Aを計算（3.66km・反復65m）。滄浪泉園・貫井神社は名称ノードがなく含めていない。',
  },
  'no-28': {
    title: '四谷・若葉 スリバチ迷宮', summary: '信濃町駅から須賀神社の女坂、須賀神社、新宿歴史博物館、若葉東公園を経て四ツ谷駅へ抜ける坂道の駅間。闇坂とたいやき わかばの座標は見つからず含めていない。',
    themes: ['坂道', '神社', '階段', '谷', '博物館'], reason: '信濃町駅から須賀神社 女坂・須賀神社、新宿歴史博物館、若葉東公園を経て四ツ谷駅へ。計算上3.16km。闇坂とたいやき わかばは名称ノードが見つからず含めていない。' + B_NO,
    distance: '3.16km。坂道と階段を巡る短い駅間で5〜6kmに届かない。延伸は作らない。',
    retrace: '若葉東公園から四ツ谷駅へ向かう区間で約328m、須賀神社の階段付近で約50m・約35mの短い重なり（計約413m）。須賀神社の階段（女坂・男坂）と若葉の谷底を往来する地形で、同じ坂を登り降りする形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は新宿歴史博物館の館内を中心にする案。須賀神社の階段は雨天で滑りやすい。', segments: [{ kind: 'walk_outdoor', from: '信濃町駅', to: '須賀神社', distanceM: null, note: '階段が滑りやすい。' }, { kind: 'walk_indoor', from: '新宿歴史博物館', to: '館内', distanceM: null, note: '開館日・料金を当日確認。' }, { kind: 'rail', from: '四ツ谷駅', to: '信濃町駅', distanceM: null, note: 'JR中央線・総武線。' }], conditions: ['新宿歴史博物館の開館日は当日確認。', '須賀神社の階段は雨天は避ける。'] },
    evidence: [osm('信濃町駅・須賀神社・新宿歴史博物館・若葉東公園・四ツ谷駅'), old('No.28', '闇坂・たいやき わかばは含めていない。')],
    open: ['闇坂の位置（OSMに名称ノードなし）', 'たいやき わかばの座標と営業状況', '須賀神社の男坂と女坂の区別', '若葉東公園の入口'],
    decision: '2026-11-16 新Aを計算（3.16km・反復413m）。闇坂・たいやき わかばは名称ノードがなく含めていない。',
  },
  'no-29': {
    title: '等々力渓谷と崖の階段', summary: '等々力駅からゴルフ橋、等々力渓谷公園、等々力不動尊、玉川野毛町公園を経て上野毛駅へ抜ける坂道の駅間。旧案の用賀駅への経路は座標を作る必要があるため、上野毛駅で止めた。',
    themes: ['渓谷', '階段', '不動', '公園', '自然'], reason: '等々力駅からゴルフ橋、等々力渓谷公園、等々力不動尊、玉川野毛町公園を経て上野毛駅へ。計算上2.62km。渓谷の遊歩道は階段が多い。' + B_NO,
    distance: '2.62km。渓谷と不動尊を中心にした短い駅間で5〜6kmに届かない。用賀駅方面への延伸は座標を作る必要があるため採らない。',
    retrace: '等々力渓谷公園から不動尊へ向かう区間で約211mが重なる。渓谷の遊歩道が一本道で、不動尊へ入って同じ道を戻る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は等々力不動尊の堂内と、渓谷の遊歩道の屋根のない区間を避ける短縮案。', segments: [{ kind: 'walk_outdoor', from: '等々力駅', to: '等々力不動尊', distanceM: null, note: '渓谷の階段は雨天で滑りやすく、増水時は立入禁止の可能性。' }, { kind: 'walk_indoor', from: '等々力不動尊', to: '堂内', distanceM: null, note: '参拝時間を当日確認。' }, { kind: 'rail', from: '等々力駅', to: '上野毛駅', distanceM: null, note: '東急大井町線。' }], conditions: ['渓谷は大雨・増水時に閉鎖される。', '階段の路面は雨天で危険。'] },
    evidence: [osm('等々力駅・ゴルフ橋・等々力渓谷公園・等々力不動尊・玉川野毛町公園・上野毛駅'), old('No.29', '用賀駅方面の往復延伸は採用していない。')],
    open: ['渓谷の遊歩道の連続性と閉鎖時の迂回路', '雪月花の座標と営業状況（OSMに名称ノードなし）', '上野毛駅から用賀駅への経路', '等々力不動尊の参拝時間'],
    decision: '2026-11-16 新Aを計算（2.62km・反復211m）。用賀駅への延伸と雪月花は含めていない。',
  },
  'no-30': {
    title: '日野・多摩川崖線', summary: '高幡不動駅から高幡不動尊、日野市郷土資料館、黒川清流公園を経て豊田駅へ抜ける駅間。浅川親水公園は名称ノードが見つからず含めていない。',
    themes: ['不動', '崖線', '公園', '川', '資料館'], reason: '高幡不動駅から高幡不動尊、日野市郷土資料館、黒川清流公園を経て豊田駅へ。計算上6.54km。浅川親水公園は名称ノードが見つからず含めていない。' + B_NO,
    distance: '6.54km。5〜6kmを少し超えるが、実在の立ち寄り先をそのまま結んだ結果で、切り詰めはしない。',
    retrace: '高幡不動尊の境内で約166m（計約166m）。境内の参道を入って出る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は高幡不動尊の堂内と日野市郷土資料館の館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '高幡不動駅', to: '高幡不動尊', distanceM: null, note: '参道は屋根なし。' }, { kind: 'walk_indoor', from: '日野市郷土資料館', to: '館内', distanceM: null, note: '開館日・料金を当日公式で確認。' }, { kind: 'rail', from: '豊田駅', to: '高幡不動駅', distanceM: null, note: '京王線とJR中央線の乗り換え。' }], conditions: ['郷土資料館の開館日は当日確認。', '黒川清流公園の池畔は雨天で濡れやすい。'] },
    evidence: [osm('高幡不動駅・高幡不動尊・日野市郷土資料館・黒川清流公園・豊田駅'), old('No.30', '浅川親水公園・日野市立中央図書館は含めていない。')],
    open: ['浅川親水公園の座標（OSMに名称ノードなし）', '日野市立中央図書館の座標', '高幡不動尊の境内の入口', '黒川清流公園から豊田駅への経路'],
    decision: '2026-11-16 新Aを計算（6.54km・反復166m）。浅川親水公園は名称ノードがなく含めていない。',
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
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group5.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
