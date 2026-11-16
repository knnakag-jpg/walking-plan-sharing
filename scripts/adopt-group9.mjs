// 第9グループ（No.49〜No.54）を台帳へ。Bは作らず、理由をAの説明に書く。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const B_NO = 'B（7〜8kmの延長案）は、実在の座標で同じ道を使わずに延ばせる立ち寄り先を確認できていないため作らない。';
const osm = (names) => ({ type: 'community', title: `OpenStreetMap（${names}）`, url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・公園・寺社の名称ノードの座標。入口ではない。' });
const old = (id, extra = '') => ({ type: 'community', title: `旧資料 ${id}（先行ページ index.html）`, url: null, checkedAt: '2026-11-16', supports: `旧案の立ち寄り先。${extra}` });
const rainy = (out, indoor, rail, note) => ({ verificationStatus: 'researched', summary: note, segments: [{ kind: 'walk_outdoor', from: out[0], to: out[1], distanceM: null, note: '屋根なし。傘が必要。' }, { kind: 'walk_indoor', from: indoor[0], to: indoor[1], distanceM: null, note: indoor[2] || '館内の範囲と営業時間は当日確認。' }, { kind: 'rail', from: rail[0], to: rail[1], distanceM: null, note: rail[2] || '鉄道で戻る場合。運賃・所要は当日確認。' }], conditions: ['営業時間・休館日は当日確認。', '屋外の路面は雨天で濡れやすい。'] });

const C = {
  'no-49': {
    title: '吉祥寺・井の頭公園から三鷹', summary: '吉祥寺駅から井の頭恩賜公園、三鷹台駅、三鷹市八幡前を経て三鷹駅へ抜ける駅間。三鷹の森ジブリ美術館と玉川上水緑道は名称ノードがなく経由点に含めていない。',
    themes: ['公園', '池', '川', 'ジブリ'], reason: '吉祥寺駅から井の頭橋（井の頭恩賜公園）、三鷹台駅、三鷹市八幡前を経て三鷹駅へ。計算上6.85km。三鷹の森ジブリ美術館は外観のみの案内で名称ノードが見つからず、玉川上水緑道も名称の点がないため含めていない。' + B_NO,
    distance: '6.85km。5〜6kmを超えるが、公園と駅を結ぶ自然な駅間で、切り詰めはしない。',
    retrace: '三鷹台駅の出入りで約51m、三鷹市八幡前付近で約15m（計約66m）。駅前の交差点で生じる短い往復と推定。',
    rainy: rainy(['吉祥寺駅', '井の頭公園'], ['吉祥寺駅', '駅ビル・商店街', '商店街のアーケードの範囲は未確認。'], ['三鷹駅', '吉祥寺駅'], '雨の日は吉祥寺駅の商店街と公園の池畔を短く歩く案。'),
    evidence: [osm('吉祥寺駅・井の頭橋・三鷹台駅・三鷹市八幡前・三鷹駅'), old('No.49', '関前二丁目方面の往復延伸は採用していない。')],
    open: ['三鷹の森ジブリ美術館の外観の位置と入館予約', '玉川上水緑道の位置と通行条件', '井の頭恩賜公園の池周りの園路', '三鷹台駅から三鷹駅への歩道'],
    decision: '2026-11-16 新Aを計算（6.85km・反復66m）。ジブリ美術館と玉川上水緑道は名称ノードがなく含めていない。',
  },
  'no-50': {
    title: '谷根千 坂とグルメ', summary: '上野広小路付近から湯島、根津、谷中銀座付近を経て日暮里駅へ抜ける坂道の駅間。湯島天神・根津神社・谷中銀座の正確な座標はOSMで見つからず、概略の点を使っている。',
    themes: ['坂道', '下町', '神社', '商店街'], reason: '上野広小路付近から湯島、根津神社付近、谷中銀座付近を経て日暮里駅へ。計算上4.75km。湯島天神・根津神社・谷中銀座・谷中霊園の正確な点がなく、概略の点を使った（地図レビュー待ち）。' + B_NO,
    distance: '4.75km。実在の駅と地点だけで組んだため5〜6kmに届かない。旧案の西日暮里五丁目方面の往復延伸は採らない。',
    retrace: '湯島付近で約286m、根津付近で約215m、谷中付近で約78m（計約579m）。坂の途中の入口と大通りの行き来と推定。地図で未確認。',
    rainy: rainy(['上野広小路', '湯島'], ['根津', '根津神社周辺の屋根のある参道', '屋根の範囲は未確認。'], ['日暮里駅', '上野広小路付近'], '雨の日は谷中銀座のアーケードと湯島の坂の下を中心にする短縮案。'),
    evidence: [osm('上野広小路付近・根津・谷中・日暮里駅'), old('No.50', '西日暮里五丁目方面の往復延伸は採用していない。')],
    open: ['湯島天神・根津神社・谷中銀座・谷中霊園の正確な座標', '谷中霊園の中央園路の通行条件', '根津のたいやきの店の座標（OSMに名称ノードなし）', '坂道の実際の勾配と階段'],
    decision: '2026-11-16 新Aを計算（4.75km・反復579m）。主要地点は概略の点で、地図レビューが必要。',
  },
  'no-51': {
    title: '中目黒から代官山・恵比寿', summary: '中目黒駅から目黒川船入場、代官山T-SITE、恵比寿ガーデンプレイスを経て恵比寿駅へ抜ける駅間。旧朝倉家住宅は名称ノードが見つからず含めていない。',
    themes: ['川', '桜', '街並み', '庭園'], reason: '中目黒駅から目黒川船入場、代官山T-SITE、恵比寿ガーデンプレイスを経て恵比寿駅へ。計算上4.12km。旧朝倉家住宅は名称ノードが見つからず含めていない。' + B_NO,
    distance: '4.12km。実在の地点だけで組んだため5〜6kmに届かない。渋谷四丁目方面の往復延伸は採らない。',
    retrace: '代官山付近で約242m、目黒川船入場で約51m、他にも短い重なり（計約424m）。坂の途中の入口と大通りの行き来と推定。地図で未確認。',
    rainy: rainy(['中目黒駅', '目黒川'], ['代官山T-SITE', 'T-SITEの館内', '営業時間は当日確認。'], ['恵比寿駅', '中目黒駅'], '雨の日は代官山T-SITEと恵比寿ガーデンプレイスの館内を中心にする案。'),
    evidence: [osm('中目黒駅・目黒川船入場・代官山T-SITE・恵比寿ガーデンプレイス・恵比寿駅'), old('No.51', '渋谷四丁目方面の往復延伸は採用していない。')],
    open: ['旧朝倉家住宅の座標と公開日', '目黒川沿いの歩道の連続性', '代官山の坂道と階段', '恵比寿ガーデンプレイスから恵比寿駅への動く歩道'],
    decision: '2026-11-16 新Aを計算（4.12km・反復424m）。旧朝倉家住宅は名称ノードがなく含めていない。',
  },
  'no-52': {
    title: '神楽坂 石畳の坂と路地', summary: '飯田橋駅から神楽坂の坂下、赤城神社付近、江戸川橋へ抜ける短い駅間。兵庫横丁・かくれんぼ横丁・大隈庭園・善國寺毘沙門天の座標は取れず含めていない。',
    themes: ['石畳', '路地', '坂道', '神社'], reason: '飯田橋駅から神楽坂（坂下）、赤城神社付近、江戸川橋へ。計算上2.12km。兵庫横丁・かくれんぼ横丁・善國寺・大隈庭園は名称ノードが見つからず含めていない。' + B_NO,
    distance: '2.12km。実在の地点だけで組んだため5〜6kmに届かない。延伸は作らない。',
    retrace: '赤城神社付近で約116m、神楽坂の坂下で約23m（計約139m）。路地と大通りの行き来と推定。地図で未確認。',
    rainy: rainy(['飯田橋駅', '神楽坂'], ['神楽坂', '商店街のアーケード', '屋根のある範囲は未確認。'], ['江戸川橋', '飯田橋駅'], '雨の日は神楽坂の店先と赤城神社の境内を中心にする短縮案。石畳は滑りやすい。'),
    evidence: [osm('飯田橋駅・神楽坂・赤城神社付近・江戸川橋'), old('No.52')],
    open: ['兵庫横丁・かくれんぼ横丁の座標', '赤城神社の正確な点と入口', '大隈庭園への経路', '神楽坂の石畳の通行時間帯'],
    decision: '2026-11-16 新Aを計算（2.12km・反復139m）。兵庫横丁などは名称ノードがなく含めていない。',
  },
  'no-53': {
    title: '京王百草園 梅林', summary: '百草園駅から京王百草園、高幡不動尊を経て高幡不動駅へ抜ける早春の駅間。梅まつり期間（例年2月初旬〜3月中旬、未確認）に合わせて歩く案。',
    themes: ['梅', '庭園', '崖線', '早春'], reason: '百草園駅から京王百草園、高幡不動尊、高幡不動駅へ。計算上3.79km。京王百草園の正確な点がなく概略の点を使った（地図レビュー待ち）。梅まつりの期間・開園時間は公式で未確認。' + B_NO,
    distance: '3.79km。実在の地点だけで組んだため5〜6kmに届かない。延伸は作らない。',
    retrace: '高幡不動尊の境内で約39mの重なり。参道を入って出る形と推定。',
    rainy: rainy(['百草園駅', '京王百草園'], ['京王百草園', '園内の茶屋・施設', '営業時間・開園は当日確認。'], ['高幡不動駅', '百草園駅'], '雨の日は高幡不動尊の堂内と京王百草園の東屋を中心にする案。園内の坂は滑りやすい。'),
    evidence: [osm('百草園駅・京王百草園・高幡不動尊・高幡不動駅'), old('No.53')],
    open: ['京王百草園の正確な座標・入口・開園時間・入園料', '梅まつりの期間（公式で確認）', '園内の坂道と階段', '百草園駅から園までの歩道'],
    decision: '2026-11-16 新Aを計算（3.79km・反復39m）。京王百草園の正確な点がなく概略の点を使用。梅まつりの期間は未確認。',
  },
  'no-54': {
    title: '大宮公園 桜めぐり', summary: '大宮駅から氷川神社入口、武蔵一宮氷川神社、大宮公園、大宮第二公園を経て大宮公園駅へ抜ける春の駅間。第三公園は名称ノードがなく含めていない。',
    themes: ['桜', '神社', '公園', '春限定'], reason: '大宮駅から氷川神社入口、武蔵一宮氷川神社、大宮公園、大宮第二公園を経て大宮公園駅へ。計算上4.53km。氷川参道は約2kmの一直線で桜並木が続く（開花時期は年により変わる）。第三公園は名称ノードが見つからず含めていない。' + B_NO,
    distance: '4.53km。実在の地点だけで組んだため5〜6kmに届かない。延伸は作らない。',
    retrace: '氷川神社の境内で約11m、大宮公園内で約35m（計約46m）。園路の分岐戻りと推定。',
    rainy: rainy(['大宮駅', '氷川参道'], ['大宮駅', '駅ビル・商業施設', '営業時間は当日確認。'], ['大宮公園駅', '大宮駅'], '雨の日は氷川参道の樹の下を歩くだけの短縮案。桜の開花は年により変わる。'),
    evidence: [osm('大宮駅・氷川神社入口・武蔵一宮氷川神社・大宮公園・大宮第二公園・大宮公園駅'), old('No.54')],
    open: ['桜の開花時期と見頃（毎年変わる）', '大宮第三公園の座標', '氷川参道の舗装側と車道の区分', '大宮公園の園内の通り抜け'],
    decision: '2026-11-16 新Aを計算（4.53km・反復46m）。第三公園は名称ノードがなく含めていない。',
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
  r.files = [...new Set([...(r.files || []), 'scripts/lib-rebuild.mjs', 'scripts/build-group9.mjs', `data/curated/${slug}.json`, buildFile])];
  wr(rp, r);
  const catCourse = cat.courses.find((x) => x.id === id);
  if (!catCourse) throw new Error(`catalog course missing: ${id}`);
  catCourse.routeOptions = [{ id: `${slug}-standard`, variant: 'standard', geometryUrl: v.geometryUrl }, catCourse.route];
  console.log(id, v.distanceM, v.repeatedGeometryM);
}
wr('data/catalog.json', cat);
