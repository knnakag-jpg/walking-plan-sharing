const radians = (value) => value * Math.PI / 180;

function segmentMeters(a, b) {
  const dLat = radians(b[1] - a[1]); const dLon = radians(b[0] - a[0]);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(q));
}

export function routeDistances(coordinates) {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) cumulative.push(cumulative[i - 1] + segmentMeters(coordinates[i - 1], coordinates[i]));
  return cumulative;
}

function nearestRoutePoint(point, coordinates, cumulative, afterM) {
  const latScale = 111320; const lonScale = latScale * Math.cos(radians(point[1]));
  let best = null;
  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i - 1]; const b = coordinates[i];
    const ax = (a[0] - point[0]) * lonScale; const ay = (a[1] - point[1]) * latScale;
    const dx = (b[0] - a[0]) * lonScale; const dy = (b[1] - a[1]) * latScale;
    const fraction = dx * dx + dy * dy ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (dx * dx + dy * dy))) : 0;
    const atM = cumulative[i - 1] + fraction * (cumulative[i] - cumulative[i - 1]);
    if (atM < afterM) continue;
    const offsetM = Math.hypot(ax + fraction * dx, ay + fraction * dy);
    if (!best || offsetM < best.offsetM) best = { atM, offsetM, point: [a[0] + fraction * (b[0] - a[0]), a[1] + fraction * (b[1] - a[1])] };
  }
  return best;
}

export function playbackStops(waypoints, coordinates, cumulative) {
  let afterM = 0;
  return waypoints.flatMap((waypoint, index) => {
    const found = nearestRoutePoint(waypoint.point, coordinates, cumulative, afterM);
    if (!found || found.offsetM > 40) return [];
    afterM = found.atM + 5;
    return [{ ...found, curated: Boolean(waypoint.description), label: waypoint.label || `旧資料の経由点 ${index + 1}`, description: waypoint.description || (waypoint.label ? 'この地点付近を通る計算経路です。施設の入口と通行条件は未確認です。' : '旧資料の経由点です。地点名と施設入口は再調査中です。') }];
  });
}

// Eased growth of the drawn line. Ease-out cubic reads as "the road arrives",
// so it starts quickly and settles rather than crawling at the end.
export function revealProgress(elapsedMs, durationMs) {
  if (!(durationMs > 0)) return 1;
  const t = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return 1 - (1 - t) ** 3;
}

// Draw-on duration for a course's first appearance: 1000–1500ms, independent of
// length so a 9km course does not crawl. Longer routes sit at the slow end.
export function drawOnDurationMs(totalM) {
  const t = Number.isFinite(totalM) ? Math.max(0, Math.min(1, (totalM - 1000) / 9000)) : 0.5;
  return Math.round(1000 + 500 * t);
}

// ---- Terrain colouring: uphill fades to red, downhill fades to blue ----
// scripts/build-route-elevation.mjs stores one signed grade (%, + = uphill) per 10m
// part of each drawn line, measured on GSI DEM5A. Colour is a continuous fade from the
// base colour: nothing below 2%, full red/blue at 9% (the repo's tools treat 3% as
// up/down and 8% as steep). If the part count does not match the drawn line, the
// caller keeps the single base colour rather than guess.
export const TERRAIN_COLORS = { up: '#d0452f', down: '#2f6fb0', flat: '#315f50' };
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));
export function mixHex(a, b, t) {
  const [ar, ag, ab] = hexToRgb(a); const [br, bg, bb] = hexToRgb(b);
  const k = Math.max(0, Math.min(1, t));
  return `#${[ar + (br - ar) * k, ag + (bg - ag) * k, ab + (bb - ab) * k].map((v) => clamp255(v).toString(16).padStart(2, '0')).join('')}`;
}
export const GRADE_FADE_START = 2; export const GRADE_FADE_FULL = 9;
export function gradeIntensity(gradePercent) {
  return Math.max(0, Math.min(1, (Math.abs(gradePercent) - GRADE_FADE_START) / (GRADE_FADE_FULL - GRADE_FADE_START)));
}
export function gradeColor(gradePercent, base = TERRAIN_COLORS.flat) {
  const t = gradeIntensity(gradePercent);
  return mixHex(base, gradePercent >= 0 ? TERRAIN_COLORS.up : TERRAIN_COLORS.down, t);
}

// Per-part colours for a line cut at `samples` (see sampleAlong). Returns [] unless the
// grades line up one-to-one with the parts.
export function terrainParts(samples, grades, base = TERRAIN_COLORS.flat) {
  if (!grades.length || grades.length + 1 !== samples.length) return [];
  return grades.map((grade, i) => ({ from: samples[i], to: samples[i + 1], grade, color: gradeColor(grade, base) }));
}

// Elevation-following geometry needs the same sampling as the DEM build.
export function sampleAlong(coordinates, cumulative, intervalM) {
  const totalM = cumulative.at(-1);
  const out = [];
  let i = 1;
  for (let atM = 0; atM <= totalM; atM += intervalM) {
    while (i < cumulative.length - 1 && cumulative[i] < atM) i++;
    const a = coordinates[i - 1]; const b = coordinates[i];
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = Math.max(0, Math.min(1, (atM - cumulative[i - 1]) / span));
    out.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), Math.round(atM)]);
  }
  if (out.at(-1)[2] !== Math.round(totalM)) out.push([coordinates.at(-1)[0], coordinates.at(-1)[1], Math.round(totalM)]);
  return out;
}

export function partialRoute(coordinates, cumulative, atM) {
  const line = [[coordinates[0][1], coordinates[0][0]]];
  for (let i = 1; i < coordinates.length; i++) {
    if (cumulative[i] <= atM) { line.push([coordinates[i][1], coordinates[i][0]]); continue; }
    const fraction = (atM - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1]);
    line.push([coordinates[i - 1][1] + fraction * (coordinates[i][1] - coordinates[i - 1][1]), coordinates[i - 1][0] + fraction * (coordinates[i][0] - coordinates[i - 1][0])]);
    break;
  }
  return line;
}

// Merge neighbouring 10m parts that share a (quantised) colour so a route is a few
// dozen polylines, not thousands. Runs are contiguous and cover 0..total exactly.
export function terrainRuns(samples, grades, base = TERRAIN_COLORS.flat, steps = 6) {
  if (!grades.length || grades.length + 1 !== samples.length) return [];
  const runs = [];
  grades.forEach((grade, i) => {
    const strength = Math.round(gradeIntensity(grade) * steps) / steps;
    const level = grade >= 0 ? strength : -strength;
    const color = mixHex(base, grade >= 0 ? TERRAIN_COLORS.up : TERRAIN_COLORS.down, strength);
    const fromM = samples[i][2]; const toM = samples[i + 1][2];
    const last = runs.at(-1);
    if (last && last.level === level) last.toM = toM; else runs.push({ fromM, toM, color, level });
  });
  return runs;
}

// The part of the line between two distances, as [[lat, lon], ...] with interpolated ends.
export function sliceRoute(coordinates, cumulative, fromM, toM) {
  if (!(toM > fromM)) return [];
  const point = (atM, i) => {
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = Math.max(0, Math.min(1, (atM - cumulative[i - 1]) / span));
    return [coordinates[i - 1][1] + f * (coordinates[i][1] - coordinates[i - 1][1]), coordinates[i - 1][0] + f * (coordinates[i][0] - coordinates[i - 1][0])];
  };
  let i = 1;
  while (i < cumulative.length - 1 && cumulative[i] <= fromM) i++;
  const out = [point(fromM, i)];
  for (; i < cumulative.length; i++) {
    if (cumulative[i] >= toM) { out.push(point(toM, i)); break; }
    out.push([coordinates[i][1], coordinates[i][0]]);
  }
  return out;
}

// ---- Callout layout: every checkpoint's balloon at once, never on the line ----
// All geometry here is in map-container pixels. `route` is the drawn line projected to
// pixels, `stops` are anchors with measured balloon sizes, `viewport` the visible map,
// and `blocked` rectangles that must stay clear (zoom control, attribution, legend).
// Returns { ok: true, placed } only if EVERY balloon fits clear of the line, of each
// other and of the blocked areas; otherwise { ok: false } and the caller shows none.
// That all-or-nothing rule is deliberate: a half set of balloons would read as a
// complete tour and hide that some checkpoints have no room.
const rectsOverlap = (a, b, pad = 0) => a.left < b.left + b.width + pad && a.left + a.width + pad > b.left && a.top < b.top + b.height + pad && a.top + a.height + pad > b.top;
export function segmentHitsRect(p, q, rect, pad = 0) {
  const left = rect.left - pad; const right = rect.left + rect.width + pad; const top = rect.top - pad; const bottom = rect.top + rect.height + pad;
  let t0 = 0; let t1 = 1; const dx = q[0] - p[0]; const dy = q[1] - p[1];
  for (const [pk, qk] of [[-dx, p[0] - left], [dx, right - p[0]], [-dy, p[1] - top], [dy, bottom - p[1]]]) {
    if (pk === 0) { if (qk < 0) return false; continue; }
    const r = qk / pk;
    if (pk < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
  }
  return true;
}
export function routeHitsRect(route, rect, pad = 0) {
  for (let i = 1; i < route.length; i++) if (segmentHitsRect(route[i - 1], route[i], rect, pad)) return true;
  return false;
}

export function layoutCallouts({ stops, route, viewport, blocked = [], avoid = [], gaps = [16, 42, 78], routePad = 5, boxPad = 6 }) {
  const inside = (rect) => rect.left >= viewport.left && rect.top >= viewport.top && rect.left + rect.width <= viewport.left + viewport.width && rect.top + rect.height <= viewport.top + viewport.height;
  const directions = [[1, -1], [1, 0], [1, 1], [-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1]];
  const candidates = stops.map((stop) => {
    const list = [];
    for (const gap of gaps) for (const [ux, uy] of directions) {
      const rect = { left: stop.x + ux * gap - (ux < 0 ? stop.width : ux === 0 ? stop.width / 2 : 0), top: stop.y + uy * gap - (uy < 0 ? stop.height : uy === 0 ? stop.height / 2 : 0), width: stop.width, height: stop.height };
      if (!inside(rect) || blocked.some((b) => rectsOverlap(rect, b)) || routeHitsRect(route, rect, routePad)) continue;
      if (stops.some((other) => other !== stop && rectsOverlap(rect, { left: other.x - 8, top: other.y - 8, width: 16, height: 16 }))) continue;
      if (avoid.some((pt) => rectsOverlap(rect, { left: pt.x - 8, top: pt.y - 8, width: 16, height: 16 }))) continue;
      list.push({ rect, gap });
    }
    return list;
  });
  if (candidates.some((list) => !list.length)) return { ok: false, reason: 'no_room', unplaced: candidates.map((list, i) => (list.length ? null : i)).filter((i) => i != null) };
  // Fewest-options-first search over the remaining stops, capped so a crowded map fails fast.
  const chosen = new Array(stops.length).fill(null); let nodes = 0;
  const search = () => {
    if (++nodes > 40000) return false;
    let pick = -1; let options = null;
    for (let i = 0; i < stops.length; i++) {
      if (chosen[i]) continue;
      const free = candidates[i].filter((c) => chosen.every((other) => !other || !rectsOverlap(c.rect, other.rect, boxPad)));
      if (!free.length) return false;
      if (!options || free.length < options.length) { pick = i; options = free; }
    }
    if (pick < 0) return true;
    for (const option of options) { chosen[pick] = option; if (search()) return true; chosen[pick] = null; }
    return false;
  };
  if (!search()) return { ok: false, reason: nodes > 40000 ? 'search_limit' : 'overlap', unplaced: [] };
  return { ok: true, placed: chosen.map((choice, i) => ({ index: i, rect: choice.rect, gap: choice.gap })) };
}
