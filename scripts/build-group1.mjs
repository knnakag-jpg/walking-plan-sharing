// 本編の組み直し（第1グループ No.1〜No.4, No.6）の A/B を計算する。
import { P, buildCourse } from './lib-rebuild.mjs';

const otemon = P('otemon', '大手門', 35.68609, 139.76026, 'OSM node city_gate 大手門');
// 三の丸尚蔵館・二の丸庭園は御苑の南東寄りに並び、天守台へ向かうと南へ戻ることになるためAからは外す（未確認事項に記録）。
const honmaru = P('honmaru', '本丸大芝生', 35.68668, 139.75563, 'OSM relation 本丸大芝生');
const tenshudai = P('tenshudai', '天守台', 35.68824, 139.75444, 'OSM node 天守台 ruins');
const kitanogibashi = P('kitanogibashi', '北桔橋門', 35.68887, 139.75404, 'OSM node 北桔橋門 city_gate');
const hirakawaSignal = P('hirakawa_signal', '平川門（交差点）', 35.69028, 139.75882, 'OSM node 243828110 traffic_signals 平川門; 御苑の平川門の外側');
const wadakura = P('wadakura', '和田倉噴水公園', 35.68339, 139.7613, 'OSM node 和田倉噴水公園 park');
const hirakawa = P('hirakawa', '平川門', 35.68964, 139.75783, 'OSM node 平川門');
const kagakukan = P('kagakukan', '科学技術館', 35.69156, 139.75308, 'OSM node 科学技術館 museum');
const budokan = P('budokan', '日本武道館', 35.69336, 139.74987, 'OSM node 日本武道館 sports_centre');
const takebashi = P('takebashi', '竹橋駅', 35.6901, 139.75875, 'OSM node 竹橋 station');

const teleport = P('teleport', '東京テレポート駅', 35.62709, 139.77808, 'OSM node 東京テレポート station');
const diversity = P('diversity', 'ダイバーシティ東京', 35.62601, 139.77627, 'OSM way ダイバーシティ東京');
const aquacity = P('aquacity', 'アクアシティお台場', 35.62682, 139.77268, 'OSM way アクアシティお台場');
const fuji = P('fuji', 'フジテレビ前（バス停）', 35.62767, 139.77494, 'OSM node 3597315993 bus_stop フジテレビ前; 建物の中心は経路から約44m離れているためバス停を経由点にした');
const rainbowPark = P('rainbow_park', 'お台場レインボー公園', 35.63311, 139.778, 'OSM node お台場レインボー公園 park');
const rainbowParkRoad = P('rainbow_park_road', 'お台場レインボー公園前（道路上）', 35.63313, 139.77731, 'OSM お台場レインボー公園の園内中心は経路から約46m離れているため、同じ公園の道路側の点を使う');
const odaibaKaihin = P('odaiba_kaihin_st', 'お台場海浜公園駅', 35.62991, 139.7788, 'OSM node お台場海浜公園 station');
const aomi = P('aomi', '青海駅', 35.62472, 139.78123, 'OSM node 青海 station');
const ariakeNorth = P('ariake_north', '有明北緑道公園', 35.63511, 139.78139, 'OSM way 有明北緑道公園 park');
const bigSight = P('bigsight', '東京ビッグサイト', 35.63026, 139.79146, 'OSM relation 東京ビッグサイト');
const kokusai = P('kokusai', '国際展示場駅', 35.63444, 139.79175, 'OSM node 国際展示場 station');

const sakuragicho = P('sakuragicho', '桜木町駅', 35.45099, 139.63102, 'OSM node 桜木町 station');
const kishamichi = P('kishamichi', '汽車道', 35.45287, 139.63618, 'OSM relation 汽車道');
const unga = P('unga', '運河パーク', 35.4532, 139.63741, 'OSM node 運河パーク park');
const akarenga = P('akarenga', '横浜赤レンガ倉庫', 35.45241, 139.64295, 'OSM relation 横浜赤レンガ倉庫');
const zounohana = P('zounohana', '象の鼻パーク', 35.45008, 139.64271, 'OSM node 象の鼻パーク garden');
const kaikou = P('kaikou', '横浜市開港記念会館', 35.44729, 139.64109, 'OSM relation 横浜市開港記念会館');
const kentai = P('kentai', '神奈川県庁', 35.44775, 139.64252, 'OSM relation 神奈川県庁 本庁舎');
const osambashiIri = P('osambashi_iri', '大さん橋入口', 35.44744, 139.64579, 'OSM node 大さん橋入口');
const yamashita = P('yamashita', '山下公園', 35.4457, 139.64987, 'OSM node 山下公園 park');
const motomachi = P('motomachi', '元町・中華街駅', 35.44212, 139.65091, 'OSM node 元町・中華街 station');


const hidaKyubo = P('hida_kyubo', '大沢1号掩体壕', 35.67661, 139.52838, 'OSM node 大沢1号掩体壕 attraction');
const hidaKyubo2 = P('hida_kyubo2', '大沢2号掩体壕', 35.67756, 139.52745, 'OSM node 大沢2号掩体壕 attraction');
const tenbodai = P('tenbodai_oka', '展望の丘', 35.67752, 139.52679, 'OSM node 展望の丘 viewpoint');
const musashinoPark = P('musashino_park', '武蔵野の森公園', 35.67112, 139.52803, 'OSM way 武蔵野の森公園 park');
const chofuTerm = P('chofu_terminal', '調布飛行場ターミナル', 35.67251, 139.52951, 'OSM relation 調布飛行場ターミナル');
const ajinomoto = P('ajinomoto', '味の素スタジアム前（交差点）', 35.66363, 139.5244, 'OSM node 9003529380 traffic_signals 味の素スタジアム前; スタジアムの中心は経路から約128m離れているため交差点を経由点にした');
const tamaSt = P('tama_st', '多磨駅', 35.6766, 139.51703, 'OSM node 多磨 station');
const tobitaSt = P('tobita_st', '飛田給駅', 35.66007, 139.52354, 'OSM node 飛田給 station');
const higashiTokorozawa = P('higashi_tokorozawa', '東所沢駅', 35.795, 139.51467, 'OSM relation 東所沢 station');
const kadokawa = P('kadokawa', '角川武蔵野ミュージアム', 35.79769, 139.50787, 'OSM node 角川武蔵野ミュージアム museum');
const jinja = P('jinja', '武蔵野坐令和神社', 35.79718, 139.50843, 'OSM node 武蔵野坐令和神社');
const sakuratown = P('sakuratown', 'ところざわサクラタウン', 35.79717, 139.5072, 'OSM way ところざわサクラタウン');
const higashigawa = P('higashigawa', '東川沿い（東所沢公園の南）', 35.79961, 139.50346, 'OSM way 154727209 東川; 川に沿う歩道の位置は地図レビュー待ち');
const tokorozawaKoen = P('tokorozawa_koen', '東所沢公園', 35.79799, 139.50946, 'OSM node 東所沢公園 park');
const kokuPark = P('koku_park', '所沢航空記念公園', 35.79581, 139.4782, 'OSM node 300458958 航空記念公園');
const kokuKinenkan = P('koku_kinenkan', '所沢航空発祥記念館', 35.79905, 139.47162, 'OSM way 160511084 所沢航空発祥記念館 museum');
const kokuParkSt = P('koku_park_st', '航空公園駅', 35.7983, 139.46568, 'OSM node 7978379439 航空公園 station');
const jobs = {
  'no-1': { courseId: 'No.1', slug: 'no-1', variants: { standard: [otemon, honmaru, tenshudai, kitanogibashi, kagakukan, budokan, hirakawaSignal, wadakura, takebashi] } },
  'no-2': { courseId: 'No.2', slug: 'no-2', variants: { standard: [teleport, diversity, aquacity, fuji, odaibaKaihin, rainbowParkRoad, aomi, ariakeNorth, bigSight, kokusai] } },
  'no-3': { courseId: 'No.3', slug: 'no-3', variants: { standard: [sakuragicho, kishamichi, unga, akarenga, zounohana, kaikou, kentai, osambashiIri, yamashita, motomachi] } },
  'no-4': { courseId: 'No.4', slug: 'no-4', variants: { standard: [tamaSt, hidaKyubo, hidaKyubo2, musashinoPark, ajinomoto] } },
  'no-6': { courseId: 'No.6', slug: 'no-6', variants: { standard: [higashiTokorozawa, tokorozawaKoen, sakuratown, kadokawa, jinja, higashigawa, kokuPark, kokuKinenkan, kokuParkSt] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
