// 組み直した <slug>-route-build.json を <slug>-adopted-build.json（curated が読む形式）へ移す。
// 既存の結果と同じ variant の並びを保ち、無くなった variant は落とす。
import { rd, wr } from './lib-rebuild.mjs';
for (const slug of process.argv.slice(2)) {
  const b = rd(`data/research/${slug}-route-build.json`);
  const stops = (v) => v.stops.map((s) => ({ id: s.id, label: s.label, coord: s.coord, source: s.source }));
  const results = Object.entries(b.variants).map(([variant, v]) => ({ variant, distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryM: v.repeatedGeometryM, repeatedGeometryPct: v.repeatedGeometryPct, geometryUrl: v.geometryUrl, waypoints: stops(v) }));
  wr(`data/research/${slug}-adopted-build.json`, { generatedAt: new Date().toISOString(), engine: b.engine, method: 'Valhalla pedestrian', results });
  console.log(slug, results.map((r) => `${r.variant} ${r.distanceM}`).join(' '));
}
