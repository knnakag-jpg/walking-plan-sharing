// 個人散歩26件の確定：E1/E3/Z2/Z3/Z5 は今回の実在点の新案に差し替え、他は旧経路のまま(verificationStatus legacy)で
// 個人散歩の枠に入れ直す。旧経路は座標を変えず、往復の理由と未確認事項を添える。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rd, wr } from './lib-rebuild.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cat = rd('data/catalog.json');
const PERS = cat.courses.filter((c) => ['solo', 'enso', 'zenkoku'].includes(c.seriesId));
const NEW = { E1: 'e1', E3: 'e3', Z2: 'z2', Z3: 'z3', Z5: 'z5' };
const note = '旧経路のまま。立ち寄り先・入口座標・通行条件は地図で照合していない。同じ線をなぞる区間は形状の計算値で、理由は未確認。';
const result = [];
for (const course of PERS) {
  course.category = 'personal';
  course.seriesName = course.seriesId === 'solo' ? '個人散歩（修行案 S）' : course.seriesId === 'enso' ? '個人散歩（遠征検討 E）' : '個人散歩（全国 Z）';
  const fix = NEW[course.id];
  if (fix) {
    const build = rd(`data/research/${fix}-route-build.json`);
    const v = build.variants.standard;
    course.defaultVariant = 'standard';
    course.routeOptions = [
      { id: `${fix}-standard`, variant: 'standard', strategy: 'personal_one_stroke', geometryUrl: v.geometryUrl, verificationStatus: 'routed', distanceM: v.distanceM, engineDistanceM: v.engineDistanceM, repeatedGeometryPct: v.repeatedGeometryPct, routeReason: '実在の駅・公園・寺社の名称ノードだけで組み直した個人散歩の案。', retraceException: null, waypoints: v.stops.map((s, i) => ({ index: i, id: s.id, label: s.label, point: [s.coord[1], s.coord[0]], source: s.source })), engine: 'valhalla-pedestrian', built: build.calculatedAt.slice(0, 10) },
      { ...course.route, routeReason: note },
    ];
    result.push(`${course.id} new ${v.distanceM}`);
  } else {
    course.defaultVariant = 'legacy';
    course.routeOptions = [{ ...course.route, routeReason: note }];
    result.push(`${course.id} legacy ${course.route.distanceM}`);
  }
  course.personalPlan = course.personalPlan || { mode: 'station_to_station', hub: null, photo: '太陽の向きと時間帯は未計算。', transit: '鉄道＋徒歩（レンタカーなし）。', lodging: { policy: 'ビジネスホテルまたは快活CLUBのナイト12時間パック（鍵付完全個室・100V電源・CPAP可）を駅徒歩10分以内で。', hub: null, status: '未予約', luggage: 'CPAPと着替えは拠点駅のコインロッカーへ。' }, food: 'コンビニ。地域限定商品は未調査。' };
  course.openQuestions = [...new Set([...(course.openQuestions || []), '立ち寄り先の入口・通行条件を地図と現地で照合', '太陽の向きと時間帯の計算'])];
  course.evidence = [...(course.evidence || []), { type: 'community', title: 'OpenStreetMap（名称付き地点）', url: 'https://www.openstreetmap.org/', checkedAt: '2026-11-16', supports: '駅・公園・寺社の名称ノードの座標。入口ではない。' }];
}
wr('data/catalog.json', cat);
console.log(result.join(' | '));
console.log('personal', PERS.length, 'main+category', cat.courses.filter((c) => c.category !== 'personal').length);
