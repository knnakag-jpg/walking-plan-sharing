// 第9グループ（No.49〜No.54）の A を計算する。駅・公園・寺社・橋は OSM の名称付き点のみ。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.49 吉祥寺〜三鷹：吉祥寺駅→井の頭橋（井の頭恩賜公園）→三鷹台→三鷹駅。
const kichijoji = P('kichijoji', '吉祥寺駅', 35.70222, 139.58038, 'OSM station 吉祥寺');
const inokashira = P('inokashira', '井の頭橋（井の頭恩賜公園）', 35.69137, 139.58029, 'OSM node 440001922 井の頭橋');
const mitakadai = P('mitakadai', '三鷹台駅', 35.69224, 139.58891, 'OSM station 三鷹台');
const mitaka = P('mitaka', '三鷹駅', 35.70272, 139.56093, 'OSM station 三鷹');
const hachimanmae = P('hachimanmae', '三鷹市八幡前', 35.69306, 139.55938, 'OSM node 三鷹市八幡前');

// No.50 谷根千：上野広小路駅付近→湯島→根津→千駄木→谷中→日暮里駅。
const ueno = P('ueno_hirokoji', '上野広小路付近', 35.70729, 139.76757, 'OSM node 上野広小路付近（湯島方面への起点）');
const yushima = P('yushima', '湯島天神', 35.70798, 139.7733, 'TOPIC: 湯島天神。OSMの正確な点は地図レビュー待ち');
const nezu = P('nezu', '根津神社', 35.72041, 139.7604, 'TOPIC: 根津神社。OSMの正確な点は地図レビュー待ち');
const yanaka = P('yanaka', '谷中（谷中銀座付近）', 35.72838, 139.77098, 'TOPIC: 谷中銀座。OSMの正確な点は地図レビュー待ち');
const nippori = P('nippori', '日暮里駅', 35.72815, 139.77066, 'OSM station 日暮里');

// No.51 中目黒〜代官山〜恵比寿：中目黒駅→目黒川船入場→代官山→恵比寿駅。
const nakameguro = P('nakameguro', '中目黒駅', 35.64414, 139.69883, 'OSM station 中目黒');
const funeire = P('funeire', '目黒川船入場', 35.6418, 139.70193, 'OSM park 目黒川船入場');
const daikanyama = P('daikanyama', '代官山 T-SITE', 35.64933, 139.69982, 'OSM way 代官山 T-SITE');
const ebisuGP = P('ebisu_gp', '恵比寿ガーデンプレイス', 35.64202, 139.71357, 'OSM way 恵比寿ガーデンプレイス');
const ebisuSt = P('ebisu_st', '恵比寿駅', 35.64697, 139.70865, 'OSM station 恵比寿');

// No.52 神楽坂：飯田橋駅→神楽坂（兵庫横丁）→赤城神社→早稲田方面。
const iidabashi = P('iidabashi', '飯田橋駅', 35.70146, 139.74369, 'OSM station 飯田橋');
const kagurazaka = P('kagurazaka', '神楽坂（坂下）', 35.70253, 139.73833, 'OSM 神楽坂の坂下付近の点');
const akagi = P('akagi', '赤城神社', 35.70389, 139.73423, 'TOPIC: 赤城神社。OSMの正確な点は地図レビュー待ち');
const edogawabashi = P('edogawabashi', '江戸川橋', 35.70957, 139.7336, 'OSM stop 江戸川橋');

// No.53 京王百草園：百草園駅→京王百草園→高幡不動駅。
const mogusaenSt = P('mogusaen_st', '百草園駅', 35.65713, 139.43086, 'OSM node 百草園駅前');
const mogusaenGarden = P('mogusaen', '京王百草園', 35.65166, 139.42117, 'TOPIC: 京王百草園。OSMの正確な点は地図レビュー待ち');
const takahataSt = P('takahata_st2', '高幡不動駅', 35.66128, 139.41515, 'OSM station 高幡不動');
const takahataFudo = P('takahata_fudo2', '高幡不動尊', 35.66222, 139.41088, 'OSM place_of_worship 高幡不動尊');

// No.54 大宮公園桜：大宮駅→氷川参道→氷川神社→大宮公園→大宮第二公園→大宮公園駅。
const omiya = P('omiya2', '大宮駅', 35.90784, 139.62232, 'OSM station 大宮');
const hikawaIri = P('hikawa_iri', '氷川神社入口', 35.91043, 139.63067, 'OSM node 氷川神社入口');
const hikawaMain = P('hikawa_main', '武蔵一宮氷川神社', 35.91654, 139.6301, 'OSM information 武蔵一宮氷川神社 境内案内図');
const omiyaKoen = P('omiya_koen2', '大宮公園', 35.91898, 139.63154, 'OSM way 大宮公園 park');
const omiyaDai2 = P('omiya_dai2', '大宮第二公園', 35.91856, 139.6409, 'OSM park 大宮第二公園');
const omiyaKoenSt = P('omiya_koen_st2', '大宮公園駅', 35.92382, 139.63295, 'OSM station 大宮公園');

const jobs = {
  'no-49': { courseId: 'No.49', slug: 'no-49', variants: { standard: [kichijoji, inokashira, mitakadai, hachimanmae, mitaka] } },
  'no-50': { courseId: 'No.50', slug: 'no-50', variants: { standard: [ueno, yushima, nezu, yanaka, nippori] } },
  'no-51': { courseId: 'No.51', slug: 'no-51', variants: { standard: [nakameguro, funeire, daikanyama, ebisuGP, ebisuSt] } },
  'no-52': { courseId: 'No.52', slug: 'no-52', variants: { standard: [iidabashi, kagurazaka, akagi, edogawabashi] } },
  'no-53': { courseId: 'No.53', slug: 'no-53', variants: { standard: [mogusaenSt, mogusaenGarden, takahataFudo, takahataSt] } },
  'no-54': { courseId: 'No.54', slug: 'no-54', variants: { standard: [omiya, hikawaIri, hikawaMain, omiyaKoen, omiyaDai2, omiyaKoenSt] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
