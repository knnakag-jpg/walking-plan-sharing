// No.5 を台帳(curated)へ載せるための橋渡し：試作2案(場外/東門)を標準・拡張の形式に変換する。
// status は routed のまま（地図レビュー前）。座標・距離は試作ビルドの値をそのまま使う。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const build = JSON.parse(fs.readFileSync(path.join(root, 'data/research/no-5e-route-build.json'), 'utf8'));
const pairs = [
  { variant: 'standard', key: 'outside_from_higashifuchu', note: '場外ルート。競馬場・博物館・郷土の森の園内には入らない。入口座標は未確認。' },
  { variant: 'extended', key: 'weekday_east', note: '非開催日の東門から博物館へ寄る案。東門の出入りで同じ通路を往復する。入場条件と入口座標は未確認。' },
];
const results = [];
for (const { variant, key, note } of pairs) {
  const src = JSON.parse(fs.readFileSync(path.join(root, `data/candidates/no-5e-${key}.geojson`), 'utf8'));
  const v = build.variants[key];
  const geometryUrl = `data/routes/no-5-${variant}.geojson`;
  fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify({
    type: 'Feature', id: `No.5-${variant}`,
    properties: { courseId: 'No.5', routeVariant: variant, verificationStatus: 'routed', reviewNote: note, engine: 'valhalla-pedestrian', calculatedAt: src.properties.calculatedAt, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM },
    geometry: src.geometry,
  }));
  const seen = new Map();
  const waypoints = v.stops.map((stop) => {
    const n = (seen.get(stop.id) || 0) + 1;
    seen.set(stop.id, n);
    return n === 1 ? { id: stop.id, label: stop.label, coord: stop.coord, source: stop.source } : { id: `${stop.id}_back`, label: `${stop.label}（戻り）`, coord: stop.coord, source: stop.source };
  });
  results.push({
    variant, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryM: v.repeatedGeometryM,
    repeatedGeometryPct: Number((v.repeatedGeometryM / v.distanceM * 100).toFixed(1)),
    waypoints, legDistancesKm: v.legKm, geometryUrl,
  });
}
fs.writeFileSync(path.join(root, 'data/research/no-5-adopted-build.json'), JSON.stringify({ generatedAt: build.calculatedAt, method: 'Valhalla pedestrian; exact geometry edge repeat is only a screening clue', results }, null, 2));
for (const r of results) console.log(r.variant, r.distanceM, r.repeatedGeometryM, r.repeatedGeometryPct + '%', r.waypoints.map((w) => w.id).join('>'));
