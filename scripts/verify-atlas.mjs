import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const data = JSON.parse(read('data/catalog.json'));
const worklist = JSON.parse(read('data/rebuild-worklist.json'));
const retraceReports = JSON.parse(read('data/research/retrace-reports.json'));
const retraceClusters = JSON.parse(read('data/research/retrace-clusters.json'));
const routeAudits = new Map(JSON.parse(read('data/route-audit.json')).audits.map((audit) => [audit.id, audit]));
const old = JSON.parse(read('tools/waypoints-raw.json')).flatMap((series) => series.courses);
const html = read('atlas/index.html');
const archive = read('index.html');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const same = (a, b) => fs.existsSync(path.join(root, b)) && crypto.createHash('sha256').update(read(a)).digest('hex') === crypto.createHash('sha256').update(read(b)).digest('hex');
assert(same('data/catalog.json', 'atlas/data/catalog.json'), 'published catalog differs from source');
assert(same('data/route-audit.json', 'atlas/data/route-audit.json'), 'published audit differs from source');
const legacyCourses = data.courses.filter((course) => course.seriesId !== 'personal' && !course.addedMain);
assert(legacyCourses.length === 97, 'catalog must contain all 97 legacy records (personal excluded)');
assert(new Set(data.courses.map((course) => course.id)).size === data.courses.length, 'catalog IDs must be unique');
assert(worklist.records.length === 97 && new Set(worklist.records.map((record) => record.id)).size === 97, 'rebuild worklist must contain 97 unique records');
for (const course of legacyCourses) {
  const item = worklist.records.find((record) => record.id === course.id);
  assert(Boolean(item), `missing rebuild work item ${course.id}`);
  if (!item) continue;
  assert(item.legacy.geometryUrl === course.route.geometryUrl, `${course.id}: worklist lost legacy geometry`);
  assert(item.legacy.walkingDistanceM === course.route.distanceM, `${course.id}: worklist legacy distance differs`);
  const newOptions = course.routeOptions?.filter((route) => route.variant !== 'legacy') || [];
  assert(item.workStatus === (newOptions.length ? 'partial_rebuild' : 'research_needed'), `${course.id}: worklist status differs from catalog`);
  assert(item.existingNewVariants.length === newOptions.length, `${course.id}: worklist variant count differs`);
  for (const route of newOptions) assert(item.existingNewVariants.some((entry) => entry.variant === route.variant && entry.status === route.verificationStatus && entry.distanceM === route.distanceM), `${course.id}/${route.variant}: worklist variant differs`);
  const researchFile = path.join(root, 'data/research', `${course.slug}-route-research.json`);
  const sourceResearch = fs.existsSync(researchFile) ? JSON.parse(fs.readFileSync(researchFile, 'utf8')).stage : 'not_started';
  assert(item.sourceResearch === sourceResearch, `${course.id}: source research status differs`);
  if (course.retraceReview) {
    assert(retraceReports.courseIds.includes(course.id), `${course.id}: retrace report has no source record`);
    assert(item.retraceReview?.status === course.retraceReview.status, `${course.id}: retrace worklist differs`);
    assert(course.retraceReview.repeatedGeometryM === routeAudits.get(course.id)?.repeatedGeometryM, `${course.id}: retrace metric differs from audit`);
  }
}
assert(retraceReports.courseIds.length >= 1 && new Set(retraceReports.courseIds).size === retraceReports.courseIds.length, 'reported retraces must list distinct courses');
assert(retraceClusters.cases.length === retraceReports.courseIds.length, 'retrace cluster case count differs');
for (const item of retraceClusters.cases) {
  const course = data.courses.find((entry) => entry.id === item.courseId);
  assert(retraceReports.courseIds.includes(item.courseId) && item.geometryUrl === course?.route.geometryUrl, `${item.courseId}: cluster source differs`);
  if (!course) continue;
  assert(crypto.createHash('sha256').update(read(item.geometryUrl)).digest('hex') === item.geometrySha256, `${item.courseId}: cluster report is stale`);
  assert(item.clusters.length > 0 && Math.abs(item.clusters.reduce((sum, cluster) => sum + cluster.repeatedM, 0) - item.repeatedExactM) <= item.clusters.length, `${item.courseId}: cluster summary differs`);
}
for (const course of old) assert(data.courses.some((item) => item.id === course.n), `missing ${course.n}`);
for (const id of ['view-discover', 'view-explore', 'view-compare', 'view-walk', 'map', 'course-list', 'detail-dialog', 'replay-route', 'show-route-now', 'map-status']) assert(html.includes(`id="${id}"`), `missing UI element ${id}`);
for (const course of data.courses) {
  if (course.legacyUrl !== null) assert(archive.includes(`id="${course.legacyAnchor}"`), `missing old anchor ${course.legacyAnchor}`);
  const options = course.routeOptions || [course.route];
  for (const option of options) {
    assert(option.verificationStatus !== 'field_verified', `${course.id}/${option.variant} claims unverified field work`);
    if (option.repeatedGeometryPct >= 10 && option.variant !== 'legacy' && !option.retraceException) assert(false, `${course.id}/${option.variant}: geometry repeat over 10% without a stated reason`);
    if (!option.geometryUrl) { assert(option.distanceM == null, `${course.id}/${option.variant} has distance without geometry`); continue; }
    const filename = path.join(root, option.geometryUrl);
    assert(fs.existsSync(filename), `missing ${option.geometryUrl}`);
    assert(same(option.geometryUrl, path.join('atlas', option.geometryUrl)), `published route differs: ${option.geometryUrl}`);
    if (!fs.existsSync(filename)) continue;
    const feature = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const coordinates = feature.geometry?.coordinates;
    assert(feature.type === 'Feature' && feature.geometry?.type === 'LineString' && coordinates?.length > 2, `invalid LineString ${option.geometryUrl}`);
    if (!coordinates?.length) continue;
    assert(coordinates.every(([lon, lat]) => lon > 120 && lon < 150 && lat > 20 && lat < 50), `invalid coordinate order or range ${option.geometryUrl}`);
    if (option.variant !== 'legacy' && option.waypoints?.length) {
      const distances = option.waypoints.map((waypoint) => Math.min(...coordinates.map(([lon, lat]) => Math.hypot((lon - waypoint.point[0]) * 91000, (lat - waypoint.point[1]) * 111000))));
      assert(Math.max(...distances) <= 40, `${option.geometryUrl}: waypoint more than 40m from route shape`);
    }
    const radians = (n) => n * Math.PI / 180;
    let distance = 0;
    let repeatedDistance = 0;
    const seenEdges = new Set();
    for (let i = 1; i < coordinates.length; i++) {
      const [lonA, latA] = coordinates[i - 1]; const [lonB, latB] = coordinates[i];
      const q = Math.sin(radians(latB - latA) / 2) ** 2 + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(radians(lonB - lonA) / 2) ** 2;
      const segmentM = 12742000 * Math.asin(Math.sqrt(q));
      distance += segmentM;
      const edge = [coordinates[i - 1].join(','), coordinates[i].join(',')].sort().join('|');
      if (seenEdges.has(edge)) repeatedDistance += segmentM;
      seenEdges.add(edge);
    }
    assert(Math.abs(distance - option.distanceM) < Math.max(15, option.distanceM * .01), `distance mismatch ${option.geometryUrl}`);
    if (option.geometryScreening) assert(Math.abs(repeatedDistance - option.geometryScreening.repeatedGeometryM) < 1, `screening repeat distance mismatch ${option.geometryUrl}`);
  }
}
for (const filename of fs.readdirSync(path.join(root, 'data/reviews')).filter((name) => name.endsWith('.json'))) {
  const source = JSON.parse(read(`data/reviews/${filename}`));
  const course = data.courses.find((item) => item.id === source.courseId);
  assert(source.scope === 'saved_geometry_screening' && Boolean(source.screenedAt), `${filename}: invalid screening scope or date`);
  for (const review of source.reviews) {
    const route = course?.routeOptions?.find((item) => item.id === review.routeId);
    assert(Boolean(route?.geometryScreening), `${filename}: missing catalog screening ${review.routeId}`);
    if (!route?.geometryUrl || !route.geometryScreening) continue;
    const hash = crypto.createHash('sha256').update(read(route.geometryUrl)).digest('hex');
    assert(hash === review.geometrySha256, `${filename}: route changed after screening ${review.routeId}`);
    assert(route.verificationStatus === 'routed' && review.decision === 'map_review_pending' && route.geometryScreening.decision === review.decision, `${filename}: screening promoted an unreviewed route`);
    assert(route.geometryScreening.findings.length === review.findings.length && review.findings.length > 0, `${filename}: findings differ`);
    assert(Math.abs(review.findings.reduce((sum, item) => sum + item.repeatedM, 0) - review.repeatedGeometryM) <= review.findings.length, `${filename}: repeated distance summary differs`);
    assert(review.findings.every((item) => item.point?.length === 2 && item.point[0] > 120 && item.point[0] < 150 && item.point[1] > 20 && item.point[1] < 50 && item.note), `${filename}: invalid finding`);
  }
}
const no47 = data.courses.find((course) => course.id === 'No.47');
assert(no47?.routeOptions?.length === 4, 'No.47 must include A/B/C and archived old route');
const standard = no47?.routeOptions?.find((route) => route.variant === 'standard');
const extended = no47?.routeOptions?.find((route) => route.variant === 'extended');
const rainy = no47?.routeOptions?.find((route) => route.variant === 'rainy');
assert(standard?.distanceM >= 5000 && standard?.distanceM <= 6000, 'No.47 A is outside 5-6km');
assert(extended?.distanceM >= 7000 && extended?.distanceM <= 8000, 'No.47 B is outside 7-8km');
assert(standard?.repeatedGeometryPct <= 10 && extended?.repeatedGeometryPct <= 10, 'No.47 A/B have too much exact geometry repetition');
assert(rainy?.segments?.some((leg) => leg.kind === 'walk_indoor') && rainy?.segments?.some((leg) => leg.kind === 'rail') && rainy?.distanceM == null, 'No.47 C must separate indoor/rail and leave unknown distance');
assert(standard?.waypoints?.slice(0, -1).map((point) => point.id).join('|') === extended?.waypoints?.slice(0, -2).map((point) => point.id).join('|'), 'No.47 B must share A core route');
assert(standard?.waypoints?.every((point) => point.description) && extended?.waypoints?.every((point) => point.description), 'No.47 replay checkpoints need source-backed descriptions');
for (const course of data.courses.filter((item) => item.routeOptions)) {
  // 個人散歩（category 'personal'）は本編97件のA/B/Cの型に縛らず、個人の旅行計画として別に確認する。
  const personal = course.category === 'personal';
  const a = course.routeOptions.find((item) => item.variant === 'standard');
  const b = course.routeOptions.find((item) => item.variant === 'extended');
  const c = course.routeOptions.find((item) => item.variant === 'rainy');
  if (personal) {
    assert(course.routeOptions.length >= 1, `${course.id}: personal route missing`);
    assert(course.evidence?.length >= 1 && course.openQuestions?.length, `${course.id}: personal research notes missing`);
    continue;
  }
  assert(a, `${course.id}: A option missing`);
  if (!b) {
    // Aだけの採用は、Bを作らない理由を routeReason に書いてある場合に限る。
    assert(/B（7〜8kmの延長案）|B（山麓から歩いて上がる案）|実在の座標で同じ道を使わずに延ばせる/.test(a?.routeReason || ''), `${course.id}: B missing without a stated reason`);
    assert(c?.distanceM == null && c?.segments?.some((leg) => leg.kind === 'walk_indoor') && c?.segments?.some((leg) => leg.kind === 'walk_outdoor'), `${course.id}: rainy indoor/outdoor split missing`);
    assert(course.evidence?.length >= 2 && course.openQuestions?.length, `${course.id}: research evidence or open questions missing`);
    continue;
  }
  assert(a?.distanceM >= 5000 && a?.distanceM <= 6000 || Boolean(a?.distanceException), `${course.id}: A outside target without reason`);
  assert(b?.distanceM >= 7000 && b?.distanceM <= 8000 || Boolean(b?.distanceException), `${course.id}: B outside target without reason`);
  assert(a?.repeatedGeometryPct <= 10 || Boolean(a?.retraceException), `${course.id}: geometry repeat clue over 10% needs a stated reason`);
  assert(b?.repeatedGeometryPct <= 10 || Boolean(b?.retraceException), `${course.id}: geometry repeat clue over 10% needs a stated reason`);
  assert(c?.distanceM == null && c?.segments?.some((leg) => leg.kind === 'walk_indoor') && c?.segments?.some((leg) => leg.kind === 'walk_outdoor'), `${course.id}: rainy indoor/outdoor split missing`);
  assert(course.evidence?.length >= 2 && course.openQuestions?.length, `${course.id}: research evidence or open questions missing`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Atlas verify OK: ${data.courses.length} legacy records, ${data.courses.reduce((sum, course) => sum + (course.routeOptions?.length || 1), 0)} route options, old anchors and shape distances consistent.`);
