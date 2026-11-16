// 第8グループ（No.43, No.44, No.45, No.46, No.48）の A を計算する。No.47 は既に A/B/C がある。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.43 夢の大橋・豊洲：東京テレポート駅→夢の大橋→晴海大橋南詰→豊洲公園→豊洲駅。
const teleport = P('teleport', '東京テレポート駅前', 35.6269, 139.7798, 'OSM node 東京テレポート駅前');
const yumenoOhashi = P('yume_no_ohashi', '夢の大橋', 35.62756, 139.78223, 'OSM memorial 夢の大橋 田中賞受賞記念');
const harumiOhashi = P('harumi_ohashi', '晴海大橋南詰', 35.64803, 139.78927, 'OSM node 晴海大橋南詰');
const toyosuPark = P('toyosu_park', '豊洲公園', 35.65351, 139.7928, 'OSM park 豊洲公園');
const toyosuSt = P('toyosu_st', '豊洲駅', 35.65443, 139.79589, 'OSM subway_entrance 豊洲駅');

// No.44 スカイブリッジ：小島新田駅→多摩川スカイブリッジ→天空橋駅→羽田空港第3ターミナル駅。
const kojimashinden = P('kojimashinden', '小島新田駅', 35.53477, 139.74791, 'OSM station 小島新田');
const skyBridgeS = P('sky_bridge_s2', '多摩川スカイブリッジ南', 35.54045, 139.76095, 'OSM node 819656082 多摩川スカイブリッジ（南端）');
const skyBridgeN = P('sky_bridge_n2', '多摩川スカイブリッジ北', 35.54425, 139.7633, 'OSM node 7654141396 多摩川スカイブリッジ北');
const tenkubashiSt = P('tenkubashi_st', '天空橋駅', 35.54811, 139.75469, 'OSM station 天空橋');
const deck = P('deck', '展望デッキ', 35.54528, 139.76953, 'OSM viewpoint 展望デッキ（羽田空港）');
const hanedaT3 = P('haneda_t3b', '羽田空港第3ターミナル駅', 35.54389, 139.76865, 'OSM station 羽田空港第3ターミナル');

// No.45 木更津：木更津駅西口→鳥居崎海浜公園→中の島大橋→木更津駅。
const kisarazuSt = P('kisarazu_st', '木更津駅西口', 35.38122, 139.92526, 'OSM node 木更津駅西口');
const toriizaki = P('toriizaki', '鳥居崎海浜公園', 35.38151, 139.91384, 'OSM park 鳥居崎海浜公園');
const nakanoShimaOhashi = P('nakano_shima_ohashi', '中の島大橋', 35.38366, 139.91263, 'OSM node 55683492 中の島大橋');

// No.46 夢の島・葛西：新木場駅→夢の島熱帯植物館→夢の島緑道公園→葛西臨海水族園→葛西臨海公園駅。
const shinkiba = P('shinkiba', '新木場駅', 35.64585, 139.82703, 'OSM 新木場 station');
const nettaikan = P('nettaikan', '東京都夢の島熱帯植物館', 35.65134, 139.8294, 'OSM garden 東京都夢の島熱帯植物館');
const yumenoshimaMidori = P('yumenoshima_midori', '夢の島緑道公園', 35.64726, 139.82372, 'OSM park 夢の島緑道公園');
const kasaiAquarium = P('kasai_aquarium', '葛西臨海水族園', 35.64078, 139.86195, 'OSM aquarium 葛西臨海水族園');
const kasaiSt = P('kasai_st', '葛西臨海公園駅', 35.64441, 139.8616, 'OSM station 葛西臨海公園');

// No.48 両国〜スカイツリー：両国駅→吾妻橋→浅草寺→隅田公園→東京スカイツリー→押上駅。
const ryogokuSt = P('ryogoku_st', '両国駅', 35.70205, 139.7976, 'OSM 両国 station; 駅の正確な点は地図レビュー待ち');
const azumaBashi = P('azuma_bashi', '吾妻橋', 35.7107, 139.79774, 'OSM node 1691781635 吾妻橋');
const sensoJi = P('sensoji', '浅草寺', 35.71476, 139.79667, 'OSM 浅草寺; 正確な点は地図レビュー待ち');
const sumidaPark = P('sumida_park', '隅田公園', 35.7135, 139.8005, 'TOPIC: 隅田公園。OSMの点は地図レビュー待ち');
const skytree = P('skytree', '東京スカイツリー', 35.71006, 139.81071, 'OSM attraction 東京スカイツリー');
const oshiage = P('oshiage', '押上駅', 35.71061, 139.81277, 'OSM station 押上');

const jobs = {
  'no-43': { courseId: 'No.43', slug: 'no-43', variants: { standard: [teleport, yumenoOhashi, harumiOhashi, toyosuPark, toyosuSt] } },
  'no-44': { courseId: 'No.44', slug: 'no-44', variants: { standard: [kojimashinden, skyBridgeS, skyBridgeN, tenkubashiSt, hanedaT3] } },
  'no-45': { courseId: 'No.45', slug: 'no-45', variants: { standard: [kisarazuSt, toriizaki, nakanoShimaOhashi, kisarazuSt] } },
  'no-46': { courseId: 'No.46', slug: 'no-46', variants: { standard: [shinkiba, nettaikan, kasaiAquarium, kasaiSt] } },
  'no-48': { courseId: 'No.48', slug: 'no-48', variants: { standard: [ryogokuSt, azumaBashi, sensoJi, sumidaPark, skytree, oshiage] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
