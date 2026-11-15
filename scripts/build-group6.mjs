// 第6グループ（No.31, No.33, No.34, No.35, No.36）の A を計算する。No.32 は既に A/B/C がある。
// No.33〜35 の地下通路は OSM に座標がないため、地上の駅・施設を結ぶ。地下通路の座標は作らない。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.31 山手線内側の谷底：赤坂見附駅→弁慶橋→清水谷公園→喰違見附跡→四ツ谷駅。
const akasakaMitsuke = P('akasaka_mitsuke', '赤坂見附駅', 35.67839, 139.73629, 'OSM node 赤坂見附');
const benkeibashi = P('benkeibashi', '弁慶橋（弁慶橋ボート場）', 35.67897, 139.73603, 'OSM slipway 弁慶橋ボート場');
const kioicho = P('kioicho', '紀尾井町', 35.68298, 139.73821, 'OSM node 紀尾井町（バス停）');
const shimizudani = P('shimizudani', '清水谷公園', 35.6797, 139.7389, 'TOPIC: 清水谷公園。OSMの正確な点が見つからず、紀尾井町交差点と赤坂見附の間の位置。地図レビュー待ち');
const yotsuyaSt = P('yotsuya_st', '四ツ谷駅', 35.68644, 139.73005, 'OSM node 四谷駅');
const sophia = P('sophia', '上智大学', 35.6836, 139.73189, 'OSM university 上智大学');

// No.33 東京駅周辺：動輪の広場→丸ビル→新丸ビル→KITTE→国際フォーラム→日比谷。
const dorin = P('dorin', '動輪の広場', 35.68111, 139.76496, 'OSM attraction 動輪の広場（C62形蒸気機関車）');
const tokyoMarunouchi = P('tokyo_marunouchi', '東京駅 丸の内中央口', 35.68158, 139.76602, 'OSM train_station_entrance 丸の内中央口');
const kitte = P('kitte', 'KITTE', 35.67986, 139.76478, 'OSM node KITTE');
const forumWest = P('forum_west', '東京国際フォーラム西', 35.678, 139.76345, 'OSM node 東京国際フォーラム西');
const forumEast = P('forum_east', '東京国際フォーラム東', 35.67768, 139.7651, 'OSM node 東京国際フォーラム東');
const hibiya = P('hibiya', '日比谷公園', 35.67371, 139.75618, 'OSM park 日比谷公園');
const otemachi = P('otemachi', '大手町駅前', 35.68483, 139.76574, 'OSM node 大手町駅前');
const nijubashiMae = P('nijubashi_mae', '二重橋前〈丸の内〉駅', 35.68034, 139.76162, 'OSM stop 二重橋前');
const yurakucho = P('yurakucho', '有楽町駅', 35.67602, 139.76215, 'OSM stop 有楽町');

// No.34 新宿駅周辺：新宿の目→西口ロータリー→西新宿→東口。
const shinjukuEye = P('shinjuku_eye', '新宿の目', 35.69095, 139.69876, 'OSM artwork 新宿の目');
const shinjukuNishi = P('shinjuku_nishi', '新宿西口ロータリー入口', 35.69222, 139.69839, 'OSM node 新宿西口ロータリー入口');
const nishiShinjuku1 = P('nishi_shinjuku1', '西新宿一丁目', 35.68865, 139.69894, 'OSM node 西新宿一丁目');
const shinjukuEastEntrance = P('shinjuku_east', '新宿駅東口', 35.69225, 139.70177, 'OSM node 新宿駅東口');
const shinjuku3 = P('shinjuku3', '新宿三丁目', 35.69088, 139.70484, 'OSM node 新宿三丁目');
const shinjukuSouth = P('shinjuku_south', '新宿駅南口', 35.68785, 139.70121, 'OSM stop 新宿');

// No.35 池袋駅周辺：池袋駅東口→サンシャイン前→サンシャイン国際水族館→東池袋中央公園→池袋駅。
const ikebukuro = P('ikebukuro', '池袋駅', 35.72809, 139.71104, 'OSM station 池袋');
const ikebukuroEast = P('ikebukuro_east', '池袋駅東口', 35.72995, 139.71236, 'OSM node 池袋駅東口');
const sunshineMae = P('sunshine_mae', 'サンシャイン前', 35.72936, 139.7168, 'OSM node サンシャイン前');
const sunshineAquarium = P('sunshine_aquarium', 'サンシャイン国際水族館', 35.72914, 139.72027, 'OSM aquarium サンシャイン国際水族館');
const higashiIkebukuroPark = P('hi_ikebukuro_park', '東池袋中央公園', 35.73013, 139.71872, 'OSM park 東池袋中央公園');
const higashiIkebukuroSt = P('higashi_ikebukuro_st', '東池袋駅', 35.72605, 139.71898, 'OSM platform 東池袋');

// No.36 多摩川：多摩川駅→浅間神社→丸子橋→多摩川大橋→蒲田駅。
const tamagawaSt = P('tamagawa_st', '多摩川駅', 35.58964, 139.66886, 'OSM stop 多摩川');
const maruko = P('maruko', '丸子橋', 35.58583, 139.66999, 'OSM node 丸子橋');
const sengen = P('sengen', '浅間神社（多摩川浅間神社）', 35.58862, 139.6687, 'TOPIC: 多摩川浅間神社。名称ノードが見つからず多摩川駅の隣の点。地図レビュー待ち');
const shimomaruko = P('shimomaruko', '下丸子駅', 35.5714, 139.6856, 'OSM stop 下丸子');
const kamata = P('kamata', '蒲田駅', 35.5617, 139.71467, 'OSM stop 蒲田');
const nunobe = P('nunobe', '沼部駅', 35.58277, 139.67307, 'OSM station 沼部');

const jobs = {
  'no-31': { courseId: 'No.31', slug: 'no-31', variants: { standard: [akasakaMitsuke, benkeibashi, kioicho, sophia, yotsuyaSt] } },
  'no-33': { courseId: 'No.33', slug: 'no-33', variants: { standard: [dorin, tokyoMarunouchi, nijubashiMae, otemachi, kitte, forumWest, hibiya] } },
  'no-34': { courseId: 'No.34', slug: 'no-34', variants: { standard: [shinjukuSouth, shinjukuEye, shinjukuNishi, nishiShinjuku1, shinjukuEastEntrance, shinjuku3] } },
  'no-35': { courseId: 'No.35', slug: 'no-35', variants: { standard: [ikebukuro, ikebukuroEast, sunshineMae, sunshineAquarium, higashiIkebukuroPark, higashiIkebukuroSt] } },
  'no-36': { courseId: 'No.36', slug: 'no-36', variants: { standard: [tamagawaSt, maruko, nunobe, shimomaruko, kamata] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
