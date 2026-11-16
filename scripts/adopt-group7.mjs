// 第7グループ（No.37〜No.42）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・橋・公園・寺社の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });
const river = (what) => ({ verificationStatus: 'researched', summary: `雨の日は${what}。堤防・河川敷は屋根がなく、強風と増水に注意。`, segments: [{ kind: 'walk_outdoor', from: '駅', to: '堤防・河川敷', distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'rail', from: '終点の駅', to: '始点の駅', distanceM: null, note: '鉄道で戻る場合。運賃・所要は当日確認。' }, { kind: 'walk_indoor', from: '駅', to: '駅ビル・商店街のアーケード', distanceM: null, note: '屋根のある通路の有無は未確認。' }], conditions: ['増水・強風時は河川敷が立入規制になる。', '堤防の路面は雨天でぬかるむ。'] });

const C = {
  'no-37': {
    title: '多摩川 二子橋から登戸', summary: '二子玉川駅から二子橋を渡り、多摩川緑地の上流を歩いて宿河原駅、登戸駅へ抜ける駅間。多摩水道橋と向ヶ丘遊園は名称ノードが見つからず含めていない。',
    themes: ['川', '橋', '緑地', '土手'], reason: '二子玉川駅から二子橋、多摩川緑地（上流）、宿河原駅を経て登戸駅へ。計算上6.27km。多摩水道橋は緑地の中で橋の名称ノードが見つからず、向ヶ丘遊園は範囲外にあるため含めていない。' + B_NO,
    distance: '6.27km。5〜6kmを少し超えるが、堤防沿いの自然な流れで、切り詰めはしない。',
    retrace: '多摩川緑地から宿河原駅へ向かう区間で約287m、宿河原駅付近で約36m（計約323m）。緑地から駅へ上がる道を行き来する形と推定。地図で未確認。',
    rainy: river('駅から駅へ鉄道で移動し、橋の上だけを歩く短縮案'), evidence: [osm('二子玉川駅・二子橋・多摩川緑地・宿河原駅・登戸駅'), old('No.37')],
    open: ['多摩水道橋の座標', '多摩川緑地の遊歩道の位置と通行条件', '向ヶ丘遊園を終点にする場合の経路', '宿河原駅から堤防へ上がる道'],
    decision: '2026-11-16 新Aを計算（6.27km・反復323m）。多摩水道橋・向ヶ丘遊園は名称ノードがなく含めていない。',
  },
  'no-38': {
    title: '多摩川と浅川 万願寺の渡し場', summary: '聖蹟桜ヶ丘駅から一ノ宮、百草園駅、高幡不動尊を経て高幡不動駅へ抜ける駅間。関戸橋・万願寺歩道橋・合流点は名称ノードが見つからず含めていない。',
    themes: ['川', '浅川', '寺', '土手'], reason: '聖蹟桜ヶ丘駅から一ノ宮、百草園駅、高幡不動尊を経て高幡不動駅へ。計算上4.26km。関戸橋と万願寺歩道橋は橋の名称ノードが見つからず、合流点の座標も取れないため含めていない。' + B_NO,
    distance: '4.26km。実在の駅と寺社だけで組んだため5〜6kmに届かない。旧案の高幡方面の往復延伸は採らない。',
    retrace: '高幡不動尊の境内で約39mの重なり。参道を入って出る形と推定。',
    rainy: river('高幡不動尊の参道と百草園駅の駅前だけを歩く短縮案'), evidence: [osm('聖蹟桜ヶ丘駅・一ノ宮・百草園駅・高幡不動尊・高幡不動駅'), old('No.38', '高幡方面の往復延伸は採用していない。')],
    open: ['関戸橋・万願寺歩道橋の座標', '多摩川と浅川の合流点の位置', '高幡不動尊の参道の入口', '聖蹟桜ヶ丘駅から川へ出る道'],
    decision: '2026-11-16 新Aを計算（4.26km・反復39m）。関戸橋・万願寺歩道橋は名称ノードがなく含めていない。',
  },
  'no-39': {
    title: '荒川 千住の大土手', summary: '北千住駅から千住新橋、堀切橋を渡って堀切菖蒲園駅、京成関屋駅へ抜ける駅間。荒川の大土手は名称ノードがないため、橋と駅だけを経由点にしている。',
    themes: ['川', '土手', '橋', '菖蒲池'], reason: '北千住駅から千住新橋（南詰）、堀切橋（西詰）、堀切菖蒲園駅を経て京成関屋駅へ。計算上4.14km。荒川大土手は名称ノードが見つからず、橋を渡る形で堤防の上を通る。' + B_NO,
    distance: '4.14km。橋と駅だけで組んだため5〜6kmに届かない。旧案の宝町方面の往復延伸は採らない。',
    retrace: '堀切橋から堀切菖蒲園駅へ向かう区間で約105m、堀切菖蒲園駅から京成関屋駅へ向かう区間で約206m（計約313m）。橋のたもとと駅を行き来する形と推定。地図で未確認。',
    rainy: river('堀切菖蒲園駅の駅前と京成関屋駅の間だけを歩く短縮案'), evidence: [osm('北千住駅・千住新橋・堀切橋・堀切菖蒲園駅・京成関屋駅'), old('No.39', '宝町二丁目方面の往復延伸は採用していない。')],
    open: ['荒川大土手の歩行者動線', '堀切菖蒲園の開園期間・料金', '千住新橋から堀切橋までの堤防上の歩道', 'お花茶屋駅の位置'],
    decision: '2026-11-16 新Aを計算（4.14km・反復313m）。荒川大土手は名称ノードがないため橋と駅を経由点にした。',
  },
  'no-40': {
    title: '荒川 岩淵の水門', summary: '赤羽岩淵駅から新荒川大橋、荒川知水資料館を経て赤羽駅へ抜ける駅間。赤水門・川口駅は名称ノードが見つからず含めていない。',
    themes: ['川', '水門', '資料館', '動植物'], reason: '赤羽岩淵駅から新荒川大橋、荒川知水資料館を経て赤羽駅へ。計算上3.22km。赤水門は名称ノードが見つからず、川口駅は荒川の東岸で経路から外れるため含めていない。荒川赤羽緑地も名称ノードが見つからず、近くの志茂東ふれあい館前を経由点にした。' + B_NO,
    distance: '3.22km。実在の地点だけで組んだため5〜6kmに届かない。旧案のSL青葉通り方面の往復延伸は採らない。',
    retrace: '荒川知水資料館から赤羽駅へ向かう区間で約75m。資料館前と駅前の道を行き来する形と推定。',
    rainy: river('荒川知水資料館の館内と赤羽駅前の商店街だけを歩く短縮案'), evidence: [osm('赤羽岩淵駅・新荒川大橋・荒川知水資料館・赤羽駅'), old('No.40', 'SL青葉通り方面の往復延伸は採用していない。')],
    open: ['赤水門・岩淵水門の座標と見学可否', '川口駅へ渡る経路（荒川の横断）', '荒川赤羽緑地の位置', '荒川知水資料館の開館日'],
    decision: '2026-11-16 新Aを計算（3.22km・反復75m）。赤水門・川口駅は名称ノードがなく含めていない。',
  },
  'no-41': {
    title: '江戸川 柴又と中川', summary: '金町駅から中川大橋、柴又帝釈天、柴又駅を経て京成高砂駅へ抜ける駅間。矢切の渡しは対岸（松戸）への渡船で、徒歩の連続経路にならないため含めていない。',
    themes: ['川', '帝釈天', '参道', '渡船'], reason: '金町駅から中川大橋東、柴又帝釈天、柴又駅を経て京成高砂駅へ。計算上5.26km。矢切の渡しは対岸へ渡る船で徒歩経路に含められないため外した。' + B_NO,
    retrace: '柴又帝釈天と柴又駅の間で約185m。参道を往復する形と推定。地図で未確認。',
    rainy: river('柴又帝釈天の参道と京成高砂駅前だけを歩く短縮案'), evidence: [osm('金町駅・中川大橋・柴又帝釈天・柴又駅・京成高砂駅'), old('No.41', '中川側道方面の往復延伸は採用していない。')],
    open: ['矢切の渡しの運航・料金（徒歩経路には含めていない）', '柴又公園土手の歩道', '金町駅から江戸川へ出る道', '柴又帝釈天の参道と境内の入口'],
    decision: '2026-11-16 新Aを計算（5.26km・反復185m）。矢切の渡しは徒歩経路に含めていない。',
  },
  'no-42': {
    title: '横浜 大さん橋とみなとみらい', summary: '石川町駅付近から横浜中華街、大さん橋入口、赤レンガ倉庫前、臨港パークを経てみなとみらい駅へ抜ける駅間。女神橋と新高島駅は名称ノードが見つからず含めていない。',
    themes: ['港', '橋', '公園', '中華街'], reason: '石川町駅付近から横浜中華街、大さん橋入口、赤レンガ倉庫前、臨港パークを経てみなとみらい駅へ。計算上4.22km。石川町駅の正確な駅ノードが見つからず、中華街西門付近を始点にした。女神橋と新高島駅は名称ノードが見つからず含めていない。' + B_NO,
    distance: '4.22km。実在の地点だけで組んだため5〜6kmに届かない。旧案のいちょう通り方面の往復延伸は採らない。',
    retrace: '大さん橋入口から赤レンガ倉庫前へ向かう区間で約178m。埠頭の入口と海岸沿いの道を行き来する形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は横浜中華街のアーケードと大さん橋客船ターミナルの館内を中心にする案。', segments: [{ kind: 'walk_indoor', from: '横浜中華街', to: '中華街のアーケード', distanceM: null, note: 'アーケードの範囲・営業時間は未確認。' }, { kind: 'walk_indoor', from: '大さん橋入口', to: '大さん橋ホール', distanceM: null, note: '館内の連続性は未確認。' }, { kind: 'walk_outdoor', from: '赤レンガ倉庫', to: 'みなとみらい駅', distanceM: null, note: '屋根なし。繋留中の船からの眺めは天候に左右される。' }], conditions: ['大さん橋の屋上デッキの開放時間は当日確認。', '港湾の強風時は臨港パーク側が閉鎖の可能性。'] },
    evidence: [osm('横浜中華街・大さん橋入口・赤レンガ倉庫前・臨港パーク入口・みなとみらい駅前'), old('No.42', 'いちょう通り方面の往復延伸は採用していない。')],
    open: ['石川町駅の駅ノードと出入口', '女神橋の座標と渡れるか', '新高島駅の座標', '大さん橋の屋上デッキへの入口'],
    decision: '2026-11-16 新Aを計算（4.22km・反復178m）。女神橋・新高島駅は名称ノードがなく含めていない。',
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
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group7.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
