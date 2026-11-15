import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const raw = JSON.parse(read('tools/waypoints-raw.json'));
const geometry = JSON.parse(read('tools/route-geom.json'));
const targets = JSON.parse(read('tools/targets.json'));
const elevation = JSON.parse(read('tools/elevation-out.json')).courses;
const oldHtml = read('index.html');
const report = read('tools/route-report.md');
const outputRoot = path.join(root, 'data');
const routeRoot = path.join(outputRoot, 'routes');
fs.mkdirSync(routeRoot, { recursive: true });

const rad = (value) => value * Math.PI / 180;
function meters(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLon = rad(b[1] - a[1]);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(q));
}
function lengthM(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += meters(points[i - 1], points[i]);
  return total;
}
function repeatedGeometryM(points) {
  // Exact geometry-edge matches only. This is a review clue, not an OSM road-edge overlap score.
  const edges = new Map();
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1].map((n) => n.toFixed(5)).join(',');
    const b = points[i].map((n) => n.toFixed(5)).join(',');
    if (a === b) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const previous = edges.get(key) || { count: 0, meters: meters(points[i - 1], points[i]) };
    previous.count++;
    edges.set(key, previous);
  }
  return [...edges.values()].reduce((sum, edge) => sum + Math.max(0, edge.count - 1) * edge.meters, 0);
}
function pointDistanceToShapeM(point, shape) {
  const latScale = 111320;
  const lonScale = 111320 * Math.cos(rad(point[0]));
  let best = Infinity;
  for (let i = 1; i < shape.length; i++) {
    const ax = (shape[i - 1][1] - point[1]) * lonScale;
    const ay = (shape[i - 1][0] - point[0]) * latScale;
    const bx = (shape[i][1] - point[1]) * lonScale;
    const by = (shape[i][0] - point[0]) * latScale;
    const dx = bx - ax;
    const dy = by - ay;
    const fraction = dx * dx + dy * dy > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0;
    best = Math.min(best, Math.hypot(ax + fraction * dx, ay + fraction * dy));
  }
  return best;
}
const decoded = (value) => value
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/\s+/g, ' ').trim();
const legacyCard = new Map();
const headings = [...oldHtml.matchAll(/<h3\s+id="course-([^"]+)"[^>]*>/g)];
for (let i = 0; i < headings.length; i++) {
  const current = headings[i];
  const next = headings[i + 1];
  const block = oldHtml.slice(current.index, Math.min(next?.index ?? oldHtml.length, current.index + 12000));
  const concept = block.match(/<p>\s*<b>コンセプト[：:]<\/b>([\s\S]*?)<\/p>/i);
  const routeText = block.match(/<div class="route[^"<>]*"[^>]*>([\s\S]*?)<\/div>/i);
  const tags = [...block.slice(0, 2500).matchAll(/<span\s+class="tag"[^>]*>([\s\S]*?)<\/span>/gi)]
    .map((match) => decoded(match[1])).filter(Boolean).slice(0, 7);
  legacyCard.set(current[1], {
    summary: concept ? decoded(concept[1]) : '',
    routeText: routeText ? decoded(routeText[1]) : '',
    tags,
  });
}
const reportRows = new Map();
for (const line of report.split(/\r?\n/)) {
  if (!line.startsWith('| ')) continue;
  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  if (cells.length >= 9 && cells[0] !== 'No.' && cells[0] !== '---') reportRows.set(cells[0], { result: cells[2], soft: cells[8] });
}

const courses = [];
const audits = [];
const ids = new Set();
for (const series of raw) for (const course of series.courses) {
  if (ids.has(course.n)) throw new Error(`duplicate legacy ID: ${course.n}`);
  ids.add(course.n);
  const route = geometry[course.n];
  if (!route?.shape) throw new Error(`missing routed geometry: ${course.n}`);
  const points = decodePolyline(route.shape, 6);
  if (points.length < 2 || points.some((p) => !Number.isFinite(p[0]) || !Number.isFinite(p[1]))) throw new Error(`invalid shape: ${course.n}`);
  const geometryM = lengthM(points);
  const repeatM = repeatedGeometryM(points);
  const snappedDistances = course.r.map((p) => pointDistanceToShapeM(p, points));
  const repeatedWaypoints = [];
  for (let i = 0; i < course.r.length; i++) for (let j = i + 2; j < course.r.length; j++) {
    if (meters(course.r[i], course.r[j]) < 5) repeatedWaypoints.push([i, j]);
  }
  const slug = course.n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const anchor = course.n.startsWith('No.') ? course.n.slice(3) : course.n;
  const card = legacyCard.get(anchor) || { summary: '', routeText: '', tags: [] };
  const flags = [];
  const engineGapPct = Math.abs(geometryM / 1000 - route.km) / route.km * 100;
  if (engineGapPct > 5) flags.push('geometry_distance_gap');
  if (repeatM / geometryM > 0.1) flags.push('repeated_geometry_over_10pct');
  if (repeatedWaypoints.length) flags.push('repeated_waypoint');
  if (Math.max(...snappedDistances) > 40) flags.push('waypoint_off_shape');
  if (!card.routeText) flags.push('legacy_route_text_missing');
  const feature = {
    type: 'Feature',
    id: course.n,
    properties: {
      courseId: course.n,
      source: 'legacy-precomputed',
      engine: route.engine,
      built: route.built,
      verificationStatus: 'routed',
      geometryDistanceM: Math.round(geometryM),
      engineDistanceM: Math.round(route.km * 1000),
    },
    geometry: { type: 'LineString', coordinates: points.map(([lat, lon]) => [lon, lat]) },
  };
  fs.writeFileSync(path.join(routeRoot, `${slug}.geojson`), JSON.stringify(feature));
  courses.push({
    id: course.n, slug, title: course.name, seriesId: series.id, seriesName: series.name,
    legacyAnchor: `course-${anchor}`, legacyUrl: `../index.html#course-${anchor}`,
    summary: card.summary || card.routeText || course.name,
    routeText: card.routeText, tags: card.tags,
    route: {
      id: `${slug}-legacy`, variant: 'legacy', strategy: 'legacy_unknown',
      geometryUrl: `data/routes/${slug}.geojson`, verificationStatus: 'routed',
      distanceM: Math.round(geometryM), engineDistanceM: Math.round(route.km * 1000),
      targetDistanceM: Math.round(Number(targets[course.n] || 0) * 1000),
      repeatedGeometryPct: Number((repeatM / geometryM * 100).toFixed(1)),
      maxWaypointToShapeM: Math.round(Math.max(...snappedDistances)),
      built: route.built, engine: route.engine,
    },
    waypoints: course.r.map(([lat, lon], index) => ({ index, point: [lon, lat] })),
    climbM: elevation[course.n]?.climb_m ?? null,
    descentM: elevation[course.n]?.descent_m ?? null,
    auditFlags: flags,
  });
  audits.push({
    id: course.n, title: course.name, geometryDistanceM: Math.round(geometryM),
    engineDistanceM: Math.round(route.km * 1000), targetDistanceM: Math.round(Number(targets[course.n] || 0) * 1000),
    engineGapPct: Number(engineGapPct.toFixed(2)), repeatedGeometryM: Math.round(repeatM),
    repeatedGeometryPct: Number((repeatM / geometryM * 100).toFixed(1)),
    maxWaypointToShapeM: Math.round(Math.max(...snappedDistances)),
    repeatedWaypoints, legacyGate: reportRows.get(course.n)?.result ?? 'unknown',
    legacyWarnings: reportRows.get(course.n)?.soft ?? '', flags,
  });
}
const legacyCourses = courses.filter((c) => c.seriesId !== 'personal');
if (legacyCourses.length !== 97 || Object.keys(geometry).length !== 97 || legacyCard.size !== 97) {
  throw new Error(`count mismatch: cards=${legacyCard.size} courses=${courses.length} shapes=${Object.keys(geometry).length}`);
}
// 個人散歩 (seriesId 'personal') は本編97件とは別枠。旧カード/SERIES/形状の97件照合から外す。
// 先行ページの個人系26件(solo/enso/zenkoku)は本編97件の中に残したまま、区分(category)だけ個人散歩にする。
const PERSONAL_LEGACY = new Set(['solo', 'enso', 'zenkoku']);
for (const course of courses) course.category = PERSONAL_LEGACY.has(course.seriesId) ? 'personal' : 'main';
// 新案は data/personal/<id>.json から。先行ページには載せず、アトラス専用（本編97件の照合には入れない）。
const personalRoot = path.join(root, 'data/personal');
if (fs.existsSync(personalRoot)) for (const filename of fs.readdirSync(personalRoot).filter((name) => name.endsWith('.json')).sort()) {
  const spec = JSON.parse(fs.readFileSync(path.join(personalRoot, filename), 'utf8'));
  const pct = Number((spec.repeatedGeometryM / spec.distanceM * 100).toFixed(1));
  courses.push({
    id: spec.id, slug: spec.slug, title: spec.title, seriesId: 'personal', seriesName: '個人散歩（新案）', category: 'personal',
    legacyAnchor: `personal-${spec.slug}`, legacyUrl: null, summary: spec.summary,
    routeText: '経路ノード： ' + spec.stops.map((s) => s.label).join(' → '), routeTextSource: 'osm_named_points', tags: spec.tags,
    route: { id: `${spec.slug}-personal`, variant: 'personal', strategy: 'personal_one_stroke', geometryUrl: spec.geometryUrl, verificationStatus: 'routed', distanceM: spec.distanceM, engineDistanceM: spec.engineDistanceM, targetDistanceM: spec.targetM ?? null, repeatedGeometryPct: pct, maxWaypointToShapeM: Math.max(...spec.stops.map((s) => s.offsetM)), built: spec.calculatedAt.slice(0, 10), engine: 'valhalla-pedestrian', routeReason: spec.summary, retraceException: spec.retraceException ?? null, distanceException: spec.distanceException ?? null },
    waypoints: spec.stops.map((s, index) => ({ index, id: s.id, label: s.label, point: [s.coord[1], s.coord[0]], source: s.source })),
    personalPlan: spec.plan, climbM: null, descentM: null, auditFlags: [],
  });
}
const curatedRoot = path.join(root, 'data/curated');
for (const filename of fs.readdirSync(curatedRoot).filter((name) => name.endsWith('.json'))) {
  const curated = JSON.parse(fs.readFileSync(path.join(curatedRoot, filename), 'utf8'));
  const buildPath = path.join(root, curated.buildFile);
  if (!fs.existsSync(buildPath)) throw new Error(`${curated.id}: missing route build ${curated.buildFile}`);
  const builds = JSON.parse(fs.readFileSync(buildPath, 'utf8')).results;
  const target = courses.find((item) => item.id === curated.id);
  if (!target || !builds.some((item) => item.variant === 'standard') || !builds.some((item) => item.variant === 'extended')) throw new Error(`${curated.id}: curated route is incomplete`);
  target.title = curated.title;
  target.summary = curated.summary;
  target.tags = curated.themes;
  target.defaultVariant = 'standard';
  target.evidence = curated.evidence;
  target.scenicSegments = curated.scenicSegments;
  target.openQuestions = curated.openQuestions;
  target.routeOptions = [
    ...['standard', 'extended'].map((variant) => {
      const result = builds.find((item) => item.variant === variant);
      return {
        id: `${target.slug}-${variant}`, variant, strategy: 'scenic',
        geometryUrl: result.geometryUrl, verificationStatus: 'routed',
        distanceM: result.distanceM, engineDistanceM: result.engineDistanceM,
        repeatedGeometryPct: result.repeatedGeometryPct,
        routeReason: curated.routeReasons[variant],
        distanceException: curated.distanceExceptions?.[variant] || null,
        retraceException: curated.retraceExceptions?.[variant] || null,
        waypoints: result.waypoints.map((waypoint, index) => ({ index, id: waypoint.id, label: waypoint.label, description: curated.checkpointDescriptions?.[waypoint.id] || null, point: [waypoint.coord[1], waypoint.coord[0]], source: waypoint.source })),
        engine: 'valhalla-pedestrian', built: JSON.parse(fs.readFileSync(path.join(root, result.geometryUrl), 'utf8')).properties.calculatedAt,
      };
    }),
    { id: `${target.slug}-rainy`, variant: 'rainy', strategy: 'indoor_rail', verificationStatus: curated.rainy.verificationStatus, distanceM: null, routeReason: curated.rainy.summary, segments: curated.rainy.segments, conditions: curated.rainy.conditions, geometryUrl: null, waypoints: [] },
    { ...target.route, waypoints: target.waypoints },
  ];
}
const reviewRoot = path.join(root, 'data/reviews');
for (const filename of fs.readdirSync(reviewRoot).filter((name) => name.endsWith('.json'))) {
  const screening = JSON.parse(fs.readFileSync(path.join(reviewRoot, filename), 'utf8'));
  const course = courses.find((item) => item.id === screening.courseId);
  if (!course?.routeOptions || screening.scope !== 'saved_geometry_screening') throw new Error(`${filename}: invalid screening target or scope`);
  for (const review of screening.reviews) {
    const option = course.routeOptions.find((item) => item.id === review.routeId);
    if (!option?.geometryUrl || option.verificationStatus !== 'routed' || review.decision !== 'map_review_pending') throw new Error(`${filename}: invalid review state ${review.routeId}`);
    const hash = crypto.createHash('sha256').update(read(option.geometryUrl)).digest('hex');
    if (hash !== review.geometrySha256) throw new Error(`${filename}: geometry changed since screening ${review.routeId}`);
    option.geometryScreening = {
      scope: screening.scope, screenedAt: screening.screenedAt, method: screening.method,
      decision: review.decision, repeatedGeometryM: review.repeatedGeometryM,
      findings: review.findings, openChecks: review.openChecks,
    };
  }
}
for (const course of courses) {
  const researchPath = path.join(root, 'data/research', `${course.slug}-route-research.json`);
  if (!fs.existsSync(researchPath)) continue;
  const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  if (research.publicWarning) {
    course.publicWarning = research.publicWarning;
    if (!course.evidence) course.evidence = research.evidence || [];
    if (!course.openQuestions) course.openQuestions = research.openQuestions || [];
  }
}
const retraceReports = JSON.parse(read('data/research/retrace-reports.json'));
for (const id of retraceReports.courseIds) {
  const course = courses.find((item) => item.id === id);
  const audit = audits.find((item) => item.id === id);
  if (!course || !audit || audit.repeatedGeometryM <= 0) throw new Error(`invalid reported retrace: ${id}`);
  course.retraceReview = {
    reportedAt: retraceReports.reportedAt, source: retraceReports.source,
    status: retraceReports.status, repeatedGeometryM: audit.repeatedGeometryM,
    repeatedGeometryPct: audit.repeatedGeometryPct,
    note: retraceReports.note,
  };
}
const routeElevation = JSON.parse(read('data/research/route-elevation.json')).routes;
for (const course of courses) {
  for (const route of course.routeOptions || [course.route]) {
    if (!route.geometryUrl) continue;
    const slug = route.geometryUrl.split('/').pop().replace(/\.geojson$/, '');
    const profile = routeElevation[slug];
    if (!profile?.gradients?.length) throw new Error(`${slug}: missing DEM gradient data (run scripts/build-route-elevation.mjs)`);
    // The 10m grade series is large, so the catalog only keeps a summary and a URL;
    // scripts/package-atlas.mjs writes the series to atlas/data/elevation/<slug>.json.
    route.elevation = {
      source: 'gsi_dem5a', status: profile.status, url: `data/elevation/${slug}.json`, totalM: profile.totalM,
      climbM: profile.climbM, descentM: profile.descentM, minM: profile.minM, maxM: profile.maxM,
    };
  }
}
fs.writeFileSync(path.join(outputRoot, 'catalog.json'), JSON.stringify({
  schemaVersion: 1, source: 'legacy import; route quality not re-reviewed',
  generatedAt: new Date().toISOString(), courses,
}, null, 2));
fs.writeFileSync(path.join(outputRoot, 'route-audit.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), method: 'decoded legacy shape; exact rounded geometry edge matches, not OSM road edges', audits,
}, null, 2));
console.log(`Imported ${courses.length} legacy routes; ${audits.filter((a) => a.flags.length).length} have automated review flags.`);
