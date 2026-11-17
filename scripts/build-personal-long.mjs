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

// S6 中野〜荻窪：中野駅→中野区立中央西公園→新高円寺公園→蚕糸の森公園→高円寺北二公園→阿佐谷神明宮→天沼弁天池公園→大田黒公園→荻窪駅。
const nakano = P('nakano_s', '中野駅', 35.70583, 139.66546, 'OSM node 中野駅');
const chuoNishi = P('chuo_nishi', '中野区立中央西公園', 35.69928, 139.66379, 'OSM park 中野区立中央西公園');
const shinKoenji = P('shin_koenji', '杉並区立新高円寺公園', 35.69913, 139.64555, 'OSM park 杉並区立新高円寺公園');
const sanshi = P('sanshi', '蚕糸の森公園', 35.69706, 139.65671, 'OSM park 蚕糸の森公園');
const koenjiKita = P('koenji_kita', '高円寺北二公園', 35.70695, 139.6527, 'OSM park 高円寺北二公園');
const shinmeigu = P('shinmeigu', '阿佐谷神明宮', 35.70722, 139.63699, 'OSM place_of_worship 阿佐谷神明宮');
const amanuma = P('amanuma', '天沼弁天池公園', 35.70853, 139.62153, 'OSM park 天沼弁天池公園');
const ootaguro = P('ootaguro', '大田黒公園', 35.70086, 139.6247, 'OSM park 大田黒公園');
const ogikuboLong = P('ogikubo_long', '荻窪駅', 35.70518, 139.62126, 'OSM node 荻窪駅北口');

// S1 玉川上水：三鷹駅→三鷹市美術ギャラリー→あけぼのふれあい公園 水源の森→境南中央公園→武蔵境駅→武蔵野ふるさと歴史館→梶野公園→東小金井駅→武蔵小金井駅。
const mitaka = P('mitaka_s', '三鷹駅', 35.70272, 139.56093, 'OSM station 三鷹');
const musashisakai = P('musashisakai', '武蔵境駅', 35.70195, 139.54405, 'OSM station 武蔵境');
const higashiKoganei = P('higashi_koganei_s', '東小金井駅', 35.69748, 139.52422, 'OSM node 東小金井駅入口');
const musashiKoganei = P('musashi_koganei_s', '武蔵小金井駅', 35.70145, 139.50581, 'OSM node 武蔵小金井駅');
const mitakaG =P('mitaka_gallery', '三鷹市美術ギャラリー', 35.70174, 139.56088, 'OSM museum 三鷹市美術ギャラリー');
const akebono = P('akebono', 'あけぼのふれあい公園 水源の森', 35.69739, 139.55251, 'OSM park あけぼのふれあい公園 水源の森');
const kyonanChuo = P('kyonan_chuo', '境南中央公園', 35.69921, 139.53641, 'OSM park 境南中央公園');
const furosato = P('furosato', '武蔵野ふるさと歴史館', 35.70234, 139.53468, 'OSM museum 武蔵野ふるさと歴史館');
const ajisai = P('ajisai', '武蔵野市立あじさい公園', 35.70572, 139.53665, 'TOPIC: あじさい公園。OSMの名称ノードは地図レビュー待ち');
const kajino = P('kajino', '梶野公園', 35.70313, 139.52646, 'OSM park 梶野公園');

// Z3 福岡：博多駅→楽水園→博多町家ふるさと館→櫛田神社飾り山笠→川端商店街→中洲屋台→福岡アジア美術館→福岡県立美術館→新天町商店街→大濠公園。
const rakusuien = P('rakusuien', '樂水園', 33.58655, 130.41327, 'OSM attraction 樂水園');
const machiya = P('machiya', '博多町家ふるさと館', 33.59365, 130.41151, 'OSM museum 博多町家鄉土館');
const kushida = P('kushida', '櫛田神社（飾り山笠）', 33.59282, 130.41058, 'OSM attraction 櫛田神社飾り山笠');
const kawabata = P('kawabata', '川端商店街', 33.59255, 130.41023, 'OSM attraction 川端商店街');
const nakasuYatai = P('nakasu_yatai', '中洲屋台', 33.59139, 130.40706, 'OSM attraction 中洲屋台');
const asiaBijutsu = P('asia_bijutsu', '福岡アジア美術館', 33.59497, 130.40582, 'OSM museum 福岡アジア美術館');
const kenBijutsu = P('ken_bijutsu', '福岡県立美術館', 33.59727, 130.39873, 'OSM museum 福岡県立美術館');
const shintencho = P('shintencho', '新天町商店街', 33.59019, 130.39745, 'OSM attraction 新天町商店街');
const ohori = P('ohori', '大濠公園', 33.59018, 130.37722, 'OSM node 大濠公園');

const jobs = {
  S6: { courseId: 'S6', slug: 's6', variants: { standard: [nakano, chuoNishi, sanshi, shinKoenji, koenjiKita, shinmeigu, ootaguro, amanuma] } },
  S1: { courseId: 'S1', slug: 's1', variants: { standard: [mitaka, mitakaG, akebono, musashisakai, furosato, kyonanChuo, ajisai, musashiKoganei] } },
  Z3: { courseId: 'Z3', slug: 'z3', variants: { standard: [rakusuien, machiya, kushida, kawabata, nakasuYatai, asiaBijutsu, kenBijutsu, shintencho, ohori] } },
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
