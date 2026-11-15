// No.11 を台帳へ：標準=勝どき駅→…→屋上緑化広場→千客万来→市場前駅(4.41km)、拡張=桜田門駅→…→市場前駅(利用者提供モデル順 6.68km)。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const ext = rd('data/research/no-11-ext-route-build.json').variants.with_okujo;
const model = rd('data/research/sakuradamon-model-route-build.json').variants.model;
const pairs = [
  { variant: 'standard', v: ext, cand: 'data/candidates/no-11-ext-with_okujo.geojson', note: '勝どき駅から晴海臨海公園、豊洲大橋、屋上緑化広場、千客万来を経て市場前駅。ピンは施設中心で入口は地図レビュー待ち。' },
  { variant: 'extended', v: model, cand: 'data/candidates/sakuradamon-model-model.geojson', note: '桜田門駅から市場前駅まで。利用者提供のモデルコースの順序のみ参考にした自前の計算。ピンは施設中心で入口は地図レビュー待ち。' },
];
const results = [];
for (const { variant, v, cand, note } of pairs) {
  const src = rd(cand);
  const geometryUrl = `data/routes/no-11-${variant}.geojson`;
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify({ type: 'Feature', id: `No.11-${variant}`, properties: { courseId: 'No.11', routeVariant: variant, verificationStatus: 'routed', reviewNote: note, engine: 'valhalla-pedestrian', calculatedAt: src.properties.calculatedAt, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM ?? v.distanceM }, geometry: src.geometry }));
  results.push({ variant, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM ?? v.distanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: Number((v.repeatedGeometryM / v.distanceM * 100).toFixed(1)), waypoints: v.stops.map((s) => ({ id: s.id, label: s.label, coord: s.coord, source: s.source })), legDistancesKm: v.legKm, geometryUrl });
}
fs.writeFileSync(path.join(root, 'data/research/no-11-adopted-build.json'), JSON.stringify({ generatedAt: new Date().toISOString(), method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results }, null, 2));
for (const r of results) console.log(r.variant, r.distanceM, r.repeatedGeometryM, r.waypoints.length);
