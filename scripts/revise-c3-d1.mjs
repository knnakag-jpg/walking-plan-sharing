// C-3 と D-1 の見直し（2026-11-19）。周辺に足せる地点を使い切ったため、終点の駅を変えて先へ歩く。
// C-3: 来迎院で終わらず、品川歴史館・大森貝塚・鈴ヶ森を経て大森海岸駅へ（磐井神社まで足すと7.8kmで戻りも増えるため含めない）。
// D-1: 豊洲駅で終わらず、晴海を渡って月島へ抜け、月島駅で終わる（佃まで足すと7.4kmになるため含めない）。
// 追加地点はすべて Overpass で確認した OSM の名称ノード（2026-11-19）。
import { P, buildCourse, rd } from './lib-rebuild.mjs';

const which = process.argv[2];
// 元の経由点だけを読み、追加分を付け直す（何度実行しても同じ結果になるように）。
const added = new Set(['shinagawa_rekishikan', 'omori_kaizuka', 'daikyoji', 'omorikaigan', 'hashirayama', 'tsukishima_kannon', 'tsukishima_st']);
const load = (slug) => rd(`data/research/${slug}-route-build.json`).variants.standard.stops.filter((s) => !added.has(s.id))
  .map((s) => P(s.id, s.label, s.coord[0], s.coord[1], s.source));

if (!which || which === 'c3') {
  const stops = load('vbc-c3');
  stops.push(
    P('shinagawa_rekishikan', '品川区立品川歴史館', 35.59666, 139.73018, 'OSM museum 品川区立品川歴史館'),
    P('omori_kaizuka', '大森貝塚遺跡庭園', 35.59323, 139.73023, 'OSM park 大森貝塚遺跡庭園'),
    P('daikyoji', '鈴森山大経寺', 35.59217, 139.73664, 'OSM place_of_worship 鈴森山大経寺（鈴ヶ森刑場跡）'),
    P('omorikaigan', '大森海岸駅', 35.5877, 139.73539, 'OSM station 大森海岸'),
  );
  await buildCourse({ courseId: 'VBC-C3', slug: 'vbc-c3', variants: { standard: stops } });
}
if (!which || which === 'd1') {
  const stops = load('1128-d1').filter((s) => s.label !== '豊洲駅前');
  stops.push(
    P('hashirayama', '柏山稲荷神社', 35.66221, 139.78049, 'OSM place_of_worship 柏山稲荷神社'),
    P('tsukishima_kannon', '月島観音', 35.66357, 139.78117, 'OSM place_of_worship 月島観音'),
    P('tsukishima_st', '月島駅', 35.66417, 139.78448, 'OSM station 月島'),
  );
  await buildCourse({ courseId: '1128-D1', slug: '1128-d1', variants: { standard: stops } });
}
