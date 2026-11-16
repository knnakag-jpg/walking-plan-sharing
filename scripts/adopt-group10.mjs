// 第10グループ（No.55〜No.59）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・公園・橋・交差点の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });
const rainy = (out, indoor, rail, note) => ({ verificationStatus: 'researched', summary: note, segments: [{ kind: 'walk_outdoor', from: out[0], to: out[1], distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: indoor[0], to: indoor[1], distanceM: null, note: indoor[2] || '館内の範囲と営業時間は当日確認。' }, { kind: 'rail', from: rail[0], to: rail[1], distanceM: null, note: rail[2] || '鉄道で戻る場合。運賃・所要は当日確認。' }], conditions: ['営業時間・休館日は当日確認。', '屋外の路面は雨天で濡れやすい。'] });

const C = {
  'no-55': {
    title: '小金井公園と野川の桜', summary: '東小金井駅から小金井公園の桜並木（桜町側）を歩き、武蔵小金井駅へ抜ける短い駅間。江戸東京たてもの園と野川公園は名称ノードが見つからず経由点に含めていない。',
    themes: ['桜', '公園', '春限定'], reason: '東小金井駅から小金井公園の桜町側、武蔵小金井駅へ。計算上3.82km。江戸東京たてもの園と野川公園は名称ノードが見つからず、座標を作らずに含めていない。' + B_NO,
    distance: '3.82km。実在の地点だけで組んだため5〜6kmに届かない。延伸は作らない。',
    retrace: '計算上の重なりは約36m（桜町公園の園路）。',
    rainy: rainy(['東小金井駅', '小金井公園'], ['武蔵小金井駅', '駅ビル・商業施設', '営業時間は当日確認。'], ['武蔵小金井駅', '東小金井駅'], '雨の日は公園の桜並木を短く歩くだけの短縮案。桜の開花は年により変わる。'),
    evidence: [osm('東小金井駅・小金井公園の桜町側・武蔵小金井駅'), old('No.55')],
    open: ['江戸東京たてもの園・野川公園の座標と入口', '小金井公園の桜並木の正確な位置', '野川沿いの歩道の連続性', '桜の開花時期（毎年変わる）'],
    decision: '2026-11-16 新Aを計算（3.82km・反復36m）。たてもの園・野川公園は名称ノードがなく含めていない。',
  },
  'no-56': {
    title: '東京駅・皇居外周から日本橋', summary: '東京駅丸の内から二重橋前、和田倉、日比谷公園、銀座四丁目、京橋、日本橋を回って東京駅へ戻る都心の周回。銀座四丁目交差点の正確な座標はOSMで見つからず概略の点を使っている。',
    themes: ['都心', '皇居', '橋', '街並み'], reason: '東京駅丸の内中央口から二重橋前駅、皇居外苑（和田倉）、日比谷公園、銀座四丁目交差点、京橋の親柱、日本橋（橋）を経て東京駅へ戻る。計算上6.63km。' + B_NO,
    retrace: '和田倉噴水公園から日比谷方面へ向かう区間で約232m、二重橋前付近で約15m、日本橋で約11m（計約258m）。和田倉の公園内を回って表通りへ戻る形で、距離合わせの往復ではない。地図で未確認。',
    rainy: rainy(['東京駅', '皇居外苑'], ['東京駅', '駅ビル・グランルーフの館内', '館内の範囲は未確認。'], ['東京駅', '東京駅'], '雨の日は東京駅の駅ビルと日本橋の地下通路（案内文のみ）を中心にする短縮案。地下通路の座標は取れていない。'),
    evidence: [osm('東京駅・二重橋前・和田倉噴水公園・日比谷公園・京橋・日本橋'), old('No.56', '日本橋一丁目方面の往復延伸は採用していない。')],
    open: ['銀座四丁目交差点の正確な座標', '皇居外苑の歩道の通行条件', '和田倉橋の歩道', '日本橋の地下通路の位置'],
    decision: '2026-11-16 新Aを計算（6.63km）。和田倉・二重橋の順序を入れ替えて折り返しを減らした。銀座四丁目は概略の点。',
  },
  'no-57': {
    title: '両国から浅草・上野', summary: '両国駅西口から厩橋を渡り、雷門、浅草寺を経て上野駅へ抜ける駅間。雷門と浅草寺は名称ノードが見つからず概略の点、谷中霊園は含めていない。',
    themes: ['川', '寺', '下町', '公園'], reason: '両国駅西口から厩橋（西詰・東詰）、雷門、浅草寺を経て上野駅へ。計算上4.95km。雷門・浅草寺・谷中霊園の正確な点がなく、概略の点を使うか外した（地図レビュー待ち）。' + B_NO,
    distance: '4.95km。実在の地点だけで組んだため5〜6kmに届かない。延伸は作らない。',
    retrace: '厩橋の西詰と東詰の間で約91m（橋の取り付き）。橋を渡るための短い重なりで、距離合わせではない。',
    rainy: rainy(['両国駅', '厩橋'], ['上野駅', '駅ビル・アメ横のアーケード', 'アーケードの範囲は未確認。'], ['上野駅', '両国駅'], '雨の日は上野駅と浅草の仲見世の屋根のある区間を中心にする短縮案。'),
    evidence: [osm('両国駅西口・厩橋・上野駅'), old('No.57', '谷中霊園中央園路は含めていない。')],
    open: ['雷門・浅草寺・隅田川テラス・蔵前橋・谷中霊園の正確な座標', '厩橋の歩道', '上野桜木の位置', '上野公園への入口'],
    decision: '2026-11-16 新Aを計算（4.95km・反復91m）。雷門・浅草寺は概略の点、谷中霊園は名称ノードがなく外した。',
  },
  'no-58': {
    title: '原宿から表参道・六本木', summary: '原宿駅から明治神宮前、表参道駅、青山学院前、麻布十番を通って六本木駅へ抜ける駅間。けやき坂と六本木ヒルズは名称ノードが見つからず含めていない。',
    themes: ['街並み', '並木', 'アート', '坂道'], reason: '原宿駅から明治神宮前駅、表参道駅、青山学院前、麻布十番駅を経て六本木駅へ。計算上5.84km。けやき坂と六本木ヒルズは名称ノードが見つからず含めていない。' + B_NO,
    retrace: '計算上の重なりは0m。',
    rainy: rainy(['原宿駅', '表参道'], ['表参道', '表参道ヒルズの館内', '館内の範囲は未確認。'], ['六本木駅', '原宿駅'], '雨の日は表参道ヒルズと六本木ヒルズの館内を中心にする案。'),
    evidence: [osm('原宿駅・明治神宮前駅・表参道駅・青山学院前・麻布十番駅・六本木駅'), old('No.58', 'けやき坂・六本木ヒルズは含めていない。')],
    open: ['けやき坂・六本木ヒルズの座標', '青山学院の正確な位置', '表参道の並木の歩道', '六本木交差点の横断'],
    decision: '2026-11-16 新Aを計算（5.84km・反復0m）。けやき坂・六本木ヒルズは名称ノードがなく含めていない。',
  },
  'no-59': {
    title: '立川から国立・国分寺のはけ', summary: '立川北駅から国立駅北口、国分寺崖線「はけ」を経て西国分寺駅へ抜ける駅間。大学通りとさくら通りは名称ノードが見つからず経由点に含めていない。',
    themes: ['坂道', '崖線', '学園都市', '並木'], reason: '立川北駅から国立駅北口、国分寺崖線「はけ」を経て西国分寺駅へ。計算上6.81km。大学通り・さくら通り・はけの遊歩道は名称ノードが見つからず、はけは概略の点を使った（地図レビュー待ち）。国分寺駅は西国分寺駅とほぼ同じ位置のため終点は西国分寺駅にした。' + B_NO,
    distance: '6.81km。5〜6kmを超えるが、駅と崖線を結んだ自然な駅間で、切り詰めはしない。',
    retrace: '計算上の重なりは約51m（西国分寺駅付近）。',
    rainy: rainy(['立川北駅', '国立駅'], ['国立駅', '駅ビル・商店街', '営業時間は当日確認。'], ['西国分寺駅', '立川北駅'], '雨の日は国立駅前の商店街だけを歩く短縮案。「はけ」の遊歩道は雨天で滑りやすい。'),
    evidence: [osm('立川北駅・国立駅北口・西国分寺駅・国分寺駅付近'), old('No.59')],
    open: ['はけ遊歩道の位置と通行条件', '大学通り・さくら通りの歩道', '国立駅から西国分寺駅への経路', '国分寺駅の位置（西国分寺駅との関係）'],
    decision: '2026-11-16 新Aを計算（6.81km・反復51m）。はけは概略の点、大学通り・さくら通りは名称ノードがなく含めていない。',
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
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group10.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  if (!catCourse) throw new Error(`catalog course missing: ${id}`);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
