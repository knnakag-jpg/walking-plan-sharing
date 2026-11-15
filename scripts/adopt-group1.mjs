// 第1グループ（No.1〜4, No.6）を台帳へ。retrace 理由・距離例外・雨天案・未確認事項を付ける。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const courses = {
  'no-1': {
    title: '皇居東御苑と北の丸公園', summary: '大手門から皇居東御苑の本丸・天守台を歩き、北桔橋門から北の丸公園の科学技術館・日本武道館前を通って竹橋駅へ。旧案の平川門への戻りと日本橋方面への往復延伸は採らない。',
    themes: ['御苑', '庭園', '歴史', '桜', '街並み'],
    reason: '大手門から本丸大芝生、天守台、北桔橋門を経て北の丸公園へ入り、科学技術館と日本武道館の前を通り、平川門の外側から和田倉噴水公園を回って竹橋駅へ下る。計算上5.74km。三の丸尚蔵館と二の丸庭園は御苑の南東寄りに並び、天守台へ向かうと南へ戻ることになるため含めていない（入口の位置は地図レビュー待ち）。',
    retrace: '本丸大芝生と天守台を結ぶ園路で約117mと約47m、北の丸公園の入口（北桔橋門）付近で約54m、和田倉噴水公園の園路で約345mが重なる（計約562m）。園内の行き止まりの園路と、和田倉公園の池の周回路を戻る形で、地図で未確認。距離合わせの往復ではない。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は三の丸尚蔵館（館内展示）と和田倉噴水公園の屋根下を中心にする案。屋外は大手町・竹橋の駅と館の間だけにする。館内の連続歩行距離は未計測。', segments: [{ kind: 'walk_outdoor', from: '竹橋駅', to: '皇居三の丸尚蔵館', distanceM: null, note: '屋根のない区間あり。傘が必要。' }, { kind: 'walk_indoor', from: '皇居三の丸尚蔵館', to: '展示室内', distanceM: null, note: '開館日・入館料・予約を当日公式で確認。' }, { kind: 'walk_outdoor', from: '和田倉噴水公園', to: '東京駅丸の内北口', distanceM: null, note: '地下通路の有無は未確認。' }], conditions: ['御苑の開園日（月・金休園など）を当日公式で確認。', '各館の開館日・入場料は当日確認。'] },
    evidence: [{ type: 'official', title: '宮内庁：皇居東御苑', url: 'https://www.kunaicho.go.jp/event/higashigyoen/higashigyoen.html', checkedAt: '2026-11-15', supports: '開園日・開園時間の確認先（本セッションでは本文を取得していない。当日確認が必要）。' }, { type: 'community', title: 'OpenStreetMap（大手門・本丸大芝生・天守台・北桔橋門・科学技術館・日本武道館・和田倉噴水公園）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '門・園地・施設の名称ノード/リレーションの座標。入口ではない。' }],
    open: ['三の丸尚蔵館・二の丸庭園を回る順路（天守台へ戻らずに回れるか）', '皇居東御苑の開園日と開園時間（宮内庁公式）', '和田倉噴水公園から東京駅への地下通路', '北桔橋門から北の丸公園への通り抜け'],
    decision: '2026-11-15 新Aを実在の門・園地で計算（5.74km・反復562m）。旧案の日本橋本石町方面への往復延伸（約2.8km）は座標を作る必要があるため不採用。',
  },
  'no-2': {
    title: 'お台場・有明', summary: '東京テレポート駅からダイバーシティ東京、アクアシティお台場、お台場海浜公園駅を歩き、青海駅からお台場レインボー公園・有明北緑道公園を経て東京ビッグサイト、国際展示場駅へ抜ける。自由の女神像の像そのものの座標は取れなかったため、海浜公園の区間を通す形にしている。',
    themes: ['海辺', '都市', '景観', '公園', '美術'],
    reason: '東京テレポート駅からダイバーシティ東京、アクアシティお台場、フジテレビ前を通り、お台場海浜公園駅、お台場レインボー公園、青海駅、有明北緑道公園、東京ビッグサイトを経て国際展示場駅へ。計算上7.86km。フジテレビとお台場レインボー公園は施設の中心が経路から離れているため、道路側のバス停・公園の点を経由点にした。',
    retrace: 'ダイバーシティ東京の前後で約35m、アクアシティお台場の角で約12m、お台場海浜公園駅の前後で約48m、お台場レインボー公園から青海駅へ向かう区間で約264m（計約647m）。建物の出入口が道路側へ戻る形と推定。地図で未確認。',
    distance: '7.86km。7〜8kmの範囲に収まった。',
    rainy: { verificationStatus: 'researched', summary: '雨の日はダイバーシティ東京とアクアシティお台場の館内を中心にする案。屋外は駅と館の間だけ。', segments: [{ kind: 'walk_outdoor', from: '東京テレポート駅', to: 'ダイバーシティ東京', distanceM: null, note: '屋根の有無は未確認。' }, { kind: 'walk_indoor', from: 'ダイバーシティ東京', to: 'アクアシティお台場', distanceM: null, note: '館内の連続動線は未確認。' }, { kind: 'rail', from: 'お台場海浜公園駅', to: '東京テレポート駅', distanceM: null, note: 'ゆりかもめで戻る場合。' }], conditions: ['各施設の営業時間は当日確認。', '屋外露出は未調査。'] },
    evidence: [{ type: 'community', title: '旧資料 No.2（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。距離合わせの往復は採用していない。' }, { type: 'community', title: 'OpenStreetMap（駅・公園・施設）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅と公園・施設の名称ノードの座標。入口ではない。' }],
    open: ['自由の女神像の正確な位置（OSMに名称ノードが見つからず、海浜公園の区間で代用）', 'お台場レインボー公園から青海駅への経路（約264mの重なりの原因）', 'アクアシティお台場とダイバーシティ東京の出入口', 'シンボルプロムナード公園の歩行者動線', '東京ビッグサイトの入口（展示会の有無で動線が変わる）'],
    decision: '2026-11-15 新Aを実在の駅・公園・施設で計算（7.86km・反復647m）。旧案の有明方面の延伸は含めていない（7〜8kmに収まったため）。自由の女神像の座標は未取得。',
  },
  'no-3': {
    title: '横浜・汽車道と港のプロムナード', summary: '桜木町駅から汽車道を渡り、運河パーク、横浜赤レンガ倉庫、象の鼻パーク、開港記念会館、神奈川県庁、大さん橋入口を経て山下公園、元町・中華街駅へ抜ける。旧案の昼食の組み込みは採らない。',
    themes: ['港', '歴史', '橋', '洋館', '海辺'],
    reason: '桜木町駅から汽車道（旧桜木町駅の線路跡）、運河パーク、横浜赤レンガ倉庫、象の鼻パーク、横浜市開港記念会館、神奈川県庁、大さん橋入口、山下公園を経て元町・中華街駅へ。計算上4.50km。大さん橋は屋上デッキまで上がらず入口を経由点にしている（デッキの座標は未確認）。',
    retrace: '運河パーク付近で約56m、象の鼻パーク付近で約58m、開港記念会館付近で約33m（計約266m）。施設の出入口が道路側へ戻る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は横浜赤レンガ倉庫と大さん橋客船ターミナルの館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '桜木町駅', to: '横浜赤レンガ倉庫', distanceM: null, note: '汽車道は屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: '横浜赤レンガ倉庫', to: '大さん橋客船ターミナル', distanceM: null, note: '館内の連続動線は未確認。' }, { kind: 'rail', from: '元町・中華街駅', to: '桜木町駅', distanceM: null, note: 'みなとみらい線で戻る場合。' }], conditions: ['各施設の営業時間は当日確認。', '港の風雨は公式の荒天情報を確認。'] },
    evidence: [{ type: 'community', title: '旧資料 No.3（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。' }, { type: 'community', title: 'OpenStreetMap（駅・公園・施設）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅と施設の名称ノードの座標。入口ではない。' }],
    open: ['大さん橋の屋上デッキへの入口とエレベーター', '山下公園から元町・中華街駅への経路', '各施設の営業時間・休館日'],
    decision: '2026-11-15 新Aを実在の駅・公園・施設で計算（4.50km・反復266m）。距離は5〜6kmに届かないが延伸は作らない。',
  },
  'no-4': {
    title: '調布飛行場と武蔵野の森', summary: '多磨駅から大沢1号掩体壕、2号掩体壕、武蔵野の森公園を通り、調布飛行場ターミナルを経て味の素スタジアムへ下る。往復が多い案で、掩体壕と展望の丘が行き止まりの園路の先にある。',
    themes: ['飛行場', '史跡', '公園', 'スタジアム'],
    reason: '多磨駅から大沢1号掩体壕、大沢2号掩体壕、武蔵野の森公園、調布飛行場ターミナルを経て味の素スタジアムへ。計算上7.99km。掩体壕が行き止まりの園路の先にあり、展望の丘を足すと往復がさらに増えるため外した。',
    retrace: '掩体壕への園路で約331m、武蔵野の森公園から調布飛行場を回る区間で約1,652m（計約1,983m）。行き止まりの園路と、空港の周回・ターミナルへの出入りによる往復と推定。地図で未確認。距離合わせの往復ではないが、再検討の余地が大きい。',
    distance: '7.99km。7〜8kmの範囲に収まった。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は調布飛行場のターミナル（館内）と味の素スタジアムの外周（屋根あり区間）を中心にする。', segments: [{ kind: 'walk_outdoor', from: '多磨駅', to: '掩体壕', distanceM: null, note: '屋根なし。' }, { kind: 'walk_indoor', from: '調布飛行場ターミナル', to: '館内', distanceM: null, note: '公開範囲は未確認。' }, { kind: 'walk_outdoor', from: '味の素スタジアム', to: '飛田給駅', distanceM: null, note: '試合日は混雑。' }], conditions: ['調布飛行場の見学可否は当日確認。', '味の素スタジアムの外周通路の開放は未確認。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（多磨駅・掩体壕・武蔵野の森公園・調布飛行場ターミナル・味の素スタジアム）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅・史跡・施設の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.4（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。' }],
    open: ['掩体壕から展望の丘へ戻らずに行ける園路があるか', '調布飛行場のターミナルと滑走路沿いの歩道の通行条件', '味の素スタジアムの外周通路の開放状況', '旧案の「中央線側の駅（バス乗車）」の始点をどこにするか'],
    decision: '2026-11-15 新Aを実在の駅・史跡で計算（7.99km・反復1,983m）。往復が多く、主要な未確認事項が残る。旧案の飛田給二丁目方面への延伸は不採用。',
  },
  'no-6': {
    title: 'ところざわサクラタウンと航空公園', summary: '東所沢駅からところざわサクラタウン（角川武蔵野ミュージアム・武蔵野坐令和神社）を歩き、東川沿いを経て所沢航空記念公園、航空公園駅へ抜ける案。東川沿いの遊歩道と公園・駅の位置は地図で未確認の仮点を含む。',
    themes: ['美術', '建築', '川', '公園', '航空'],
    reason: '東所沢駅からところざわサクラタウン、角川武蔵野ミュージアム、武蔵野坐令和神社を通り、東川沿いの遊歩道を西へ、所沢航空記念公園と所沢航空発祥記念館を経て航空公園駅へ。計算上3.35km。東川の遊歩道と公園・駅の座標は仮点で、計算結果は目安。',
    retrace: '東所沢駅からサクラタウンへ入る区間で約199m（サクラタウンの東側と駅側の出入口を行き来する形と推定）。地図で未確認。',
    distance: '3.35km。仮点を含む計算値で5〜6kmに届かない。延伸は作らない。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は角川武蔵野ミュージアムと所沢航空発祥記念館の館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '東所沢駅', to: 'ところざわサクラタウン', distanceM: null, note: '屋根なし。' }, { kind: 'walk_indoor', from: '角川武蔵野ミュージアム', to: '館内', distanceM: null, note: '開館日・料金・予約を当日公式で確認。' }, { kind: 'rail', from: '航空公園駅', to: '東所沢駅', distanceM: null, note: '西武池袋線・新宿線の乗り換えで戻る場合。' }], conditions: ['角川武蔵野ミュージアムの開館日・料金・予約は当日確認。', '東川沿いの遊歩道の開通状況は未確認。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（東所沢駅・サクラタウン・角川武蔵野ミュージアム・武蔵野坐令和神社・東川）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅・施設・川の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.6（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。' }],
    open: ['東川沿いの遊歩道の位置と開通状況', '所沢航空記念公園の東口の位置', '所沢航空発祥記念館と航空公園駅の正確な座標（仮点を使用）', 'サクラタウンの出入口と角川武蔵野ミュージアムの入口'],
    decision: '2026-11-15 新Aを計算（3.35km・反復199m）。東川の遊歩道・公園・駅は座標未特定のため仮点を含む目安。',
  },
};

const cat = rd('data/catalog.json');
for (const [slug, c] of Object.entries(courses)) {
  const build = rd(`data/research/${slug}-route-build.json`);
  const v = build.variants.standard;
  const id = `No.${Number(slug.split('-')[1])}`;
  c.reason = c.reason.replace('計算上3.35km。東川の遊歩道と公園・駅の座標は仮点で、計算結果は目安。', `計算上${(v.distanceM / 1000).toFixed(2)}km。東川沿いの歩道の位置は地図レビュー待ち。`);
  const catCourse = cat.courses.find((x) => x.id === id);
  wr(`data/curated/${slug}.json`, {
    id, buildFile: `data/research/${slug}-route-build.json`, title: c.title, summary: c.summary, themes: c.themes,
    routeReasons: { standard: `${c.reason} B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。`, extended: 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。Aの区間と距離は上のA説明のとおり。' },
    retraceExceptions: { standard: c.retrace }, distanceExceptions: c.distance ? { standard: c.distance } : {}, rainy: c.rainy, evidence: c.evidence, openQuestions: c.open,
  // Aだけを採用する場合は、Bを作らない理由をAの説明に必ず書く（Bの説明欄はカタログに載らない）。
  ...{},
  });
  const rp = `data/research/${slug}-route-research.json`;
  const r = fs.existsSync(path.join(root, rp)) ? rd(rp) : { id, title: c.title, stage: 'source_research_in_progress', checkedAt: '2026-11-15', evidence: [], trials: [], files: [] };
  r.id = id; r.title = c.title; r.stage = r.stage || 'source_research_in_progress';
  r.evidence = c.evidence; r.openQuestions = c.open;
  r.decision = c.decision;
  r.trials = [...(r.trials || []), { n: (r.trials || []).length + 1, variant: 'A 新規（OSMの駅・施設）', result: `${(v.distanceM / 1000).toFixed(2)}km・反復${v.repeatedGeometryM}m`, finding: c.retrace }];
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group1.mjs', `data/curated/${slug}.json`])];
  wr(rp, r);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, slug, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
