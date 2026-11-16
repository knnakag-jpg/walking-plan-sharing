// 個人散歩 E1/E3/Z2/Z3/Z5 の古い往復（1km超）をなくすため、実在の駅・公園・城で結び直す。
import { P, buildCourse } from './lib-rebuild.mjs';

// E1 三島：三島駅→楽寿園→三嶋大社→白滝公園→三島田町駅。
const mishimaSt = P('mishima_st', '三島駅', 35.12588, 138.91084, 'OSM station 三島');
const rakuju = P('rakuju', '楽寿園', 35.12491, 138.91099, 'OSM park 三島市立公園 楽寿園');
const mishimaTaisha = P('mishima_taisha', '三嶋大社', 35.1214, 138.91971, 'OSM museum 三嶋大社宝物館');
const shirataki = P('shirataki', '白滝公園', 35.12274, 138.91447, 'OSM node 白滝公園');
const mishimaTamachi = P('mishima_tamachi', '三島田町駅', 35.11645, 138.91785, 'OSM station 三島田町');
const komoike = P('komoike', '菰池公園', 35.12542, 138.91586, 'OSM park 菰池公園');

// E3 浜松：浜松駅→浜松城→遠鉄百貨店方面→新浜松駅。
const hamamatsuSt = P('hamamatsu_st', '浜松駅', 34.70528, 137.73356, 'OSM node 浜松駅');
const hamamatsuJo = P('hamamatsu_jo', '浜松城（浜松城公園）', 34.71207, 137.72279, 'OSM 浜松城公園前交番の近くの公園; 城の点は地図レビュー待ち');
const shinHamamatsu = P('shin_hamamatsu', '新浜松駅', 34.7035, 137.7359, 'OSM node JR浜松駅東（新浜松駅の近く）; 駅の正確な点は地図レビュー待ち');

// Z2 神戸：三宮駅→旧居留地→神戸港（中突堤）→ハーバーランド→神戸駅。
const sannomiya = P('sannomiya', '神戸三宮駅', 34.69316, 135.19286, 'OSM station 神戸三宮');
const motomachi = P('motomachi', '元町駅', 34.68957, 135.18715, 'OSM station 元町');
const chutottei = P('chutottei', '中突堤旅客ターミナル', 34.68009, 135.18854, 'OSM ferry_terminal 中突堤旅客ターミナル');
const harborland = P('harborland', '神戸ハーバーランド', 34.67851, 135.18031, 'OSM attraction 神戸ハーバーランド');
const kobeSt = P('kobe_st', '神戸駅', 34.67929, 135.17828, 'OSM station 神戸');

// Z3 福岡：博多駅→中洲川端→天神→大濠公園。
const hakataSt = P('hakata_st', '博多駅', 33.59004, 130.3998, 'OSM 博多 station; 正確な点は地図レビュー待ち');
const nakasu = P('nakasu', '中洲川端駅', 33.59473, 130.40641, 'OSM station 中洲川端');
const tenjin = P('tenjin', '天神駅', 33.59126, 130.39863, 'OSM station 天神');
const ohori = P('ohori', '大濠公園', 33.59018, 130.37722, 'OSM node 大濠公園');

// Z5 富山：富山駅→富山城址→環水公園→富山駅。
const toyamaSt = P('toyama_st', '富山駅', 36.70158, 137.21294, 'OSM tram_stop 富山駅');
const toyamaJo = P('toyama_jo', '富山城址', 36.69267, 137.21111, 'OSM information 富山城の石垣について（城址公園内）');
const kankeiPark = P('kankei_park', '環水公園', 36.708, 137.2135, 'TOPIC: 環水公園。OSMの正確な点は地図レビュー待ち');
const kenhchoMae = P('kencho_mae', '県庁前', 36.69568, 137.20974, 'OSM tram_stop 県庁前');

const jobs = {
  E1: { courseId: 'E1', slug: 'e1', variants: { standard: [mishimaSt, rakuju, shirataki, mishimaTaisha, mishimaTamachi] } },
  E3: { courseId: 'E3', slug: 'e3', variants: { standard: [hamamatsuSt, hamamatsuJo, shinHamamatsu] } },
  Z2: { courseId: 'Z2', slug: 'z2', variants: { standard: [sannomiya, motomachi, chutottei, harborland, kobeSt] } },
  Z3: { courseId: 'Z3', slug: 'z3', variants: { standard: [hakataSt, nakasu, tenjin, ohori] } },
  Z5: { courseId: 'Z5', slug: 'z5', variants: { standard: [toyamaSt, toyamaJo, kenhchoMae, kankeiPark, toyamaSt] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
