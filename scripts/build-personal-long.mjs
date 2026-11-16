// 個人散歩のうち 4km 未満に縮んだ E1/E3/Z2/Z5/S13 を、周辺の名称付き観光地点（OSM）を足して 6〜7km に組み直す。
import { P, buildCourse } from './lib-rebuild.mjs';

// E1 三島：三島駅→柿田川公園→佐野美術館→三嶋大社→菰池公園→白滝公園→楽寿園→三島駅（環状）。
const mishimaSt = P('mishima_st', '三島駅', 35.12588, 138.91084, 'OSM station 三島');
const mishimaStEnd = P('mishima_st_end', '三島駅（戻り）', 35.12588, 138.91084, 'OSM station 三島');
const kakita = P('kakita', '柿田川公園', 35.10761, 138.9012, 'OSM park 柿田川公園');
const sano = P('sano', '佐野美術館', 35.11493, 138.91593, 'OSM museum 佐野美術館');
const mishimaTaisha = P('mishima_taisha', '三嶋大社', 35.1214, 138.91971, 'OSM museum 三嶋大社宝物館');
const komoike = P('komoike', '菰池公園', 35.12542, 138.91586, 'OSM park 菰池公園');
const shirataki = P('shirataki', '白滝公園', 35.12274, 138.91447, 'OSM node 白滝公園');
const rakuju = P('rakuju', '楽寿園', 35.12491, 138.91099, 'OSM park 三島市立公園 楽寿園');

// E3 浜松：浜松駅→楽器博物館→浜松城公園入口→浜松城→浜松市美術館→犀ヶ崖資料館→賀茂真淵記念館→浜松駅。
const hamamatsuSt = P('hamamatsu_st', '浜松駅', 34.70528, 137.73356, 'OSM node 浜松駅');
const hamamatsuStEnd = P('hamamatsu_st_end', '浜松駅（戻り）', 34.70528, 137.73356, 'OSM node 浜松駅');
const gakki = P('gakki', '浜松市楽器博物館', 34.70662, 137.73822, 'OSM museum 浜松市楽器博物館');
const jouIri = P('hamamatsu_jo_iri', '浜松城公園入口', 34.71299, 137.72758, 'OSM node 2569338403 浜松城公園入口（東側の入口）');
const jo = P('hamamatsu_jo', '浜松城跡（天守閣）', 34.71174, 137.72507, 'OSM information 浜松城跡');
const bijutsu = P('hamamatsu_bijutsu', '浜松市美術館', 34.71184, 137.72374, 'OSM gallery 浜松市美術館');
const saigagake = P('saigagake', '浜松市犀ヶ崖資料館', 34.71932, 137.71861, 'OSM museum 浜松市犀ヶ崖資料館');
const mabuchi = P('mabuchi', '賀茂真淵記念館', 34.70081, 137.71607, 'OSM museum 賀茂真淵記念館');

// Z2 神戸：三宮駅→生田宮→諏訪神社→ヴィーナスブリッジ→花隈厳島神社→神戸華僑歴史博物館→神戸海洋博物館→中突堤→ハーバーランド→神戸駅。
const sannomiya = P('sannomiya', '神戸三宮駅', 34.69316, 135.19286, 'OSM station 神戸三宮');
const ikuta = P('ikuta', '生田宮', 34.69423, 135.19089, 'OSM yes 生田宮');
const suwa = P('suwa', '諏訪神社', 34.69642, 135.17989, 'OSM place_of_worship 諏訪神社');
const venus = P('venus', 'ヴィーナスブリッジ', 34.69718, 135.18077, 'OSM viewpoint ヴィーナスブリッジ');
const hanakuma = P('hanakuma', '花隈厳島神社', 34.6887, 135.18211, 'OSM place_of_worship 花隈厳島神社');
const kakyo = P('kakyo', '神戸華僑歴史博物館', 34.68599, 135.18716, 'OSM museum 神戸華僑歴史博物館');
const kaiyo = P('kaiyo', '神戸海洋博物館', 34.68295, 135.18845, 'OSM museum 神戸海洋博物館');
const chutottei = P('chutottei', '中突堤旅客ターミナル', 34.68009, 135.18854, 'OSM ferry_terminal 中突堤旅客ターミナル');
const mosaicMae = P('mosaic_mae', 'ハーバーランド（モザイク前）', 34.68149, 135.18413, 'OSM node 6033546386 ハーバーランド(モザイク前)');
const kobeSt = P('kobe_st', '神戸駅', 34.67929, 135.17828, 'OSM station 神戸');

// Z5 富山：富山駅→楽翠亭美術館→泉と滝の広場→環水公園→松川遊覧船→富山城址→富山市ガラス美術館→富山駅。
const toyamaSt = P('toyama_st', '富山駅', 36.70158, 137.21294, 'OSM tram_stop 富山駅');
const toyamaStEnd = P('toyama_st_end', '富山駅（戻り）', 36.70158, 137.21294, 'OSM tram_stop 富山駅');
const rakusui = P('rakusui', '楽翠亭美術館', 36.7064, 137.21724, 'OSM museum 楽翠亭美術館');
const kankeiSpring = P('kankei_spring', '泉と滝の広場', 36.70798, 137.21374, 'OSM node 泉と滝の広場');
const kankeiPark = P('kankei_park', '富岩運河環水公園', 36.70967, 137.2126, 'OSM 富岩運河環水公園');
const kyoiku = P('kyoiku', '富山県教育記念館', 36.69782, 137.21704, 'OSM museum 富山県教育記念館');
const matsukawa = P('matsukawa', '松川遊覧船乗降場', 36.69453, 137.21256, 'OSM viewpoint 松川遊覧船乗降場');
const toyamaJo = P('toyama_jo', '富山城址', 36.69267, 137.21111, 'OSM information 富山城の石垣について（城址公園内）');
const glass = P('toyama_glass', '富山市ガラス美術館', 36.68835, 137.21494, 'OSM museum 富山市ガラス美術館');

// S13 日野：万願寺駅→万願寺渡西公園→万願寺一里塚→土方歳三資料館→石田寺→水車公園→浅川スポーツ公園→高幡不動尊→高幡不動駅。
const manganji = P('manganji', '万願寺駅', 35.67022, 139.41933, 'OSM node 万願寺駅');
const watanishi = P('watanishi', '万願寺渡西公園', 35.67826, 139.41596, 'OSM park 万願寺渡西公園');
const ichirizuka = P('ichirizuka', '万願寺一里塚', 35.67478, 139.41521, 'OSM archaeological_site 万願寺一里塚');
const hijikata = P('hijikata_museum', '土方歳三資料館', 35.66976, 139.41967, 'OSM museum 土方歳三資料館');
const sekidenji = P('sekidenji', '石田寺', 35.66819, 139.42438, 'OSM place_of_worship 石田寺');
const kitagawara = P('kitagawara', '北川原公園', 35.67239, 139.42314, 'OSM park 北川原公園');
const muramae = P('muramae', '村前公園', 35.66656, 139.40516, 'OSM park 村前公園');
const misawa = P('misawa', '三澤八幡神社', 35.65839, 139.41859, 'OSM place_of_worship 三澤八幡神社');
const suisha = P('suisha', '水車公園', 35.67334, 139.42022, 'OSM park 水車公園');
const asakawaPark = P('asakawa_park', '浅川スポーツ公園', 35.66786, 139.41305, 'OSM sports_centre 浅川スポーツ公園');
const takahataFudoS = P('takahata_fudo_s', '高幡不動尊', 35.66222, 139.41088, 'OSM place_of_worship 高幡不動尊');
const takahataStS = P('takahata_st_s', '高幡不動駅', 35.66142, 139.41519, 'OSM node 高幡不動駅');

const jobs = {
  E1: { courseId: 'E1', slug: 'e1', variants: { standard: [mishimaSt, kakita, sano, mishimaTaisha, komoike, shirataki, rakuju, mishimaStEnd] } },
  E3: { courseId: 'E3', slug: 'e3', variants: { standard: [hamamatsuSt, gakki, jouIri, jo, bijutsu, mabuchi, hamamatsuStEnd] } },
  Z2: { courseId: 'Z2', slug: 'z2', variants: { standard: [sannomiya, ikuta, suwa, hanakuma, kakyo, chutottei, mosaicMae, kobeSt] } },
  Z5: { courseId: 'Z5', slug: 'z5', variants: { standard: [toyamaSt, kyoiku, rakusui, kankeiSpring, kankeiPark, matsukawa, toyamaJo, glass] } },
  S13: { courseId: 'S13', slug: 's13', variants: { standard: [manganji, hijikata, sekidenji, asakawaPark, muramae, takahataFudoS, misawa, takahataStS] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
