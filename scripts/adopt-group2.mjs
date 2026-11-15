// 第2グループ（No.9, No.10, No.12, No.13）を台帳へ。BはNo.10だけ実在の経路で作った。他はAのみで理由を書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';

const C = {
  'no-9': {
    title: '高尾山（ケーブルカー）',
    summary: 'ケーブル清滝駅からケーブルカーを利用する前提の案（線形は徒歩経路に含めない）。山上駅から薬王院・山頂を歩き、蛇滝口へ下りて高尾山口駅へ。山道の通行条件は未確認。',
    themes: ['山', '寺社', '自然', '展望'],
    reason: 'ケーブル清滝駅から山上駅まではケーブルカー、そこから薬王院、高尾山頂、蛇滝口を経て高尾山口駅へ下る。計算上10.39km（鉄道・ケーブルカー以外の徒歩部分）。旧案の「山上→薬王院→蛇滝口→高尾山口駅」の順をそのまま使った。山道の通行条件とケーブルカーの営業は未確認。' + B_NO,
    distance: '10.39km。7〜8kmを超えるが、薬王院・山頂・蛇滝口をすべて含めた結果で、距離を削るための短縮はしない。',
    retrace: 'ケーブル清滝駅から山上駅までの登りで約493m（ケーブルカーの線形と並行する参道を往復する形と推定）、薬王院の境内で約102m（計約595m）。地図で未確認。なお、この案はケーブルカーを利用する前提で徒歩経路が本来の山道と一致するか未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日はケーブルカーで上がり、薬王院の参道だけを歩いて同じ道で戻る短い案。薬王院の建物内で雨宿りできるかは未確認。', segments: [{ kind: 'rail', from: '高尾山口駅', to: '清滝駅', distanceM: null, note: 'ケーブルカー。営業時間・運行状況は当日確認。' }, { kind: 'walk_outdoor', from: '清滝駅', to: '薬王院', distanceM: null, note: '石段と坂。雨天は滑りやすい。' }, { kind: 'walk_indoor', from: '薬王院', to: '本堂・客殿の屋内', distanceM: null, note: '屋内に入れる範囲は未確認。' }, { kind: 'walk_outdoor', from: '薬王院', to: '高尾山口駅', distanceM: null, note: '雨の山道は危険。代替のバスは未確認。' }], conditions: ['ケーブルカーの運行状況・混雑は当日確認。', '雨天・強風時の登山道の規制は未調査。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（高尾登山ケーブル・薬王院・山頂・蛇滝口・高尾山口駅）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: 'ケーブルカーと寺社・地点の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.9（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り順。' }],
    open: ['ケーブルカーの営業時間・料金・運行状況（公式）', '薬王院から山頂への登山道の通行条件', '蛇滝口から高尾山口駅への下り（蛇滝線歩道）の通行条件', '山頂の三角点の正確な位置'],
    decision: '2026-11-15 新Aを計算（10.39km・反復595m）。ケーブルカーの線形は徒歩経路に含めていない。登山道の通行条件は未確認。',
  },
  'no-10': {
    title: '羽田イノベーションシティ～スカイブリッジ',
    summary: '天空橋駅からHANEDA INNOVATION CITYを抜け、多摩川沿いから多摩川スカイブリッジを渡って多摩川緑地へ下り、大師橋駅へ抜けるA。Bは旧穴守稲荷の大鳥居を経て羽田空港第3ターミナル駅へ向かう短い駅間。足湯・フードホールは営業未確認のため案内文には含めない。',
    themes: ['空港', '橋', '川', '展望', '史跡'],
    reason: '天空橋駅からHANEDA INNOVATION CITYの前を通り、多摩川沿いを南へ、多摩川スカイブリッジを渡って多摩川緑地（殿町地区）から大師橋駅へ。計算上4.23km。橋は往復せずに渡りきる形にした。フードホール・足湯庭園は営業状況未確認のため立ち寄り先に含めていない。' + B_NO,
    retrace: '重なりは計算上0m。',
    rainy: { verificationStatus: 'researched', summary: '雨の日はHANEDA INNOVATION CITYの館内と羽田空港第3ターミナルの館内を鉄道でつなぐ案。', segments: [{ kind: 'walk_outdoor', from: '天空橋駅', to: 'HANEDA INNOVATION CITY', distanceM: null, note: '駅と館の間の屋根の有無は未確認。' }, { kind: 'walk_indoor', from: 'HANEDA INNOVATION CITY', to: '館内', distanceM: null, note: '館内動線は未確認。' }, { kind: 'rail', from: '天空橋駅', to: '羽田空港第3ターミナル駅', distanceM: null, note: '京急空港線または東京モノレール。' }, { kind: 'walk_indoor', from: '羽田空港第3ターミナル駅', to: 'ターミナル館内', distanceM: null, note: '展望デッキの開放は未確認。' }], conditions: ['各施設の営業時間・入場は当日確認。', '多摩川沿いのプロムナードの通行条件は未確認。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（天空橋駅・多摩川スカイブリッジ・旧穴守稲荷大鳥居・大師橋駅）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅・橋・大鳥居の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.10（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。距離合わせの往復は採用していない。' }],
    open: ['HANEDA INNOVATION CITYの足湯庭園・フードホールの営業状況', '多摩川スカイブリッジの歩道の通行条件（自転車との区分）', '多摩川緑地（殿町地区）から大師橋駅までの歩道', '羽田空港ターミナルの展望デッキの開放状況'],
    decision: '2026-11-15 A=天空橋駅→スカイブリッジ→大師橋駅(4.23km・反復0m)、B=天空橋駅→旧穴守稲荷大鳥居→羽田空港第3ターミナル駅(3.11km・反復0m)。旧案のスカイブリッジ往復と羽田空港方面の往復延伸は不採用。',
    b: true,
  },
  'no-12': {
    title: '立川のアートと昭島の水辺',
    summary: '立川駅からファーレ立川の屋外アートを通り、昭島側の残堀川沿いを経て東中神駅、昭島駅へ抜ける駅間。旧案の五日市街道方面の往復（約3.1km）は採らない。',
    themes: ['アート', '街並み', '川', '公園'],
    reason: '立川駅からファーレ立川センタースクエア、ファーレ立川北を通り、昭島側の残堀川沿いを西へ、東中神駅を経て昭島駅へ。計算上6.86km。玉川上水はこの範囲で名称ノードが見つからず、川沿いの歩道も未確認のため、実在の河道がある残堀川沿いを使った。' + B_NO,
    distance: '6.86km。5〜6kmを少し超えるが、実在の河道沿いを通る自然な流れを優先し、短縮のための切り詰めはしない。',
    retrace: '計算上の重なりは約13m（ファーレ立川北付近）。交差点の横断で生じる短い往復と推定。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は立川駅北口のデッキと商業施設の館内を中心にする短い案。', segments: [{ kind: 'walk_indoor', from: '立川駅', to: '北口デッキ', distanceM: null, note: 'デッキの連続性は未確認。' }, { kind: 'walk_outdoor', from: '北口デッキ', to: 'ファーレ立川', distanceM: null, note: '屋外のアート広場。' }, { kind: 'rail', from: '立川駅', to: '昭島駅', distanceM: null, note: 'JR青梅線。' }], conditions: ['商業施設の営業時間は当日確認。', '玉川上水沿いの歩道は雨天で濡れやすい。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（立川駅・ファーレ立川・東中神駅・昭島駅・玉川上水）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅とアート地区・川の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.12（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。距離合わせの往復は採用していない。' }],
    open: ['玉川上水沿いの歩道の位置（名称ノードがなく、残堀川沿いで代用した）', '立川駅の使う出口と北口デッキ', '昭島駅までの歩道の連続性', '旧案の昭和記念公園を通る案と統合するか'],
    decision: '2026-11-15 新Aを計算（6.86km・反復13m）。玉川上水の名称ノードがないため残堀川沿いで代用。旧案の五日市街道方面の往復は不採用。',
  },
  'no-13': {
    title: '飛鳥山と音無親水公園',
    summary: '王子駅から飛鳥山公園、音無親水公園、石神井川の武蔵野の路、北とぴあを回って王子駅へ戻る短い周遊。石神井川沿いの遊歩道の位置は地図で未確認。',
    themes: ['公園', '桜', '川', '街並み', '展望'],
    reason: '王子駅から飛鳥山公園（アスカルゴ・3館の前）、音無親水公園、石神井川の武蔵野の路 石神井川コース沿いを回り、北とぴあの前を通って王子駅へ戻る。計算上2.25km。周遊にして同じ道を戻ることを避けた。石神井川沿いの遊歩道の位置は地図で未確認。' + B_NO,
    distance: '2.25km。駅を中心にした短い周遊で5〜6kmに届かない。周遊を無理に延ばさない。',
    retrace: '飛鳥山公園内で約110mと約60m（計約199m）。坂の上り下りで同じ園路を戻る形と推定。地図で未確認。',
    rainy: { verificationStatus: 'researched', summary: '雨の日は飛鳥山公園の3つの博物館（紙の博物館・渋沢史料館・北区飛鳥山博物館）の館内を中心にする案。', segments: [{ kind: 'walk_outdoor', from: '王子駅', to: '飛鳥山公園', distanceM: null, note: 'アスカルゴ（モノレール）の利用可否は未確認。' }, { kind: 'walk_indoor', from: '飛鳥山公園', to: '博物館の館内', distanceM: null, note: '開館日・料金を当日公式で確認。' }, { kind: 'rail', from: '飛鳥山駅', to: '王子駅', distanceM: null, note: '都電荒川線。' }], conditions: ['各館の開館日・料金は当日確認。', 'アスカルゴの運行状況は未確認。'] },
    evidence: [{ type: 'community', title: 'OpenStreetMap（王子駅・飛鳥山公園・音無親水公園・武蔵野の路 石神井川コース・北とぴあ）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-15', supports: '駅・公園・遊歩道案内・展望施設の名称ノードの座標。入口ではない。' }, { type: 'community', title: '旧資料 No.13（先行ページ index.html）', url: null, checkedAt: '2026-11-15', supports: '旧案の立ち寄り先。' }],
    open: ['石神井川沿いの遊歩道の正確な位置と通行条件', '北とぴあ展望ロビーの開放時間', 'アスカルゴの運行状況', '飛鳥山の3館の開館日と入口'],
    decision: '2026-11-15 新Aを周遊で計算（2.25km・反復199m）。同じ道を戻る区間は坂の往復に限った。石神井川沿いは遊歩道の位置が未確認。',
  },
};

const cat = rd('data/catalog.json');
for (const [slug, c] of Object.entries(C)) {
  const build = rd(`data/research/${slug}-route-build.json`);
  const variants = build.variants;
  const id = `No.${Number(slug.split('-')[1])}`;
  const buildFile = `data/research/${slug}-adopted-build.json`;
  wr(buildFile, { generatedAt: build.calculatedAt, method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results: Object.entries(variants).map(([variant, v]) => ({ variant, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: v.repeatedGeometryPct, waypoints: v.stops.map((s) => ({ id: s.id, label: s.label, coord: s.coord, source: s.source })), legDistancesKm: v.legKm, geometryUrl: v.geometryUrl })) });
  wr(`data/curated/${slug}.json`, {
    id, buildFile, title: c.title, summary: c.summary, themes: c.themes,
    routeReasons: {
      standard: c.reason,
      ...(c.b ? { extended: 'Bは旧穴守稲荷神社の大鳥居を経て羽田空港第3ターミナル駅へ向かう短い駅間。計算上3.11km。旧案の羽田空港ターミナル周辺への往復延伸は不採用。' } : { extended: B_NO }),
    },
    distanceExceptions: { standard: c.distance ?? '4.23km。実在の駅・橋・公園だけで組んだため5〜6kmに届かない。旧案の往復は作らず延伸しない。', ...(c.b ? { extended: '3.11km。5〜6kmにも7〜8kmにも届かない短い駅間。延伸は作らない。' } : {}) },
    retraceExceptions: { standard: c.retrace },
    rainy: c.rainy, evidence: c.evidence, openQuestions: c.open,
  });
  const rp = `data/research/${slug}-route-research.json`;
  const r = fs.existsSync(path.join(root, rp)) ? rd(rp) : { id, title: c.title, stage: 'source_research_in_progress', checkedAt: '2026-11-15', evidence: [], trials: [], files: [] };
  r.id = id; r.title = c.title; r.evidence = c.evidence; r.openQuestions = c.open; r.decision = c.decision;
  r.trials = [...(r.trials || []), ...Object.entries(variants).map(([variant, v], i) => ({ n: (r.trials || []).length + i + 1, variant: `${variant} 新規（OSMの駅・地点）`, result: `${(v.distanceM / 1000).toFixed(2)}km・反復${v.repeatedGeometryM}m`, finding: c.retrace }))];
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group2.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  catCourse.routeOptions = [...Object.keys(variants).map((v) => ({ id: `${slug}-${v}`, variant: v, geometryUrl: variants[v].geometryUrl })), catCourse.route];
  console.log(id, Object.keys(variants).join(','), Object.values(variants).map((v) => v.distanceM).join('/'));
}
wr('data/catalog.json', cat);
