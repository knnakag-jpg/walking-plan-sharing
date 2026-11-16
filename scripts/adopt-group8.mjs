// 第8グループ（No.43, No.44, No.45, No.46, No.48）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・橋・公園・施設の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });

const C = {
  'no-43': {
    title: '東京 夢の大橋と豊洲', summary: '東京テレポート駅から夢の大橋を渡り、晴海大橋南詰から豊洲公園を経て豊洲駅へ抜ける駅間。旧案の晴海大橋までの往復（1.38km）は採らず、晴海大橋は南詰を通過するだけにした。',
    themes: ['橋', '運河', '公園', '湾岸'], reason: '東京テレポート駅前から夢の大橋、晴海大橋南詰、豊洲公園を経て豊洲駅へ。計算上4.47km。千客万来は名称ノードがなく、旧案の順序からは外した。' + B_NO,
    distance: '4.47km。実在の地点だけで組んだため5〜6kmに届かない。旧案の晴海大橋への往復は距離合わせになるため採らない。',
    retrace: '計算上の重なりは約28m（豊洲公園付近）。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は豊洲駅直結の商業施設と市場前駅の屋根のある通路を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '東京テレポート駅', to: '夢の大橋', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '豊洲駅', to: '商業施設の館内', distanceM: null, note: '館内の連続性は未確認。' }, { kind: 'rail', from: '豊洲駅', to: '東京テレポート駅', distanceM: null, note: 'ゆりかもめ。' }], conditions: ['晴海大橋の歩道の通行条件は未確認。', '運河沿いの風は強い。'] },
    evidence: [osm('東京テレポート駅前・夢の大橋・晴海大橋南詰・豊洲公園・豊洲駅'), old('No.43', '晴海大橋までの往復は採用していない。')],
    open: ['晴海大橋の歩道が徒歩で通れるか', '千客万来・豊洲ぐるり公園の座標', '夢の大橋の歩行者動線', '豊洲公園から豊洲駅への道'],
    decision: '2026-11-16 新Aを計算（4.47km・反復28m）。晴海大橋への往復は不採用。',
  },
  'no-44': {
    title: '川崎・羽田 多摩川スカイブリッジ', summary: '小島新田駅から多摩川スカイブリッジを渡り、天空橋駅、羽田空港第3ターミナル駅へ抜ける駅間。羽田エアポートガーデンと展望デッキは名称ノードが見つからず含めていない。',
    themes: ['橋', '川', '空港', '湾岸'], reason: '小島新田駅から多摩川スカイブリッジ（南端・北端）、天空橋駅を経て羽田空港第3ターミナル駅へ。計算上5.56km。羽田エアポートガーデンと展望デッキは名称ノードが見つからず、経由点に含めていない。' + B_NO,
    retrace: '天空橋駅の前後で約38m、天空橋駅から羽田空港第3ターミナル駅へ向かう区間で約436m（計約474m）。道路の南北を行き来する形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は天空橋駅から羽田空港第3ターミナルまで京急空港線で移動し、ターミナル館内だけを歩く案。', segments: [{ kind: 'rail', from: '天空橋駅', to: '羽田空港第3ターミナル駅', distanceM: null, note: '京急空港線。' }, { kind: 'walk_indoor', from: '羽田空港第3ターミナル駅', to: 'ターミナル館内', distanceM: null, note: '展望デッキの開放は未確認。' }, { kind: 'walk_outdoor', from: '小島新田駅', to: '多摩川スカイブリッジ', distanceM: null, note: '屋根なし。橋は強風時に歩行者が規制される場合がある。' }], conditions: ['スカイブリッジの強風時の通行規制を当日確認。', '羽田エアポートガーデンの営業は未確認。'] },
    evidence: [osm('小島新田駅・多摩川スカイブリッジ・天空橋駅・羽田空港第3ターミナル駅'), old('No.44', '羽田空港方面の往復延伸は採用していない。')],
    open: ['羽田エアポートガーデンと展望デッキの座標', 'スカイブリッジの歩道の区分と強風時の規制', '多摩川緑地（殿町地区）からの取り付き', '羽田空港第3ターミナルの入口'],
    decision: '2026-11-16 新Aを計算（5.56km・反復474m）。羽田エアポートガーデン・展望デッキは名称ノードがなく含めていない。',
  },
  'no-45': {
    title: '木更津 中の島大橋', summary: '木更津駅西口から鳥居崎海浜公園を経て中の島大橋を渡り、駅へ戻る周遊。中の島公園・旧灯台は名称ノードが見つからず含めていない。',
    themes: ['橋', '港', '海辺', '周遊'], reason: '木更津駅西口から鳥居崎海浜公園、中の島大橋を渡って木更津駅西口へ戻る。計算上3.44km。旧案の周遊のうち、中の島公園・木更津港旧灯台は名称ノードが見つからず含めていない。' + B_NO,
    distance: '3.44km。港の周遊で5〜6kmに届かない。島へ渡る橋は往復が避けられないため、延伸は作らない。',
    retrace: '中の島大橋で約413mと約523m、駅へ戻る区間で約711m（計約1,647m）。島へ渡る橋は渡って戻る必要があり、往復は避けられない。距離合わせではない。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は木更津駅周辺の商業施設にとどめ、橋を渡る案を外す短縮案。', segments: [{ kind: 'rail', from: '木更津駅', to: '袖ケ浦駅', distanceM: null, note: '内房線。' }, { kind: 'walk_outdoor', from: '木更津駅', to: '鳥居崎海浜公園', distanceM: null, note: '屋根なし。' }, { kind: 'walk_indoor', from: '木更津駅', to: '駅ビル・アクア木更津', distanceM: null, note: '館内の範囲は未確認。' }], conditions: ['中の島大橋は強風時に歩行者が規制される場合がある。', '旧灯台・中の島公園の開放は未確認。'] },
    evidence: [osm('木更津駅西口・鳥居崎海浜公園・中の島大橋'), old('No.45')],
    open: ['中の島公園・木更津港旧灯台の座標', '中の島大橋の歩道と強風時の規制', '鳥居崎海浜公園と駅の間の道'],
    decision: '2026-11-16 新Aを計算（3.44km・反復1,647m）。島への橋の往復は避けられないため retraceException に記載。',
  },
  'no-46': {
    title: '夢の島熱帯植物館から葛西臨海水族園', summary: '新木場駅から東京都夢の島熱帯植物館、葛西臨海水族園を経て葛西臨海公園駅へ抜ける駅間。夢の島大橋・荒川河口橋・鳥類園・大観覧車は名称ノードが見つからず含めていない。',
    themes: ['植物園', '水族園', '海辺', '湾岸'], reason: '新木場駅から東京都夢の島熱帯植物館、葛西臨海水族園を経て葛西臨海公園駅へ。計算上6.24km。夢の島大橋・荒川河口橋・鳥類園・大観覧車は名称ノードが見つからず、座標を作らずに含めていない。' + B_NO,
    distance: '6.24km。5〜6kmを少し超えるが、実在の立ち寄り先を結んだ結果で、切り詰めはしない。',
    retrace: '夢の島熱帯植物館の出入りで約543m、葛西臨海水族園の入口と駅の間で約292m（計約835m）。両施設の入口が園路の奥にあり、同じ道を戻る形と推定。地図で未確認。距離合わせではない。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は東京都夢の島熱帯植物館と葛西臨海水族園の館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '新木場駅', to: '夢の島熱帯植物館', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '夢の島熱帯植物館', to: '館内', distanceM: null, note: '開館日・料金を当日公式で確認。' }, { kind: 'walk_indoor', from: '葛西臨海水族園', to: '館内', distanceM: null, note: '営業状況を公式で確認。' }], conditions: ['水族園は建替え工事で営業が変わっている可能性があり、当日確認が必要。', '海浜の強風時は屋外展示が閉鎖される場合がある。'] },
    evidence: [osm('新木場駅・夢の島熱帯植物館・葛西臨海水族園・葛西臨海公園駅'), old('No.46')],
    open: ['夢の島大橋・荒川河口橋の座標', '葛西臨海公園の鳥類園の入口と園路', '大観覧車の位置', '葛西臨海水族園の営業状況（建替え工事の有無）'],
    decision: '2026-11-16 新Aを計算（6.24km・反復835m）。夢の島大橋・荒川河口橋・鳥類園・大観覧車は名称ノードがなく含めていない。',
  },
  'no-48': {
    title: '両国から浅草・スカイツリー', summary: '両国駅から吾妻橋を渡り、浅草寺、隅田公園を経て東京スカイツリー、押上駅へ抜ける駅間。両国駅・浅草寺・隅田公園の正確な座標はOSMで見つからず、仮の点を使っている。',
    themes: ['川', '寺', '橋', '展望タワー'], reason: '両国駅から吾妻橋、浅草寺、隅田公園、東京スカイツリーを経て押上駅へ。計算上3.93km。両国駅・浅草寺・隅田公園の名称ノードが見つからず、近くの点または概略の点を使った（地図レビュー待ち）。' + B_NO,
    distance: '3.93km。実在の地点だけで組んだため5〜6kmに届かない。旧案の押上三丁目方面の往復延伸は採らない。',
    retrace: '計算上の重なりは約57m（隅田公園付近）。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は浅草寺の仲見世の屋根と、東京スカイツリーの館内（ソラマチ）を中心にする案。', segments: [{ kind: 'walk_indoor', from: '浅草寺', to: '仲見世の屋根のある店先', distanceM: null, note: '屋根の連続性は未確認。' }, { kind: 'walk_indoor', from: '東京スカイツリー', to: 'ソラマチの館内', distanceM: null, note: '営業時間は当日確認。' }, { kind: 'walk_outdoor', from: '押上駅', to: '東京スカイツリー', distanceM: null, note: '屋根なし。' }, { kind: 'rail', from: '押上駅', to: '両国駅', distanceM: null, note: '都営浅草線・大江戸線。' }], conditions: ['スカイツリー展望デッキの予約・料金は当日確認。', '隅田川テラスは増水時に閉鎖される。'] },
    evidence: [osm('吾妻橋・東京スカイツリー・押上駅・両国駅付近・浅草寺付近'), old('No.48', '押上三丁目方面の往復延伸は採用していない。')],
    open: ['両国駅・浅草寺・隅田公園の座標', '隅田川テラスの通行条件', '吾妻橋の歩道', 'スカイツリーの展望デッキの入口'],
    decision: '2026-11-16 新Aを計算（3.93km・反復57m）。両国駅・浅草寺・隅田公園は名称ノードがなく概略の点を使用。',
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
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group8.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
