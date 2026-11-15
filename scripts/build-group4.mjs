// 第4グループ（No.19, No.20, No.21, No.22, No.24）の A を計算する。No.23 は既に新案がある。
import { P, buildCourse } from './lib-rebuild.mjs';

// No.19 神宮外苑：信濃町駅→絵画館→いちょう並木→国立競技場→千駄ケ谷駅。
const shinanomachi = P('shinanomachi', '信濃町駅', 35.68002, 139.72049, 'OSM station 信濃町');
const kaigakan = P('kaigakan', '明治神宮聖徳記念絵画館', 35.67877, 139.7176, 'OSM museum 明治神宮聖徳記念絵画館');
const ichoBefore = P('icho_front', '聖徳記念絵画館前通り（いちょう並木）', 35.6779, 139.71864, 'OSM memorial 聖徳記念絵画館前通り（土木遺産）');
const gaienmae = P('gaienmae', '外苑前駅', 35.6704, 139.71705, 'OSM subway_entrance 外苑前');
const kokuritsu = P('kokuritsu', '国立競技場駅', 35.6801, 139.71394, 'OSM station 国立競技場');
const sendagaya = P('sendagaya', '千駄ケ谷駅', 35.68127, 139.71136, 'OSM station 千駄ケ谷');
const aoyama1 = P('aoyama1', '青山一丁目駅', 35.67273, 139.72412, 'OSM stop 青山一丁目');

// No.20 二子玉川：二子玉川駅→兵庫島公園→二子橋→二子新地駅（多摩川を渡る駅間）。
const futakotamagawa = P('futakotamagawa', '二子玉川駅', 35.61179, 139.6268, 'OSM station 二子玉川');
const hyogojima = P('hyogojima', '兵庫島公園', 35.61179, 139.62409, 'OSM information 兵庫島公園案内図');
const tamaSuijin = P('tama_suijin', '多摩川水神', 35.61143, 139.62441, 'OSM place_of_worship 多摩川水神');
const futakobashi = P('futakobashi', '二子橋', 35.60801, 139.62323, 'OSM node 297176384 二子橋');
const futakoShinchi = P('futako_shinchi', '二子新地駅', 35.6072, 139.62245, 'OSM station 二子新地');
const futakoPark = P('futako_park', '二子玉川公園', 35.60838, 139.63167, 'OSM information 二子玉川公園 案内図');

// No.21 川越：本川越駅→大正浪漫夢通り→蔵造り→時の鐘→菓子屋横丁→喜多院→川越駅。
const honKawagoe = P('hon_kawagoe', '本川越駅', 35.91395, 139.48126, 'OSM stop 本川越');
const ichibangai = P('ichibangai', '川越一番街商店街（蔵造りの町並み）', 35.92354, 139.48293, 'OSM attraction 川越一番街商店街');
const tokinokane = P('tokinokane', '時の鐘', 35.92343, 139.48291, 'OSM node 243887217 時の鐘入口');
const kashiya = P('kashiya', '菓子屋横丁', 35.92509, 139.4808, 'OSM node 6390720633 菓子屋横丁');
const kitain = P('kitain', '喜多院', 35.9197, 139.49011, 'OSM node 243831165 喜多院入口');
const kawagoeHikawa = P('kawagoe_hikawa', '川越氷川神社', 35.92722, 139.48805, 'OSM node 7345034522 川越氷川神社');
const kawagoeSt = P('kawagoe', '川越駅', 35.90705, 139.48334, 'OSM stop 川越');
const kawagoeCastle = P('kawagoe_castle', '川越城本丸御殿', 35.9245, 139.4915, 'OSM museum 川越城本丸御殿');

// No.22 浜離宮・竹芝：汐留→浜離宮→（水上バスは徒歩経路に含めない）日の出桟橋→竹芝桟橋→旧芝離宮→浜松町駅。
const shiodome = P('shiodome', '汐留SIO-SITE', 35.66462, 139.76049, 'OSM attraction 汐留SIO-SITE');
const hamarikyu = P('hamarikyu', '旧浜離宮庭園入口（大手門口側）', 35.66346, 139.76361, 'OSM information 旧浜離宮庭園入口; 庭園内の園路は通らず、入口前を経由点にした');
const suijoBus = P('suijo_bus', '水上バス乗り場（浜離宮）', 35.6602, 139.76729, 'OSM ferry_terminal 水上バス乗り場');
const hinode = P('hinode', '日の出桟橋', 35.65137, 139.76062, 'OSM ferry_terminal 日の出桟橋');
const takeshiba = P('takeshiba', '竹芝桟橋入口', 35.65495, 139.76244, 'OSM node 31254192 竹芝桟橋入口 (道路上)');
const kyuShiba = P('kyu_shiba', '旧芝離宮恩賜庭園', 35.65498, 139.75857, 'OSM park 旧芝離宮恩賜庭園');
const hamamatsucho = P('hamamatsucho', '浜松町駅', 35.65511, 139.75704, 'OSM stop 浜松町');

// No.24 ミッドタウン：六本木駅→サントリー美術館→21_21→檜町公園→乃木神社→乃木坂駅。
const roppongi = P('roppongi', '六本木駅', 35.66331, 139.73278, 'OSM subway_entrance 六本木');
const midtownFront = P('midtown_front', '東京ミッドタウン前', 35.66432, 139.73106, 'OSM node 東京ミッドタウン前');
const suntory = P('suntory', 'サントリー美術館', 35.66643, 139.73046, 'OSM museum サントリー美術館');
const dsign = P('dsign', '21_21 DESIGN SIGHT', 35.66744, 139.7304, 'OSM museum 21_21 Design Sight');
const hinokicho = P('hinokicho', '檜町公園', 35.66683, 139.73259, 'OSM park 檜町公園');
const nogi = P('nogi', '乃木神社', 35.66859, 139.72799, 'OSM place_of_worship 乃木神社');
const nogizaka = P('nogizaka', '乃木坂駅', 35.66562, 139.7249, 'OSM subway_entrance 乃木坂駅');

const jobs = {
  'no-19': { courseId: 'No.19', slug: 'no-19', variants: { standard: [shinanomachi, kokuritsu, kaigakan, gaienmae, aoyama1] } },
  'no-20': { courseId: 'No.20', slug: 'no-20', variants: { standard: [futakotamagawa, hyogojima, futakobashi, futakoShinchi] } },
  'no-21': { courseId: 'No.21', slug: 'no-21', variants: { standard: [honKawagoe, kashiya, ichibangai, tokinokane, kitain, kawagoeHikawa, kawagoeCastle, kawagoeSt] } },
  'no-22': { courseId: 'No.22', slug: 'no-22', variants: { standard: [shiodome, hamarikyu, takeshiba, kyuShiba, hamamatsucho] } },
  'no-24': { courseId: 'No.24', slug: 'no-24', variants: { standard: [roppongi, suntory, dsign, hinokicho, nogi, nogizaka] } },
};
const only = new Set(process.argv.slice(2));
for (const [key, job] of Object.entries(jobs)) {
  if (only.size && !only.has(key)) continue;
  await buildCourse(job);
}
