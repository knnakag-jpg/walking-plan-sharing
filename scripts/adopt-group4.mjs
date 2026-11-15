// 第4グループ（No.19, No.20, No.21, No.22, No.24）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・施設・公園の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });

const C = {
  'no-19': {
    title: '神宮外苑と国立競技場', summary: '信濃町駅から国立競技場、聖徳記念絵画館を回り、いちょう並木の絵画館前通りを南下して外苑前駅、青山一丁目駅へ抜ける駅間。旧案の六本木七丁目方面への往復延伸と昼食は採らない。',
    themes: ['公園', 'スポーツ', '銀杏', '建築'], reason: '信濃町駅から国立競技場、明治神宮聖徳記念絵画館、いちょう並木（絵画館前通り）、外苑前駅、青山一丁目駅へ。計算上3.21km。' + B_NO,
    retrace: '国立競技場から絵画館へ向かう区間で約246m、絵画館前で約21mが重なる（計約272m）。競技場の周回路と絵画館前の広場を行き来する形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は聖徳記念絵画館の館内と国立競技場の施設見学を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '信濃町駅', to: '聖徳記念絵画館', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '聖徳記念絵画館', to: '館内', distanceM: null, note: '開館日・料金を当日公式で確認。' }, { kind: 'rail', from: '外苑前駅', to: '信濃町駅', distanceM: null, note: '地下鉄とJRの乗り換え。' }], conditions: ['絵画館の開館日・料金は当日確認。', 'いちょう並木は雨天で落ち葉が滑りやすい。'] },
    evidence: [osm('信濃町駅・絵画館・国立競技場・外苑前駅・青山一丁目駅'), old('No.19', '六本木七丁目方面の往復延伸は採用していない。')],
    open: ['国立競技場の外周の空中散歩道の開放状況', '絵画館前通りの歩行者区分とイベント時の規制', '外苑前駅から青山一丁目駅までの歩道', '神宮外苑の再開発に伴う工事・通行規制の有無'],
    decision: '2026-11-16 新Aを計算（3.21km・反復272m）。旧案の迎賓館前の外周と往復延伸は不採用。',
  },
  'no-20': {
    title: '二子玉川 多摩川水辺', summary: '二子玉川駅から兵庫島公園、二子橋を渡って二子新地駅へ抜ける短い駅間。旧案の多摩川左岸遊歩道の上流往復は座標を作る必要があるため採らない。',
    themes: ['川', '公園', '橋', '水辺'], reason: '二子玉川駅から兵庫島公園、二子橋を通り、多摩川を渡って二子新地駅へ。計算上1.60km。多摩川左岸遊歩道の位置は未確認のため、経由点に含めていない。' + B_NO,
    distance: '1.60km。橋を渡る短い駅間で5〜6kmに届かない。旧案の上流往復は距離合わせになるため採らない。',
    retrace: '兵庫島公園付近で約170m、約90m（計約259m）。島へ渡る橋と駅側の園路を行き来する形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は二子玉川ライズの屋内通路と店舗を中心にする案。', segments: [{ kind: 'walk_indoor', from: '二子玉川駅', to: '二子玉川ライズ', distanceM: null, note: '駅直結の屋内動線。連続性は未確認。' }, { kind: 'walk_outdoor', from: '兵庫島公園', to: '二子橋', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'rail', from: '二子新地駅', to: '二子玉川駅', distanceM: null, note: '東急田園都市線。' }], conditions: ['商業施設の営業時間は当日確認。', '多摩川沿いは強風・増水時に立入規制がある。'] },
    evidence: [osm('二子玉川駅・兵庫島公園・二子橋・二子新地駅'), old('No.20', '多摩川左岸の上流往復は採用していない。')],
    open: ['多摩川左岸遊歩道の位置と二子橋下の通行条件', '兵庫島公園の入口と島内の園路', '二子橋の歩道の幅と自転車との区分'],
    decision: '2026-11-16 新Aを計算（1.60km・反復259m）。旧案の左岸遊歩道の往復は不採用。',
  },
  'no-21': {
    title: '川越 蔵造りの町並み', summary: '本川越駅から菓子屋横丁、蔵造りの一番街、時の鐘、喜多院、川越氷川神社、川越城本丸御殿を回って川越駅へ抜ける駅間。昼食を前提にした旧案の工程は採らず、屋外の通過だけを計算した。',
    themes: ['町並み', '寺社', '城下町', '菓子', '歴史'], reason: '本川越駅から菓子屋横丁、川越一番街（蔵造りの町並み）、時の鐘、喜多院、川越氷川神社、川越城本丸御殿を経て川越駅へ。計算上7.25km。新河岸川遊歩道は名称ノードが見つからず含めていない。' + B_NO,
    retrace: '菓子屋横丁から一番街へ向かう区間で約188m、氷川神社付近で約114m、喜多院の入口で約6m（計約427m）。路地と大通りの行き来と、境内の出入りと推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は川越城本丸御殿と蔵造り資料館の館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '本川越駅', to: '蔵造り資料館', distanceM: null, note: '一番街の歩道は屋根がない。' }, { kind: 'walk_indoor', from: '川越城本丸御殿', to: '館内', distanceM: null, note: '開館日・料金を当日公式で確認。' }, { kind: 'rail', from: '川越駅', to: '本川越駅', distanceM: null, note: '西武新宿線とJR・東武の乗り換え。' }], conditions: ['本丸御殿の開館日は当日確認。', '喜多院の拝観料と時間は当日確認。'] },
    evidence: [osm('本川越駅・菓子屋横丁・川越一番街・時の鐘・喜多院・川越氷川神社・川越城本丸御殿・川越駅'), old('No.21')],
    open: ['新河岸川遊歩道の位置', '喜多院の拝観時間・境内の通り抜け可否', '大正浪漫夢通りの座標（OSMに名称ノードなし）', '川越氷川神社から川越駅への経路'],
    decision: '2026-11-16 新Aを計算（7.25km・反復427m）。旧案の昼食と新河岸川遊歩道は含めていない。',
  },
  'no-22': {
    title: '浜離宮と竹芝・旧芝離宮', summary: '汐留から旧浜離宮庭園入口、竹芝桟橋入口、旧芝離宮恩賜庭園を経て浜松町駅へ抜ける短い駅間。水上バスは徒歩経路に含めない。庭園内の園路は通らず、入口前の通過とした。',
    themes: ['庭園', '水辺', '水上バス', '海辺', '街並み'], reason: '汐留SIO-SITEから旧浜離宮庭園入口、竹芝桟橋入口、旧芝離宮恩賜庭園、浜松町駅へ。計算上2.90km。水上バスは徒歩経路に含めない。庭園内の園路は通らず、入口前を経由点にした。' + B_NO,
    distance: '2.90km。庭園と桟橋の入口前を結ぶ短い駅間で5〜6kmに届かない。旧案の旧海岸通りへの往復延伸は採らない。',
    retrace: '旧芝離宮恩賜庭園から浜松町駅へ向かう区間で約246m重なる。庭園の入口と駅前の歩道を行き来する形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は水上バスの船内と、汐留のペデストリアンデッキ・館内を中心にする案。', segments: [{ kind: 'walk_indoor', from: '汐留', to: 'ペデストリアンデッキ・館内', distanceM: null, note: 'デッキの屋根の有無は未確認。' }, { kind: 'walk_outdoor', from: '汐留', to: '浜離宮', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'rail', from: '浜松町駅', to: '新橋駅', distanceM: null, note: 'JR山手線で戻る場合。水上バスの運航は天候で変わる。' }], conditions: ['水上バスの運航・料金は当日公式で確認。', '庭園の開園時間・入園料は当日確認。'] },
    evidence: [osm('汐留SIO-SITE・旧浜離宮庭園入口・竹芝桟橋入口・旧芝離宮恩賜庭園・浜松町駅'), old('No.22', '旧海岸通りへの往復延伸は採用していない。')],
    open: ['浜離宮恩賜庭園の園内の園路と開園時間', '水上バス乗船場の位置と運航（徒歩経路に含めていない）', '竹芝ウォーターフロント遊歩道の位置', '旧芝離宮恩賜庭園の開園時間と入口'],
    decision: '2026-11-16 新Aを計算（2.90km・反復246m）。水上バスの乗船場から日の出桟橋への徒歩経路は大回りになったため経由点から外した。',
  },
  'no-24': {
    title: '東京ミッドタウンと檜町公園', summary: '六本木駅からサントリー美術館、21_21 DESIGN SIGHT、檜町公園、乃木神社を経て乃木坂駅へ抜ける短い駅間。館内見学と昼食を前提にした旧案の工程は採らず、屋外の通過だけを計算した。',
    themes: ['美術', '公園', '神社', '街並み'], reason: '六本木駅からサントリー美術館、21_21 DESIGN SIGHT、檜町公園、乃木神社を経て乃木坂駅へ。計算上2.27km。' + B_NO,
    distance: '2.27km。徒歩の短い駅間で5〜6kmに届かない。延伸は作らない。',
    retrace: '乃木神社付近で約81m、檜町公園付近で約40m、21_21 DESIGN SIGHT前で約7m（計約128m）。施設の出入口が道路側へ戻る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日はミッドタウンのガレリア（屋内）とサントリー美術館の館内を中心にする案。', segments: [{ kind: 'walk_indoor', from: '六本木駅', to: '東京ミッドタウン ガレリア', distanceM: null, note: '駅直結の動線。連続性は未確認。' }, { kind: 'walk_indoor', from: 'ガレリア', to: 'サントリー美術館', distanceM: null, note: '開館日・展覧会を当日公式で確認。' }, { kind: 'walk_outdoor', from: '檜町公園', to: '乃木坂駅', distanceM: null, note: '屋根なし。' }], conditions: ['サントリー美術館・21_21 DESIGN SIGHTの会期は当日確認。', '檜町公園の園路は雨天で濡れやすい。'] },
    evidence: [osm('六本木駅・サントリー美術館・21_21 DESIGN SIGHT・檜町公園・乃木神社・乃木坂駅'), old('No.24')],
    open: ['東京ミッドタウン ガレリアの屋内動線と開館時間', '檜町公園の入口', '乃木神社の参道の入口', '21_21 DESIGN SIGHTの会期と入場条件'],
    decision: '2026-11-16 新Aを計算（2.27km・反復128m）。旧案の昼食と館内見学は案から外した。',
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
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group4.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
