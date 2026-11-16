// 第7グループ（No.37〜No.42）の A を計算する。駅・橋・公園・寺社は OSM の名称付き点のみ。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.37 多摩川上流：二子玉川駅→二子橋→多摩川緑地→宿河原→登戸駅。
const futako = P('futako', '二子玉川駅', 35.61179, 139.6268, 'OSM station 二子玉川');
const futakobashi = P('futakobashi', '二子橋', 35.60801, 139.62325, 'OSM node 297176384 二子橋');
const tmrSetamachi = P('tmr_setamachi', '多摩川緑地（瀬田周辺）', 35.60808, 139.62388, 'OSM information 川崎市多摩川緑地瀬田周辺エリア案内板');
const tmrUpper = P('tmr_upper', '多摩川緑地（上流）', 35.61902, 139.58459, 'OSM park 多摩川緑地（二子玉川より上流）');
const shukugawara = P('shukugawara', '宿河原駅', 35.61534, 139.57976, 'OSM station 宿河原');
const noborito = P('noborito', '登戸駅', 35.62082, 139.57001, 'OSM station 登戸');

// No.38 多摩川・浅川：聖蹟桜ヶ丘駅→関戸橋→一ノ宮→百草園駅→高幡不動駅。
const seiseki = P('seiseki', '聖蹟桜ヶ丘駅', 35.6508, 139.44689, 'OSM stop 聖蹟桜ヶ丘');
const sekidoBashi = P('sekido_bashi', '関戸橋北', 35.65533, 139.45569, 'OSM node 131904960 関戸橋北');
const ichinomiya = P('ichinomiya', '一ノ宮', 35.65177, 139.43746, 'OSM node 一ノ宮（交差点）');
const mogusaen = P('mogusaen', '百草園駅', 35.65713, 139.43086, 'OSM node 百草園駅前');
const takahata = P('takahata', '高幡不動駅', 35.66128, 139.41515, 'OSM station 高幡不動');
const takahataFudo = P('takahata_fudo', '高幡不動尊', 35.66222, 139.41088, 'OSM place_of_worship 高幡不動尊');

// No.39 荒川・千住：北千住駅→千住新橋→堀切橋→堀切菖蒲園駅→京成関屋駅。
const kitasenju = P('kitasenju', '北千住駅', 35.74954, 139.80509, 'OSM station 北千住');
const senjuShinbashi = P('senju_shinbashi', '千住新橋（南詰）', 35.75723, 139.80207, 'OSM node 441675524 千住新橋南詰');
const horikiriBashi = P('horikiri_bashi', '堀切橋（西詰）', 35.74493, 139.81688, 'OSM node 364659601 堀切橋西詰');
const horikiriShobuen = P('horikiri_shobuen', '堀切菖蒲園駅', 35.74333, 139.8176, 'OSM stop 堀切（堀切菖蒲園駅前）');
const keiseiSekiya = P('keisei_sekiya', '京成関屋駅', 35.74401, 139.81178, 'OSM stop 京成関屋');

// No.40 荒川・岩淵：赤羽岩淵駅→新荒川大橋→荒川知水資料館→荒川赤羽緑地→志茂→赤羽駅。
const akabaneIwabuchi = P('akabane_iwabuchi', '赤羽岩淵駅', 35.78345, 139.72247, 'OSM node 366548486 赤羽岩淵駅');
const shinArakawa = P('shin_arakawa', '新荒川大橋', 35.78664, 139.72253, 'OSM node 305964401 新荒川大橋');
const chisuShiryo = P('chisu_shiryo', '荒川知水資料館', 35.78562, 139.73012, 'OSM museum 荒川知水資料館');
const akabaneMidori = P('akabane_midori', '荒川赤羽緑地（志茂）', 35.77995, 139.73368, 'OSM 志茂東ふれあい館前; 緑地の名称ノードは見つからず近くの点');
const akabaneSt = P('akabane', '赤羽駅', 35.77791, 139.72008, 'OSM bus_station 赤羽駅西口');

// No.41 江戸川・柴又：金町駅→中川大橋→柴又帝釈天→柴又駅→京成高砂駅。
const kanamachi = P('kanamachi', '金町駅', 35.76952, 139.87071, 'OSM stop 金町');
const nakagawaBashi = P('nakagawa_bashi', '中川大橋東', 35.76037, 139.85971, 'OSM node 465306559 中川大橋東');
const shibamataTaishakuten = P('shibamata', '柴又帝釈天', 35.75842, 139.87874, 'OSM place_of_worship 柴又帝釈天');
const shibamataSt = P('shibamata_st', '柴又駅', 35.75633, 139.87517, 'OSM node 柴又駅');
const keiseiTakanawa = P('keisei_takasago', '京成高砂駅', 35.75095, 139.86694, 'OSM node 京成高砂駅');

// No.42 横浜ベイエリア：石川町駅→中華街→大さん橋→臨港パーク→みなとみらい駅。
const ishikawacho = P('ishikawacho', '石川町駅', 35.441, 139.64233, 'OSM 中華街西門付近; 石川町駅の位置は地図レビュー待ち');
const chukagai = P('chukagai', '横浜中華街', 35.44288, 139.6452, 'OSM attraction 横浜中華街');
const osanbashi = P('osanbashi', '大さん橋入口', 35.44616, 139.64374, 'OSM node 290045152 大さん橋入口');
const rinkoPark = P('rinko_park', '臨港パーク入口', 35.46271, 139.63325, 'OSM node 臨港パーク入口');
const minatomirai = P('minatomirai', 'みなとみらい駅前', 35.4571, 139.63308, 'OSM node みなとみらい駅前');
const akarenga = P('akarenga', '赤レンガ倉庫前', 35.45251, 139.64151, 'OSM node 281755214 赤レンガ倉庫前');

const jobs = {
  'no-37': { courseId: 'No.37', slug: 'no-37', variants: { standard: [futako, futakobashi, tmrUpper, shukugawara, noborito] } },
  'no-38': { courseId: 'No.38', slug: 'no-38', variants: { standard: [seiseki, ichinomiya, mogusaen, takahataFudo, takahata] } },
  'no-39': { courseId: 'No.39', slug: 'no-39', variants: { standard: [kitasenju, senjuShinbashi, horikiriBashi, horikiriShobuen, keiseiSekiya], } },
  'no-40': { courseId: 'No.40', slug: 'no-40', variants: { standard: [akabaneIwabuchi, shinArakawa, chisuShiryo, akabaneSt] } },
  'no-41': { courseId: 'No.41', slug: 'no-41', variants: { standard: [kanamachi, nakagawaBashi, shibamataTaishakuten, shibamataSt, keiseiTakanawa] } },
  'no-42': { courseId: 'No.42', slug: 'no-42', variants: { standard: [ishikawacho, chukagai, osanbashi, akarenga, rinkoPark, minatomirai] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
