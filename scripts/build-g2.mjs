// 1128-G2（高輪・三田の寺町と高輪ゲートウェイシティ）を、OSM の名称付き地点だけで一筆書きに組む。
// 幽霊坂・駐日クウェート大使館・蟻鱒鳶ルは OSM に名称ノードがなく、座標を推測しないため経由点に含めない。
import { P, buildCourse } from './lib-rebuild.mjs';
const job = { courseId: '1128-G2', slug: '1128-g2', variants: { standard: [
  P('shirokane_takanawa', '白金高輪駅', 35.64295, 139.73417, 'OSM node 2179133140 station'),
  P('matsushimaya', '松島屋', 35.64055, 139.73742, 'OSM node 2345184604 confectionery'),
  P('gankaiji', '願海寺', 35.64549, 139.74004, 'OSM node 1755267526 place_of_worship'),
  P('kamezuka', '亀塚公園', 35.6436, 139.74044, 'OSM node 6126527703 亀塚公園'),
  P('mon_takanawa', 'MoN Takanawa', 35.63963, 139.74136, 'OSM node MoN（高輪ゲートウェイシティ）。入口は地図で要確認'),
  P('newoman_luftbaum', 'NEWoMan高輪 LUFTBAUM', 35.63652, 139.74031, 'OSM node NEWoMan高輪 LUFTBAUM'),
  P('takanawa_gw', '高輪ゲートウェイ駅', 35.63547, 139.74067, 'OSM way 781446220 高輪ゲートウェイ'),
  P('shibaura_futo', '芝浦ふ頭駅', 35.64173, 139.75781, 'OSM node 3349961081 station'),
] } };
await buildCourse(job);
