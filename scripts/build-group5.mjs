// 第5グループ（No.25〜No.30）の A を計算する。駅・公園・寺社・橋は OSM の名称付き点のみ。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.25 日本橋：日本橋駅→日本橋（欄干）→三井記念美術館→鎧橋→茅場町駅→人形町→水天宮前→浜町。
const nihonbashiSt = P('nihonbashi_st', '日本橋駅', 35.68165, 139.7762, 'OSM information 日本橋駅');
const nihonbashi = P('nihonbashi', '日本橋（橋の中央）', 35.68257, 139.77377, 'OSM node 日本橋（橋）');
const uogashi = P('uogashi', '日本橋魚河岸発祥の地', 35.68434, 139.77485, 'OSM memorial 日本橋魚河岸発祥の地');
const mitsuiMuseum = P('mitsui_museum', '三井記念美術館', 35.68684, 139.77307, 'OSM museum 三井記念美術館');
const yoroibashi = P('yoroibashi', '鎧橋', 35.68, 139.77954, 'OSM 茅場町（鎧橋東詰）; 橋の座標が取れず茅場町の近くの点');
const kayabacho = P('kayabacho', '茅場町駅', 35.68001, 139.78012, 'OSM stop 茅場町');
const ningyocho = P('ningyocho', '人形町駅', 35.68618, 139.78242, 'OSM station 人形町');
const karakuri = P('karakuri', '人形町からくり櫓', 35.68474, 139.78382, 'OSM clock 人形町からくり櫓');
const suitengu = P('suitengu', '水天宮前', 35.68388, 139.78448, 'OSM stop 水天宮前');
const hamacho = P('hamacho', '浜町公園', 35.68771, 139.78783, 'OSM information 中央区立浜町公園案内図');

// No.26 旧古河庭園：駒込駅→旧古河庭園→（西ヶ原側）→巣鴨→駒込（周遊）。
const komagome = P('komagome', '駒込駅', 35.73658, 139.74724, 'OSM station 駒込');
const kyuFurukawa = P('kyu_furukawa', '旧古河庭園', 35.74252, 139.74625, 'OSM garden 旧古河庭園');
const rikugien = P('rikugien', '六義園', 35.73484, 139.74681, 'OSM information 六義園');
const sugamoSt = P('sugamo', '巣鴨駅', 35.73341, 139.73943, 'OSM station 巣鴨');
const jizoStreet = P('jizo_street', '巣鴨地蔵通り商店街', 35.7354, 139.7352, 'OSM 巣鴨地蔵通り商店街（巣鴨駅前の通り）; 正確な位置は地図レビュー待ち');

// No.27 国分寺崖線「はけ」：新小金井駅→はけの森美術館→武蔵野公園→武蔵小金井駅。
const shinKoganei = P('shin_koganei', '新小金井駅', 35.6944, 139.52603, 'OSM node 新小金井駅');
const hakeBijutsu = P('hake_museum', 'はけの森美術館', 35.69529, 139.51288, 'OSM museum はけの森美術館');
const hakeMori = P('hake_mori', 'はけの森緑地２', 35.69634, 139.50658, 'OSM park はけの森緑地２');
const musashinoPark = P('musashino_park', '武蔵野公園', 35.69021, 139.51835, 'OSM park 武蔵野公園');
const musashiKoganei = P('musashi_koganei', '武蔵小金井駅', 35.70113, 139.50679, 'OSM station 武蔵小金井');

// No.28 四谷・若葉：信濃町駅→若葉東公園→須賀神社（男坂・女坂）→新宿歴史博物館→四ツ谷駅。
const shinanomachi = P('shinanomachi', '信濃町駅', 35.68002, 139.72049, 'OSM station 信濃町');
const wakabaHigashi = P('wakaba_higashi', '若葉東公園', 35.68325, 139.72875, 'OSM garden 若葉東公園');
const sugaJinja = P('suga_jinja', '須賀神社', 35.68536, 139.72259, 'OSM place_of_worship 須賀神社');
const sugaOnnazaka = P('suga_onnazaka', '須賀神社 女坂', 35.68536, 139.723, 'OSM attraction 須賀神社 女坂');
const shinjukuHistory = P('shinjuku_history', '新宿歴史博物館', 35.68889, 139.72462, 'OSM information 新宿歴史博物館');
const yotsuyaSt = P('yotsuya', '四ツ谷駅', 35.68603, 139.73062, 'OSM station 四ツ谷');

// No.29 等々力渓谷：等々力駅→ゴルフ橋→等々力渓谷公園→等々力不動尊→玉川野毛町公園→用賀駅方面（上野毛駅へ抜ける）。
const todoroki = P('todoroki', '等々力駅', 35.60836, 139.64802, 'OSM station 等々力');
const golfBridge = P('golf_bridge', 'ゴルフ橋', 35.60787, 139.64651, 'OSM node ゴルフ橋');
const todorokiKeikoku = P('todoroki_keikoku', '等々力渓谷公園', 35.60482, 139.6445, 'OSM park 等々力渓谷公園');
const todorokiFudo = P('todoroki_fudo', '等々力不動尊', 35.60369, 139.64689, 'OSM place_of_worship 等々力不動尊');
const tamaNoge = P('tama_noge', '玉川野毛町公園', 35.60551, 139.64246, 'OSM park 玉川野毛町公園');
const kaminoge = P('kaminoge', '上野毛駅', 35.61204, 139.63892, 'OSM stop 上野毛');

// No.30 日野：高幡不動駅→高幡不動尊→黒川清流公園→豊田駅（浅川親水公園は名称ノードが見つからない）。
const takahata = P('takahata', '高幡不動駅', 35.66128, 139.41515, 'OSM station 高幡不動');
const takahataFudo = P('takahata_fudo', '高幡不動尊', 35.66222, 139.41088, 'OSM place_of_worship 高幡不動尊');
const hinoLibrary = P('hino_library', '日野市郷土資料館', 35.65248, 139.41149, 'OSM museum 日野市郷土資料館');
const kurokawa = P('kurokawa', '黒川清流公園', 35.66424, 139.38479, 'OSM park 黒川清流公園');
const toyoda = P('toyoda', '豊田駅', 35.66084, 139.38057, 'OSM stop 豊田駅前');

const jobs = {
  'no-25': { courseId: 'No.25', slug: 'no-25', variants: { standard: [nihonbashiSt, nihonbashi, uogashi, mitsuiMuseum, kayabacho, ningyocho, karakuri, suitengu, hamacho] } },
  'no-26': { courseId: 'No.26', slug: 'no-26', variants: { standard: [komagome, kyuFurukawa, rikugien, sugamoSt] } },
  'no-27': { courseId: 'No.27', slug: 'no-27', variants: { standard: [shinKoganei, musashinoPark, hakeBijutsu, hakeMori, musashiKoganei] } },
  'no-28': { courseId: 'No.28', slug: 'no-28', variants: { standard: [shinanomachi, sugaOnnazaka, sugaJinja, shinjukuHistory, wakabaHigashi, yotsuyaSt] } },
  'no-29': { courseId: 'No.29', slug: 'no-29', variants: { standard: [todoroki, golfBridge, todorokiKeikoku, todorokiFudo, tamaNoge, kaminoge] } },
  'no-30': { courseId: 'No.30', slug: 'no-30', variants: { standard: [takahata, takahataFudo, hinoLibrary, kurokawa, toyoda] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
