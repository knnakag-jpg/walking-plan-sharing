// 第3グループ（No.14, No.15, No.16, No.18）の A を計算する。No.17 は既に新案がある。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.14 大宮：大宮駅から氷川参道を北上し、氷川神社・大宮公園へ。鉄道博物館は駅（ニューシャトル）経由だが徒歩経路には含めない。
const omiyaSt = P('omiya', '大宮駅', 35.90816, 139.62408, 'OSM station 大宮');
const hikawaSando = P('hikawa_sando', '氷川参道（二の鳥居）', 35.9111, 139.63077, 'OSM node 2751272138 氷川参道二の鳥居');
const hikawaSanNoTori = P('hikawa_santorii', '氷川参道三の鳥居', 35.91505, 139.63047, 'OSM node 8110463779 氷川参道三の鳥居');
const hikawa = P('hikawa', '武蔵一宮氷川神社', 35.91654, 139.6301, 'OSM information 武蔵一宮氷川神社 境内案内図');
const omiyaKoen = P('omiya_koen', '大宮公園', 35.91898, 139.63154, 'OSM way 大宮公園 park');
const omiyaKoenEast = P('omiya_koen_east', '大宮公園東口', 35.91913, 139.63557, 'OSM node 8441235882 大宮公園東口');
const omiyaKoenSt = P('omiya_koen_st', '大宮公園駅', 35.92382, 139.63295, 'OSM station 大宮公園');
const tetsuhaku = P('tetsuhaku', '鉄道博物館駅（ニューシャトル）', 35.92052, 139.61767, 'OSM station 鉄道博物館');
const kitaOmiya = P('kita_omiya', '北大宮駅', 35.91761, 139.62481, 'OSM station 北大宮');

// No.15 天王洲：天王洲アイル駅→天王洲公園→運河沿い→天王洲橋→北品川（品川浦）→北品川駅。
const tennozu = P('tennozu', '天王洲アイル駅', 35.62274, 139.75079, 'OSM station 天王洲アイル');
const tennozuPark = P('tennozu_park', '天王洲公園', 35.61964, 139.74968, 'OSM park 天王洲公園');
const tennozuCanal = P('tennozu_canal', '天王洲運河（北端）', 35.62602, 139.75017, 'OSM node 天王洲運河');
const tennozuFure = P('tennozu_fure', '天王洲ふれあい橋', 35.62353, 139.74744, 'OSM way 天王洲ふれあい橋');
const tennozuBashi = P('tennozu_bashi', '天王洲橋', 35.62215, 139.74545, 'OSM node 天王洲橋');
const shinabaura = P('shinagawa_ura', '品川浦（北品川舟だまり）', 35.6219, 139.74143, 'OSM 品川浦（周辺）');
const kitaShinagawaSt = P('kita_shinagawa_st', '北品川駅', 35.6223, 139.73927, 'OSM way 157576289 北品川駅');
const shinbabaSt = P('shinbaba', '新馬場駅', 35.61778, 139.74124, 'OSM 新馬場駅 北口');

// No.16 横須賀：横須賀駅→ヴェルニー公園→汐入→三笠公園→記念艦三笠→どぶ板→横須賀中央駅。
const yokosukaSt = P('yokosuka', '横須賀駅', 35.28405, 139.65653, 'OSM node 9908355231 横須賀駅');
const verny = P('verny', 'ヴェルニー公園', 35.28349, 139.65821, 'OSM park ヴェルニー公園');
const shioiriPier = P('shioiri_pier', '汐入桟橋', 35.28378, 139.662, 'OSM viewpoint 汐入桟橋');
const shioiriSt = P('shioiri_st', '汐入駅', 35.28063, 139.66161, 'OSM node 3365343107 汐入駅');
const mikasaPark = P('mikasa_park', '三笠公園', 35.28551, 139.67326, 'OSM park 三笠公園');
const mikasa = P('mikasa', '記念艦みかさ', 35.28519, 139.67433, 'OSM museum 記念艦みかさ');
const dobuita = P('dobuita', 'どぶ板通り（本通り）', 35.2815, 139.6688, 'TOPIC: どぶ板通り。名称ノードが見つからず、三笠公園入口と汐入の間の道路上の点。地図レビュー待ち');
const yokosukaChuo = P('yokosuka_chuo', '横須賀中央駅', 35.27987, 139.67017, 'OSM node 3436823058 横須賀中央駅');

// No.18 小石川後楽園：茗荷谷→小石川後楽園→東京ドームシティ→水道橋→神田川沿い→御茶ノ水橋・聖橋→御茶ノ水駅。
const myogadani = P('myogadani', '茗荷谷駅', 35.71719, 139.73694, 'OSM station 茗荷谷');
const koishikawa = P('koishikawa', '小石川後楽園', 35.70536, 139.74946, 'OSM park 小石川後楽園');
const koishikawaIri = P('koishikawa_iri', '小石川後楽園入口', 35.70458, 139.74755, 'OSM node 12241405676 小石川後楽園入口');
const dome = P('dome', '東京ドームシティ', 35.70638, 139.75423, 'OSM relation 東京ドームシティ');
const suidobashi = P('suidobashi', '水道橋駅', 35.70205, 139.75374, 'OSM station 水道橋');
const hijiribashi = P('hijiribashi', '聖橋', 35.69921, 139.76557, 'OSM node 260710862 聖橋');
const ochanomizu = P('ochanomizu', '御茶ノ水駅', 35.7004, 139.76424, 'OSM node 1815436264 御茶ノ水駅');

const jobs = {
  'no-14': { courseId: 'No.14', slug: 'no-14', variants: { standard: [omiyaSt, hikawaSando, hikawaSanNoTori, hikawa, omiyaKoen, omiyaKoenEast, omiyaKoenSt] } },
  'no-15': { courseId: 'No.15', slug: 'no-15', variants: { standard: [tennozu, tennozuPark, tennozuBashi, shinabaura, kitaShinagawaSt, shinbabaSt] } },
  'no-16': { courseId: 'No.16', slug: 'no-16', variants: { standard: [yokosukaSt, verny, shioiriPier, shioiriSt, mikasaPark, mikasa, yokosukaChuo] } },
  'no-18': { courseId: 'No.18', slug: 'no-18', variants: { standard: [myogadani, koishikawaIri, koishikawa, dome, suidobashi, hijiribashi, ochanomizu] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
