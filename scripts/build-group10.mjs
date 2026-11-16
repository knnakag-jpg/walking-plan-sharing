// 第10グループ（No.55〜No.59）の A を計算する。駅・公園・橋・交差点は OSM の名称付き点のみ。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.55 小金井公園と野川：東小金井駅→小金井公園→野川公園→武蔵小金井駅。
const higashiKoganei = P('higashi_koganei', '東小金井駅入口', 35.69748, 139.52422, 'OSM node 1321483777 東小金井駅入口');
const koganeiPark = P('koganei_park', '小金井公園（桜）', 35.70939, 139.50939, 'OSM park 桜町公園（小金井公園の桜並木側）; 公園全体の点は地図レビュー待ち');
const nogawaPark = P('nogawa_park', '野川公園', 35.69214, 139.51873, 'OSM park 武蔵野公園（野川沿い）; 野川公園の点は地図レビュー待ち');
const musashiKoganei = P('musashi_koganei2', '武蔵小金井駅', 35.70145, 139.50581, 'OSM node 2147464096 武蔵小金井駅');

// No.56 東京駅・皇居外周〜日本橋：東京駅丸の内→皇居外苑→日比谷→銀座→京橋→日本橋→東京駅。
const tokyoSt = P('tokyo_st', '東京駅 丸の内中央口', 35.68158, 139.76602, 'OSM train_station_entrance 丸の内中央口');
const kokyoGaien = P('kokyo_gaien', '皇居外苑（和田倉方面）', 35.68339, 139.7613, 'OSM park 和田倉噴水公園');
const nijubashiMae = P('nijubashi_mae', '二重橋前〈丸の内〉駅', 35.68034, 139.76162, 'OSM stop 二重橋前');
const hibiyaPark = P('hibiya_park', '日比谷公園', 35.67371, 139.75618, 'OSM park 日比谷公園');
const ginza4 = P('ginza4', '銀座四丁目交差点', 35.67405, 139.76523, 'TOPIC: 銀座四丁目交差点。OSMの正確な点は地図レビュー待ち');
const kyobashi = P('kyobashi', '京橋の親柱', 35.67495, 139.76871, 'OSM information 京橋の親柱');
const nihonbashiSt = P('nihonbashi_st', '日本橋駅', 35.68183, 139.77581, 'OSM station 日本橋');
const nihonbashi = P('nihonbashi2', '日本橋（橋）', 35.68257, 139.77377, 'OSM node 日本橋（橋）');

// No.57 両国〜浅草〜上野：両国駅→厩橋→浅草方面（雷門・浅草寺は名称点がなく概略）→上野駅。
const ryogokuW = P('ryogoku_w', '両国駅 西口', 35.69669, 139.79194, 'OSM node 両国駅西口');
const umaBashi = P('uma_bashi', '厩橋（西詰）', 35.70521, 139.7933, 'OSM node 344100421 厩橋');
const umaBashiE = P('uma_bashi_e', '厩橋（東詰）', 35.70396, 139.79617, 'OSM node 344201116 厩橋東詰');
const kaminarimon = P('kaminarimon', '雷門', 35.71097, 139.79627, 'TOPIC: 雷門。OSMの正確な点は地図レビュー待ち');
const sensoJi = P('sensoji', '浅草寺', 35.71476, 139.79667, 'TOPIC: 浅草寺。OSMの正確な点は地図レビュー待ち');
const uenoSt = P('ueno_st', '上野駅', 35.71217, 139.7782, 'OSM node 上野駅');
const uenoPark = P('ueno_park', '上野公園前', 35.71053, 139.77388, 'OSM node 上野公園前');

// No.58 原宿〜表参道〜六本木：原宿駅→明治神宮前→表参道→青山→六本木駅。
const harajuku = P('harajuku', '原宿駅', 35.67021, 139.70243, 'OSM station 原宿');
const meijiJinguMae = P('meiji_jingu_mae', '明治神宮前〈原宿〉駅', 35.66897, 139.70436, 'OSM station 明治神宮前〈原宿〉');
const omotesando = P('omotesando', '表参道駅', 35.6658, 139.71291, 'OSM 表参道駅');
const aoyama = P('aoyama', '青山学院（青山キャンパス前）', 35.66733, 139.71858, 'OSM place_of_worship 青山教会（青山学院前の通り沿い）; 学院の点は地図レビュー待ち');
const roppongi = P('roppongi2', '六本木駅', 35.66331, 139.73278, 'OSM subway_entrance 六本木');
const nogizaka = P('nogizaka2', '乃木坂駅', 35.6667, 139.72634, 'OSM station 乃木坂');
const azabuJuban = P('azabu_juban', '麻布十番駅', 35.65518, 139.73715, 'OSM station 麻布十番');

// No.59 立川〜国立〜国分寺：立川北駅→国立駅→はけ方面→国分寺駅（西国分寺駅）。
const tachikawaKita = P('tachikawa_kita', '立川北駅', 35.69942, 139.4125, 'OSM station 立川北');
const kunitachiNorth = P('kunitachi_n', '国立駅 北口', 35.69946, 139.44627, 'OSM node 国立駅北口');
const nishiKokubunji = P('nishi_kokubunji', '西国分寺駅', 35.69975, 139.46608, 'OSM station 西国分寺');
const haKe = P('hake', '国分寺崖線「はけ」', 35.703, 139.47, 'TOPIC: はけの遊歩道。OSMの正確な位置は地図レビュー待ち');
const kokubunjiSt = P('kokubunji_st', '国分寺駅', 35.70024, 139.466, 'OSM stop 西国分寺（最寄りの駅）');

const jobs = {
  'no-55': { courseId: 'No.55', slug: 'no-55', variants: { standard: [higashiKoganei, koganeiPark, musashiKoganei] } },
  'no-56': { courseId: 'No.56', slug: 'no-56', variants: { standard: [tokyoSt, nijubashiMae, kokyoGaien, hibiyaPark, ginza4, kyobashi, nihonbashi, tokyoSt] } },
  'no-57': { courseId: 'No.57', slug: 'no-57', variants: { standard: [ryogokuW, umaBashi, umaBashiE, kaminarimon, sensoJi, uenoSt] } },
  'no-58': { courseId: 'No.58', slug: 'no-58', variants: { standard: [harajuku, meijiJinguMae, omotesando, aoyama, azabuJuban, roppongi] } },
  'no-59': { courseId: 'No.59', slug: 'no-59', variants: { standard: [tachikawaKita, kunitachiNorth, haKe, nishiKokubunji] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
