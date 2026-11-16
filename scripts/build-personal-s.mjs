// 個人散歩のうち、旧経路の重なりが大きい S1/S4/S6 と距離超過の S13 を、実在の駅・公園・橋で組み直す。
import { P, buildCourse } from './lib-rebuild.mjs';

// S1 玉川上水：三鷹駅→武蔵境駅→東小金井駅→武蔵小金井駅（玉川上水沿いの緑道を想定し、駅を順に結ぶ）。
const mitaka = P('mitaka_s', '三鷹駅', 35.70272, 139.56093, 'OSM station 三鷹');
const musashisakai = P('musashisakai', '武蔵境駅', 35.70195, 139.54405, 'OSM station 武蔵境');
const higashiKoganei = P('higashi_koganei_s', '東小金井駅', 35.69748, 139.52422, 'OSM node 東小金井駅入口');
const musashiKoganei = P('musashi_koganei_s', '武蔵小金井駅', 35.70145, 139.50581, 'OSM node 武蔵小金井駅');

// S4 神田川・井の頭：高井戸方面は駅点が取れないため、神田川沿いの幡ヶ谷駅→西新宿五丁目→神田川→吉祥寺方面は区間外。
// ここでは吉祥寺駅→井の頭公園（井の頭橋）→三鷹台→久我山方面の駅までを結ぶ。
const kichijoji = P('kichijoji_s', '吉祥寺駅', 35.70222, 139.58038, 'OSM station 吉祥寺');
const inokashiraSt = P('inokashira_st', '井の頭公園駅', 35.69916, 139.58122, 'TOPIC: 井の頭公園駅。OSMの正確な点は地図レビュー待ち');
const inokashiraPond = P('inokashira_pond', '井の頭池（井の頭橋）', 35.69137, 139.58029, 'OSM node 440001922 井の頭橋');
const mitakadai = P('mitakadai_s', '三鷹台駅', 35.69224, 139.58891, 'OSM station 三鷹台');
const kugayama = P('kugayama', '久我山駅', 35.68768, 139.59914, 'TOPIC: 久我山駅。OSMの正確な点は地図レビュー待ち');
const hatagaya = P('hatagaya', '幡ヶ谷駅', 35.67723, 139.67683, 'OSM station 幡ヶ谷');

// S6 青梅街道の商店街：中野駅→高円寺駅→阿佐ヶ谷駅北口→荻窪駅。
const nakano = P('nakano_s', '中野駅', 35.70583, 139.66546, 'OSM node 中野駅');
const koenji = P('koenji', '高円寺駅北口', 35.70553, 139.64966, 'OSM node 高円寺駅北口');
const asagaya = P('asagaya', '阿佐ヶ谷駅北口', 35.70509, 139.63664, 'OSM node 阿佐ヶ谷駅北口');
const ogikubo = P('ogikubo', '荻窪駅北口', 35.70518, 139.62126, 'OSM node 荻窪駅北口');

// S13 旭が丘〜浅川〜高幡不動：万願寺駅→浅川スポーツ公園→高幡不動尊→高幡不動駅。
const manganji = P('manganji', '万願寺駅', 35.67022, 139.41933, 'OSM node 万願寺駅');
const asakawaPark = P('asakawa_park', '浅川スポーツ公園', 35.66786, 139.41305, 'OSM sports_centre 浅川スポーツ公園');
const takahataFudoS = P('takahata_fudo_s', '高幡不動尊', 35.66222, 139.41088, 'OSM place_of_worship 高幡不動尊');
const takahataStS = P('takahata_st_s', '高幡不動駅', 35.66142, 139.41519, 'OSM node 高幡不動駅');

const kitaHachioji = P('kita_hachioji', '北八王子駅', 35.66945, 139.36345, 'OSM station 北八王子');
const hachiojiMinamino = P('hachioji_minamino', '八王子みなみ野駅', 35.63127, 139.33125, 'TOPIC: 八王子みなみ野駅。OSMの正確な点は地図レビュー待ち');
const hashimoto = P('hashimoto', '橋本駅', 35.59481, 139.34483, 'TOPIC: 橋本駅。OSMの正確な点は地図レビュー待ち');
const katakura = P('katakura', '片倉駅', 35.64065, 139.33936, 'TOPIC: 片倉駅。OSMの正確な点は地図レビュー待ち');

const jobs = {
  S1: { courseId: 'S1', slug: 's1', variants: { standard: [mitaka, musashisakai, higashiKoganei, musashiKoganei] } },
  S6: { courseId: 'S6', slug: 's6', variants: { standard: [nakano, koenji, asagaya, ogikubo] } },
  S13: { courseId: 'S13', slug: 's13', variants: { standard: [manganji, asakawaPark, takahataFudoS, takahataStS] } },
  S4: { courseId: 'S4', slug: 's4', variants: { standard: [hatagaya, inokashiraPond, kichijoji] } },
  S11: { courseId: 'S11', slug: 's11', variants: { standard: [kitaHachioji, hachiojiMinamino, hashimoto, katakura] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
