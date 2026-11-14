import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const courses = read('data/catalog.json').courses;
const audits = new Map(read('data/route-audit.json').audits.map((row) => [row.id, row]));
const historicalBranches = read('tools/branches/plan.json');
const checklist = [
  '公式の地域・施設資料を収集し、確認日を記録',
  '現地歩行記録と写真付き資料で景観道路・歩く方向を調査',
  '駅の出入口・施設の入口・横断・通行条件を照合',
  'A 5〜6 km と B 7〜8 km の自然な駅間経路を設計。適切な経路が無ければ例外理由を記録',
  'C の屋外徒歩・屋内徒歩・鉄道等を分離し、開館・料金・休館を確認',
  '徒歩ネットワークから GeoJSON を生成し、同じ道路をなぞらない一筆書きか確認。避けられない往復は理由を記録',
  '景観・安全・坂道・休憩・トイレ・離脱・アクセスを地図レビュー',
  '旧経路との差分・採用理由・未確認事項を記録',
];
const records = courses.map((course) => {
  const audit = audits.get(course.id);
  if (!audit) throw new Error(`missing audit: ${course.id}`);
  const text = `${course.title} ${course.routeText} ${course.summary}`;
  const transportHints = [
    /水上バス|船|フェリー/.test(text) ? 'water_transport' : null,
    /ケーブルカー|ロープウェイ/.test(text) ? 'cable_transport' : null,
    /地下街|地下道|屋内回遊|雨天版/.test(text) ? 'indoor_candidate' : null,
  ].filter(Boolean);
  const fillerHint = /往復約|往復で延伸|周回で延伸|距離調整|延伸のため/.test(text);
  const issues = [
    ...audit.flags,
    ...(audit.repeatedGeometryM >= 100 ? ['retraced_geometry_over_100m'] : []),
    ...(course.retraceReview ? ['user_reported_retrace'] : []),
    ...(fillerHint ? ['possible_distance_filler'] : []),
    ...(transportHints.length ? ['transport_or_indoor_leg_separation'] : []),
  ];
  const score = Math.round(audit.repeatedGeometryPct * 2 + Math.min(30, audit.maxWaypointToShapeM / 5)
    + (fillerHint ? 25 : 0) + (transportHints.length ? 20 : 0) + (audit.repeatedWaypoints.length ? 10 : 0) + (course.retraceReview ? 25 : 0));
  const existing = course.routeOptions?.filter((route) => route.variant !== 'legacy') || [];
  const coordinateReviewPath = path.join(root, 'data/research', `${course.slug}-coordinate-review.json`);
  const coordinateReview = fs.existsSync(coordinateReviewPath) ? JSON.parse(fs.readFileSync(coordinateReviewPath, 'utf8')).status : 'not_started';
  const sourceResearchPath = path.join(root, 'data/research', `${course.slug}-route-research.json`);
  const sourceResearch = fs.existsSync(sourceResearchPath) ? JSON.parse(fs.readFileSync(sourceResearchPath, 'utf8')).stage : 'not_started';
  return {
    id: course.id, title: course.title, series: course.seriesName,
    workStatus: existing.length ? 'partial_rebuild' : 'research_needed',
    legacy: {
      geometryUrl: course.route.geometryUrl,
      walkingDistanceM: course.route.distanceM,
      repeatedGeometryPct: audit.repeatedGeometryPct,
      repeatedGeometryM: audit.repeatedGeometryM,
      maxWaypointToShapeM: audit.maxWaypointToShapeM,
      repeatedWaypoints: audit.repeatedWaypoints,
      gateResult: audit.legacyGate,
    },
    existingNewVariants: existing.map((route) => ({ variant: route.variant, status: route.verificationStatus, distanceM: route.distanceM })),
    coordinateReview, sourceResearch,
    historicalRoutingStrategies: historicalBranches[course.id] ? Object.entries(historicalBranches[course.id]).map(([oldLabel, value]) => ({ oldLabel, strategyLabel: value.label, distanceKm: value.km })) : [],
    transportHints, possibleDistanceFiller: fillerHint,
    retraceReview: course.retraceReview || null,
    priorityScore: score, issues,
    checklist,
  };
}).sort((a, b) => b.priorityScore - a.priorityScore || a.id.localeCompare(b.id, 'ja'));

if (records.length !== 97 || new Set(records.map((r) => r.id)).size !== 97) throw new Error('expected 97 unique work items');
const out = { generatedAt: new Date().toISOString(), interpretation: 'Mechanical triage only. Source and map review required before adopting any new route.', records };
fs.writeFileSync(path.join(root, 'data/rebuild-worklist.json'), JSON.stringify(out, null, 2));
const counts = { partial: records.filter((r) => r.workStatus === 'partial_rebuild').length, needsResearch: records.filter((r) => r.workStatus === 'research_needed').length, retraceCandidates: records.filter((r) => r.legacy.repeatedGeometryM >= 100).length, userReportedRetraces: records.filter((r) => r.retraceReview).length, transport: records.filter((r) => r.transportHints.length).length, filler: records.filter((r) => r.possibleDistanceFiller).length };
console.log(JSON.stringify(counts));
