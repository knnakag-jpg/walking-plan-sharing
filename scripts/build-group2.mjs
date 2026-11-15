// 第2グループ（No.9, No.10, No.12, No.13）の A を計算する。駅・寺社・公園・橋は OSM の名称付き点のみ。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.9 高尾山：ケーブルカーの線形は徒歩経路に含めず、山上駅から薬王院・山頂を歩き、蛇滝口へ下りて高尾山口駅へ。
const takaosanGuchiSt = P('takao_sanguchi', '高尾山口駅', 35.6325, 139.26991, 'OSM node 6003241794 高尾山口 station');
const cableSanjo = P('cable_sanjo', '高尾登山ケーブル 高尾山駅（山上）', 35.63111, 139.26153, 'OSM node 高尾登山ケーブル（山上）');
const cableShitakiyo = P('cable_shitakiyo', '高尾登山ケーブル 清滝駅', 35.6311, 139.26677, 'OSM node 清滝（ケーブル下駅）');
const yakuoin = P('yakuoin', '高尾山薬王院', 35.62598, 139.24973, 'OSM node 高尾山薬王院 place_of_worship');
const sancho = P('sancho', '高尾山頂', 35.62575, 139.25004, 'OSM information 高尾山頂; 三角点の正確な位置は地図レビュー待ち');
const jaguchi = P('jaguchi', '蛇滝口', 35.63913, 139.25819, 'OSM node 2963604825 蛇滝口');

// No.10 羽田：天空橋駅→HANEDA INNOVATION CITY→多摩川沿い→スカイブリッジ北端→旧穴守稲荷大鳥居→京急大師橋駅または羽田空港第3ターミナル。
const tenkubashi = P('tenkubashi', '天空橋駅', 35.54811, 139.75469, 'OSM node 天空橋 station');
const hic = P('hic', 'HANEDA INNOVATION CITY', 35.54788, 139.75519, 'OSM information HANEDA INNOVATION CITY');
const skyBridgeN = P('sky_bridge_n', '多摩川スカイブリッジ北', 35.54425, 139.7633, 'OSM node 7654141396 多摩川スカイブリッジ北');
const skyBridgeS = P('sky_bridge_s', '多摩川スカイブリッジ南（多摩川緑地側）', 35.54045, 139.76095, 'OSM node 819656082 多摩川スカイブリッジ（南端）');
const okunoinTorii = P('okunoin_torii', '旧穴守稲荷神社 大鳥居', 35.54658, 139.7524, 'OSM node 617802345 旧穴守稲荷神社 大鳥居');
const tmrYokudo = P('tmr_yokudo', '多摩川緑地（殿町地区）', 35.54096, 139.74239, 'OSM node 多摩川緑地（殿町地区） park');
const keikyuDaishibashi = P('keikyu_daishibashi', '大師橋駅', 35.53662, 139.74058, 'OSM node 7878805495 大師橋 station');
const hanedaT3 = P('haneda_t3', '羽田空港第3ターミナル駅', 35.54389, 139.76865, 'OSM node 羽田空港第3ターミナル station');

// No.12 立川：立川駅→ファーレ立川→昭島側の玉川上水・残堀川→昭島駅。旧案の五日市街道往復は採らない。
const tachikawaSt = P('tachikawa', '立川駅', 35.69775, 139.41388, 'OSM station 立川; exit pending');
const fareTachikawa = P('faret', 'ファーレ立川センタースクエア', 35.70216, 139.4141, 'OSM art area ファーレ立川');
const tachikawaKita = P('tachikawa_n', 'ファーレ立川北', 35.70282, 139.41494, 'OSM node ファーレ立川北');
const shiyakusho = P('shiyakusho', '昭島市役所東部出張所', 35.70372, 139.38205, 'OSM node 昭島市役所東部出張所');
const tamagawaJosui = P('tamagawa_josui', '残堀川（昭島・東町付近）', 35.70806, 139.39193, 'OSM way 60964072 残堀川 river; 玉川上水はこの範囲で名称ノードが見つからず、河道の座標は未確認のため使わない');
const higashinakagami = P('higashinakagami', '東中神駅', 35.70645, 139.38411, 'OSM node 東中神 stop（JR青梅線）');
const akishimaSt = P('akishima', '昭島駅', 35.71357, 139.36089, 'OSM node 305545683 昭島 station');

// No.13 飛鳥山：王子駅→飛鳥山公園→音無親水公園→石神井川遊歩道→北とぴあ→王子駅。
const ojiSt = P('oji', '王子駅', 35.75396, 139.73752, 'OSM node 5406714005 王子 station');
const asukayama = P('asukayama', '飛鳥山公園', 35.75009, 139.73783, 'OSM node 飛鳥山公園 park');
const otonashi = P('otonashi', '音無親水公園', 35.75267, 139.73588, 'OSM way 音無親水公園 park');
const shakujiiRiver = P('shakujii_river', '石神井川（武蔵野の路・石神井川コース）', 35.75251, 139.73191, 'OSM information 武蔵野の路 石神井川コース; 遊歩道の位置は地図レビュー待ち');
const asukayamaView = P('asukayama_view', '北とぴあ 展望ロビー', 35.75485, 139.73667, 'OSM node 北とぴあ viewpoint');
const kitatopia = P('kitatopia', '北とぴあ', 35.75471, 139.73709, 'OSM node 北とぴあ前 416334963');

const jobs = {
  'no-9': { courseId: 'No.9', slug: 'no-9', variants: { standard: [cableShitakiyo, cableSanjo, yakuoin, sancho, jaguchi, takaosanGuchiSt] } },
  'no-10': { courseId: 'No.10', slug: 'no-10', variants: {
    standard: [tenkubashi, hic, skyBridgeN, skyBridgeS, tmrYokudo, keikyuDaishibashi],
    extended: [tenkubashi, hic, okunoinTorii, hanedaT3],
  } },
  'no-12': { courseId: 'No.12', slug: 'no-12', variants: { standard: [tachikawaSt, fareTachikawa, tachikawaKita, tamagawaJosui, higashinakagami, akishimaSt] } },
  'no-13': { courseId: 'No.13', slug: 'no-13', variants: { standard: [ojiSt, asukayama, otonashi, shakujiiRiver, kitatopia, ojiSt] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
