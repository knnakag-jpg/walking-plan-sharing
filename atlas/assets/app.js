import { routeDistances, playbackStops, partialRoute, revealProgress, drawOnDurationMs, sampleAlong, terrainRuns, sliceRoute, layoutCallouts, TERRAIN_COLORS } from './route-playback.mjs';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const km = (meters) => `${(meters / 1000).toFixed(1)} km`;
const distanceLabel = (route) => Number.isFinite(route?.distanceM) ? km(route.distanceM) : '距離未確定';
const routeDistanceLabel = (course, route) => course?.publicWarning && route?.variant === 'legacy' ? '未確定（旧線の計算値は無効）' : distanceLabel(route);
const routeDistanceBasis = (course, route) => course?.publicWarning && route?.variant === 'legacy' ? '旧線は徒歩距離として無効' : route.geometryUrl ? '経路形状から計算' : '未計測';
const retraceText = (course, route) => route?.variant === 'legacy' && course?.retraceReview ? `旧計算線に約${course.retraceReview.repeatedGeometryM} mの反復候補があります。一筆書きの新経路を再設計中です。` : '';
const variantLabel = (variant) => ({ standard: 'A 標準', extended: 'B 延長', rainy: 'C 雨天', legacy: '旧経路' })[variant] || variant;
const statusText = (status) => ({ idea: 'アイデア', researched: '資料調査済み', routed: '経路計算済み・再調査待ち', map_reviewed: '地図レビュー済み', field_verified: '現地確認済み' })[status] || '確認状態不明';
const localKey = { favorites: 'walking-atlas-favorites-v1', compare: 'walking-atlas-compare-v1', theme: 'walking-atlas-theme-v1', walk: 'walking-atlas-walk-v1' };
const saved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode still supports in-memory use */ } };
const state = { courses: [], byId: new Map(), view: 'discover', selectedId: null, variantById: {}, feature: null, model: null, line: null, callouts: null, finalLead: '', elevationCache: new Map(), routeCache: new Map(), map: null, routeLayer: null, markerLayer: null, locationLayer: null, playback: null, startRing: null, reveal: null, sourceRect: null, lastCardRect: {}, showMarkers: true, routeRequest: 0, favorites: new Set(saved(localKey.favorites, [])), comparison: saved(localKey.compare, []), walkProgress: saved(localKey.walk, {}), profile: 'solo', theme: saved(localKey.theme, 'light'), search: '', series: 'all', distance: 'all', favoritesOnly: false };
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const activeRoute = (course) => course?.routeOptions?.find((route) => route.variant === (state.variantById[course.id] || course.defaultVariant)) || course?.route;
const routeWaypoints = (course, route) => route?.waypoints || course.waypoints;

function visibleCourses() {
  const query = state.search.trim().toLocaleLowerCase('ja');
  return state.courses.filter((course) => {
    if (state.series !== 'all' && course.seriesId !== state.series) return false;
    if (state.favoritesOnly && !state.favorites.has(course.id)) return false;
    const distance = course.publicWarning && activeRoute(course).variant === 'legacy' ? NaN : activeRoute(course).distanceM;
    if (state.distance !== 'all' && !Number.isFinite(distance)) return false;
    if (state.distance === 'short' && distance >= 5000) return false;
    if (state.distance === 'standard' && (distance < 5000 || distance > 6000)) return false;
    if (state.distance === 'extended' && (distance < 6000 || distance > 8000)) return false;
    if (state.distance === 'long' && distance < 8000) return false;
    if (query && ![course.id, course.title, course.seriesName, course.summary, course.routeText, ...course.tags].join(' ').toLocaleLowerCase('ja').includes(query)) return false;
    return true;
  });
}

function renderList() {
  const courses = visibleCourses();
  $('#result-count').textContent = `${courses.length} 件の候補`;
  $('#active-filter-count').textContent = [state.search, state.series !== 'all', state.distance !== 'all', state.favoritesOnly].filter(Boolean).length ? '・適用中' : '';
  $('#course-list').innerHTML = courses.length ? courses.map((course) => { const route = activeRoute(course); return `<button type="button" class="course-card ${course.id === state.selectedId ? 'selected' : ''} ${state.reveal && course.id === state.selectedId ? 'is-revealing' : ''}" data-select="${escapeHtml(course.id)}" aria-pressed="${course.id === state.selectedId}"><span class="card-badge">${escapeHtml(variantLabel(route.variant))}${course.publicWarning || retraceText(course, route) ? '・要再設計' : ''}</span><h3>${escapeHtml(course.title)}</h3><div class="card-meta"><span class="distance-pill">徒歩 ${routeDistanceLabel(course, route)}</span><span>${escapeHtml(course.seriesName)}</span></div><p>${escapeHtml(course.summary)}</p></button>`; }).join('') : '<div class="empty-state">条件に合う候補はありません。絞り込みを変えてください。</div>';
  $$('.course-card').forEach((card) => { state.lastCardRect[card.dataset.select] = card.getBoundingClientRect(); });
  applyUnselectedDim();
}
function applyUnselectedDim() {
  const dim = Boolean(state.reveal) && !prefersReducedMotion();
  $('#course-list').classList.toggle('is-dimmed', dim);
}

function renderFeatured() {
  const ids = ['No.47', 'No.51', 'No.32'];
  $('#featured').innerHTML = ids.map((id, index) => {
    const course = state.byId.get(id);
    if (!course) return '';
    return `<article class="featured-card"><div class="featured-visual" aria-hidden="true"><span>0${index + 1}</span></div><div class="featured-body"><p class="eyebrow">旧資料 ${escapeHtml(id)}</p><h3>${escapeHtml(course.title)}</h3><p>${escapeHtml(course.summary.slice(0, 78))}${course.summary.length > 78 ? '…' : ''}</p><button type="button" data-featured="${escapeHtml(id)}">地図で見る ↗</button></div></article>`;
  }).join('');
}

function renderSelected() {
  const course = state.byId.get(state.selectedId);
  if (!course) return;
  const route = activeRoute(course);
  $('#selected-title').textContent = course.title;
  $('#replay-route').disabled = !route.geometryUrl;
  $('#show-route-now').disabled = !route.geometryUrl;
  $('#variant-switch').innerHTML = course.routeOptions ? `${course.routeOptions.map((option) => `<button type="button" data-variant="${escapeHtml(option.variant)}" class="${option.variant === route.variant ? 'active' : ''}" aria-pressed="${option.variant === route.variant}">${escapeHtml(variantLabel(option.variant))}</button>`).join('')}<span class="variant-hint">A/Bは地図・現地レビュー待ち</span>` : '<span class="variant-hint">旧経路のみ・A/B/Cは再構築待ち</span>';
  $('#map-legend').innerHTML = route.variant === 'legacy' ? '<span><i class="legend-line legacy"></i>旧経路・再調査待ち</span><span><i class="legend-dot"></i>旧資料の経由点</span><span>旧計算線・徒歩距離は要確認</span>' : `<span>${escapeHtml(variantLabel(route.variant))}・${escapeHtml(statusText(route.verificationStatus))}</span><span>${route.geometryUrl ? '道路に沿う計算形状・現地未確認' : '徒歩線は未生成'}</span>`;
  const profileNote = course.seriesId === 'personal' ? '個人散歩：写真の順光・朝の時間帯を見込んだ順路。宿泊は駅近の鍵付完全個室（CPAP・電源）、食事はコンビニ前提。' : state.profile === 'group' ? '歩行会：集合・解散、坂、休憩、トイレ、途中離脱の評価は未完了。' : '個人散歩：豊田駅からのアクセスと中央線への帰路は未調査。';
  $('#selected-summary').innerHTML = `<h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(route.routeReason || course.summary)}</p>${course.publicWarning ? `<p class="walk-warning">${escapeHtml(course.publicWarning)}</p>` : ''}<div class="selected-meta"><span class="status-label">${statusText(route.verificationStatus)}</span><span class="card-meta">徒歩 ${routeDistanceLabel(course, route)} ${routeDistanceBasis(course, route)}</span></div><p class="profile-note">${profileNote}</p><div class="selected-actions"><button type="button" data-action="detail" data-id="${escapeHtml(course.id)}">道の詳細</button><button type="button" data-action="favorite" data-id="${escapeHtml(course.id)}" aria-pressed="${state.favorites.has(course.id)}">${state.favorites.has(course.id) ? '保存済み ♥' : '保存 ♡'}</button><button type="button" data-action="compare" data-id="${escapeHtml(course.id)}" aria-pressed="${state.comparison.includes(course.id)}">${state.comparison.includes(course.id) ? '比較に追加済み' : '比較に追加 ＋'}</button><button type="button" data-action="walk" data-id="${escapeHtml(course.id)}">当日画面</button></div>`;
  if (retraceText(course, route)) $('#selected-summary').querySelector('.selected-meta').insertAdjacentHTML('beforebegin', `<p class="walk-warning">${escapeHtml(retraceText(course, route))}</p>`);
}

function initMap() {
  if (!window.L) { $('#map-fallback').hidden = false; $('#map-status').textContent = '地図ライブラリを読み込めません'; return; }
  try {
    state.map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([35.69, 139.76], 11);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    const tiles = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>' }).addTo(state.map);
    let tileErrors = 0;
    tiles.on('tileerror', () => { if (++tileErrors >= 4) { $('#map-fallback').hidden = false; $('#map-status').textContent = '背景地図を読み込めません'; } });
    state.map.attributionControl.addAttribution('標高: <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル（標高タイル）</a>を加工して作成');
    state.routeLayer = L.layerGroup().addTo(state.map);
    state.markerLayer = L.layerGroup().addTo(state.map);
    state.locationLayer = L.layerGroup().addTo(state.map);
  } catch (error) { console.error('Map initialization failed', error); $('#map-fallback').hidden = false; }
}

async function featureFor(route) {
  if (!route.geometryUrl) return null;
  if (state.routeCache.has(route.id)) return state.routeCache.get(route.id);
  const response = await fetch(route.geometryUrl);
  if (!response.ok) throw new Error(`経路形状を取得できません (${response.status})`);
  const feature = await response.json();
  if (feature?.type !== 'Feature' || feature?.geometry?.type !== 'LineString' || feature.geometry.coordinates.length < 2) throw new Error('経路形状が不正です');
  state.routeCache.set(route.id, feature);
  return feature;
}

// ---- 経路の描画: 勾配色（上り=赤・下り=青へ連続フェード） ----
// The grade series (10m parts, GSI DEM5A) is fetched per route. If it does not line up
// with the drawn line, the route keeps one base colour: never a guessed colouring.
async function gradesFor(route) {
  const url = route.elevation?.url;
  if (!url) return null;
  if (state.elevationCache.has(route.id)) return state.elevationCache.get(route.id);
  let grades = null;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    grades = Array.isArray(data.grades) ? data.grades : null;
  } catch (error) { console.warn('Elevation grades unavailable', route.id, error); }
  state.elevationCache.set(route.id, grades);
  return grades;
}
function lineModel(route, feature, grades) {
  const coordinates = feature.geometry.coordinates;
  const cumulative = routeDistances(coordinates);
  const totalM = cumulative.at(-1);
  const samples = sampleAlong(coordinates, cumulative, 10);
  const terrain = Array.isArray(grades) && grades.length + 1 === samples.length && Math.abs(samples.at(-1)[2] - (route.elevation?.totalM ?? totalM)) <= 1;
  const runs = terrain ? terrainRuns(samples, grades) : [{ fromM: 0, toM: totalM, color: TERRAIN_COLORS.flat, level: 0 }];
  return { feature, coordinates, cumulative, totalM, runs, terrain };
}
const modelBounds = (model) => L.latLngBounds(model.coordinates.map(([lon, lat]) => [lat, lon]));
const lineDash = (route) => (route.variant === 'legacy' ? '8 7' : route.variant === 'extended' ? '13 6' : null);

// Draws a route as a few dozen colour runs, up to a given distance. Finished runs are
// never rebuilt, so a frame only touches the run the line head is in.
function createPainter(group, model, route, { weight = 6, opacity = 1 } = {}) {
  const polys = []; let doneIndex = 0; let currentOpacity = opacity;
  return {
    paint(atM) {
      for (let i = doneIndex; i < model.runs.length; i++) {
        const run = model.runs[i];
        if (run.fromM >= atM) break;
        const toM = Math.min(run.toM, atM);
        const latlngs = sliceRoute(model.coordinates, model.cumulative, run.fromM, toM);
        if (latlngs.length < 2) continue;
        if (!polys[i]) polys[i] = L.polyline(latlngs, { color: run.color, weight, opacity: currentOpacity, dashArray: lineDash(route), lineCap: 'round', lineJoin: 'round', interactive: false }).addTo(group);
        else polys[i].setLatLngs(latlngs);
        if (toM >= run.toM) doneIndex = i + 1;
      }
    },
    setOpacity(value) { currentOpacity = value; polys.forEach((poly) => poly?.setStyle({ opacity: value })); },
    colorAt(atM) { return (model.runs.find((run) => atM <= run.toM) || model.runs.at(-1)).color; },
  };
}
function updateTerrainLegend(model) { const legend = $('#terrain-legend'); if (legend) legend.hidden = !model?.terrain; }

// ---- 吹き出し: 再生完了後に全地点を一度に表示（置けなければ一括表示しない） ----
function clearCallouts() {
  const callouts = state.callouts;
  if (!callouts) return;
  clearTimeout(callouts.timer);
  state.map?.off('movestart', callouts.onStart); state.map?.off('moveend', callouts.onEnd);
  callouts.layer.remove();
  state.callouts = null;
}
const CALLOUT_FAIL_TEXT = '画面が狭く、全地点の吹き出しを経路に重ねず置けないため、一括表示は省略しました。地点を押すと説明を読めます。';
function relativeRect(element, origin) {
  const rect = element.getBoundingClientRect();
  return { left: rect.left - origin.left - 8, top: rect.top - origin.top - 8, width: rect.width + 16, height: rect.height + 16 };
}
function showCallouts(course, route, model, { retried = false } = {}) {
  clearCallouts();
  if (!state.map || !model) return { shown: false, reason: 'no_map' };
  const waypoints = routeWaypoints(course, route);
  const stops = playbackStops(waypoints, model.coordinates, model.cumulative);
  const skipped = waypoints.length - stops.length;
  if (!stops.length) return { shown: false, reason: 'no_stops', skipped };
  const mapEl = $('#map'); const frame = mapEl.parentElement; const origin = mapEl.getBoundingClientRect();
  const width = mapEl.clientWidth; const height = mapEl.clientHeight;
  const layer = document.createElement('div');
  layer.className = 'callout-layer';
  layer.setAttribute('role', 'list');
  layer.setAttribute('aria-label', `${variantLabel(route.variant)} 全${stops.length}地点の説明`);
  frame.append(layer);
  const maxWidth = Math.round(Math.min(214, Math.max(120, width * 0.42)));
  const items = stops.map((stop, index) => {
    const el = document.createElement('div');
    el.className = 'callout';
    el.setAttribute('role', 'listitem');
    el.style.maxWidth = `${maxWidth}px`;
    el.innerHTML = `<b class="callout-num">${index + 1}</b><span class="callout-text"><strong>${escapeHtml(stop.label)}</strong>${stop.curated ? `<em>${escapeHtml(stop.description)}</em>` : ''}</span>`;
    layer.append(el);
    return { stop, el };
  });
  const point = (lonLat) => state.map.latLngToContainerPoint([lonLat[1], lonLat[0]]);
  const sized = items.map(({ stop, el }) => { const rect = el.getBoundingClientRect(); const p = point(stop.point); return { x: p.x, y: p.y, width: Math.ceil(rect.width), height: Math.ceil(rect.height) }; });
  const blocked = ['.leaflet-control-zoom', '.leaflet-control-attribution', '#map-status', '.terrain-legend'].map((selector) => $(selector)).filter((el) => el && el.offsetWidth > 0).map((el) => relativeRect(el, origin));
  const route2d = model.coordinates.map((coordinate) => { const p = point(coordinate); return [p.x, p.y]; });
  const avoid = waypoints.map((waypoint) => { const p = point(waypoint.point); return { x: p.x, y: p.y }; });
  const layout = layoutCallouts({ stops: sized, route: route2d, viewport: { left: 4, top: 4, width: width - 8, height: height - 8 }, blocked, avoid });
  if (!layout.ok) {
    layer.remove();
    // One retry with more room around the route, only if zooming out can actually help.
    const wider = modelBounds(model).pad(.55);
    if (!retried && state.map.getBoundsZoom(wider) < state.map.getZoom()) {
      state.map.once('moveend', () => { if (state.model === model && state.view === 'explore') { const result = showCallouts(course, route, model, { retried: true }); $('#map-status').textContent = calloutStatus(route, result); } });
      state.map.fitBounds(wider, { animate: !prefersReducedMotion(), duration: .5, maxZoom: 15 });
      return { shown: false, reason: 'retrying', skipped };
    }
    return { shown: false, reason: layout.reason, skipped };
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'callout-leaders'); svg.setAttribute('width', width); svg.setAttribute('height', height); svg.setAttribute('aria-hidden', 'true');
  layer.prepend(svg);
  layout.placed.forEach(({ index, rect }) => {
    const { el } = items[index]; const anchor = sized[index];
    el.style.left = `${Math.round(rect.left)}px`; el.style.top = `${Math.round(rect.top)}px`;
    el.style.setProperty('--delay', `${index * 70}ms`);
    const cx = Math.max(rect.left, Math.min(anchor.x, rect.left + rect.width)); const cy = Math.max(rect.top, Math.min(anchor.y, rect.top + rect.height));
    svg.insertAdjacentHTML('beforeend', `<line x1="${anchor.x.toFixed(1)}" y1="${anchor.y.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${cy.toFixed(1)}"/><circle cx="${anchor.x.toFixed(1)}" cy="${anchor.y.toFixed(1)}" r="3.5"/>`);
    el.classList.add('is-placed');
  });
  const callouts = { layer, timer: null, onStart: () => layer.classList.add('is-hidden'), onEnd: null };
  callouts.onEnd = () => {
    clearTimeout(callouts.timer);
    callouts.timer = setTimeout(() => {
      if (state.callouts !== callouts) return;
      const result = showCallouts(course, route, model, { retried: true });
      $('#map-status').textContent = calloutStatus(route, result);
    }, 160);
  };
  state.callouts = callouts;
  state.map.on('movestart', callouts.onStart); state.map.on('moveend', callouts.onEnd);
  return { shown: true, count: stops.length, skipped };
}
function calloutStatus(route, result) {
  const lead = `${variantLabel(route.variant)}の${state.finalLead || '再生が終わりました'}。`;
  const note = result.skipped ? `${result.skipped}地点は計算線から離れているため対象外。` : '';
  if (result.shown) return `${lead}全${result.count}地点の吹き出しを表示中。${note}現地の道順は未確認です。`;
  if (result.reason === 'retrying') return `${lead}吹き出しの置き場所を確保するため地図を広げています…`;
  if (result.reason === 'no_stops') return `${lead}経路上に置ける地点がないため吹き出しはありません。現地の道順は未確認です。`;
  return `${lead}${CALLOUT_FAIL_TEXT}${note}`;
}

// Where playback, "すぐ表示" and reduced-motion all end up: the whole line in terrain
// colours, plus every checkpoint's balloon if (and only if) they all fit.
function showFinalState(lead = '再生が終わりました') {
  const course = state.byId.get(state.selectedId); const model = state.model;
  if (!course || !model) return;
  const route = activeRoute(course);
  state.finalLead = lead;
  stopReveal(); stopRouteAnimation();
  drawFeature(course, route, model, { fit: false });
  const result = showCallouts(course, route, model);
  $('#map-status').textContent = calloutStatus(route, result);
}

// ---- カードから道へ: 選択 → 地図が展開 → カメラが飛ぶ → 始点が脈打つ → 線が走る ----
// Every timer and animation frame is owned by state.reveal, and stopReveal() is the
// only way they end, so a second click cannot leave a ring, trail or dim list behind.
function stopReveal({ finished = false } = {}) {
  const reveal = state.reveal;
  if (!reveal) return;
  cancelAnimationFrame(reveal.frame);
  clearTimeout(reveal.trailTimer);
  reveal.group?.remove();
  reveal.card?.classList.remove('is-revealing');
  removeStartRing();
  state.reveal = null;
  $('#map-column')?.classList.remove('is-unfolding');
  $('#map-pulse')?.classList.remove('is-on');
  $$('.map-sweep, .reveal-chip').forEach((el) => el.remove());
  $('#course-list')?.classList.remove('is-dimmed');
  $$('.course-card.is-revealing').forEach((card) => card.classList.remove('is-revealing'));
  if (finished && !prefersReducedMotion() && state.map) {
    const end = reveal.model.coordinates.at(-1);
    const px = state.map.latLngToContainerPoint([end[1], end[0]]);
    for (const [delay, cls] of [[0, 'map-end-ring'], [140, 'map-end-ring is-late']]) {
      const ring = document.createElement('span');
      ring.className = cls; ring.setAttribute('aria-hidden', 'true');
      ring.style.left = `${px.x}px`; ring.style.top = `${px.y}px`; ring.style.animationDelay = `${delay}ms`;
      $('#map')?.append(ring);
      setTimeout(() => ring.remove(), 1200);
    }
  }
}

function flyTrail(from, to) {
  if (!from || !to) return;
  const dx = to.x - from.x; const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 40 || length > 1600) return;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const hair = document.createElement('span');
  hair.className = 'map-sweep';
  hair.setAttribute('aria-hidden', 'true');
  hair.style.left = `${from.x}px`; hair.style.top = `${from.y}px`; hair.style.width = `${length}px`;
  hair.style.transform = `rotate(${angle}deg) scaleX(0)`;
  $('#map-column')?.append(hair);
  hair.animate([{ transform: `rotate(${angle}deg) scaleX(0)`, opacity: 0 }, { transform: `rotate(${angle}deg) scaleX(.55)`, opacity: 1, offset: .45 }, { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 1, offset: .75 }, { transform: `rotate(${angle}deg) scaleX(1)`, opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.2,.7,.2,1)' }).finished.then(() => hair.remove()).catch(() => hair.remove());
}

function startRingAt(latlng, { radius = 30 } = {}) {
  removeStartRing();
  const rings = [L.circleMarker(latlng, { radius, weight: 0, fillColor: '#246c55', fillOpacity: .18, interactive: false }), L.circleMarker(latlng, { radius: Math.round(radius * .62), weight: 0, fillColor: '#246c55', fillOpacity: .14, interactive: false }), L.circleMarker(latlng, { radius: 9, color: '#246c55', weight: 3, opacity: .95, fillColor: '#fff', fillOpacity: 1, interactive: false })];
  state.startRing = L.layerGroup(rings).addTo(state.map);
  return rings;
}
function removeStartRing() { state.startRing?.remove(); state.startRing = null; }

const REVEAL_RING_MS = 460; const REVEAL_FLY_S = .85; const REVEAL_DRAW_AT_MS = 520;
function drawOn(course, route, model) {
  if (!state.map || !model) return null;
  stopReveal(); stopRouteAnimation();
  state.routeLayer.clearLayers(); state.markerLayer.clearLayers(); state.line = null;
  updateTerrainLegend(model);
  state.map.invalidateSize();
  const { coordinates, cumulative, totalM } = model;
  const start = [coordinates[0][1], coordinates[0][0]];
  const bounds = modelBounds(model).pad(.17);
  if (prefersReducedMotion() || !Number.isFinite(totalM) || totalM <= 0) {
    state.map.fitBounds(bounds, { animate: false, maxZoom: 15 });
    drawFeature(course, route, model, { fit: false });
    startRingAt(start);
    setTimeout(() => { if (!state.reveal) removeStartRing(); }, 1800);
    $('#map-status').textContent = `${variantLabel(route.variant)}・${routeDistanceLabel(course, route)}／地図・現地レビュー待ち。地点を押すと説明を読めます。`;
    return null;
  }
  // Camera: fly (zoom out and in) toward the route while the card lifts and the panel unfolds.
  const zoom = Math.min(15, state.map.getBoundsZoom(bounds));
  const size = state.map.getSize();
  const landing = { x: size.x / 2 + state.map.project(start, zoom).x - state.map.project(bounds.getCenter(), zoom).x, y: size.y / 2 + state.map.project(start, zoom).y - state.map.project(bounds.getCenter(), zoom).y };
  state.map.flyToBounds(bounds, { duration: REVEAL_FLY_S, maxZoom: 15 });
  const group = L.layerGroup().addTo(state.routeLayer);
  const painter = createPainter(group, model, route, { weight: 7 });
  const head = L.circleMarker(start, { radius: 8, color: '#fff', weight: 3, fillColor: TERRAIN_COLORS.flat, fillOpacity: 1, interactive: false }).addTo(group);
  const reveal = { course, route, model, group, frame: null, trailTimer: null, card: null };
  state.reveal = reveal;
  const rings = startRingAt(start);
  $('#map-column').classList.add('is-unfolding');
  $('#course-list').classList.add('is-dimmed');
  const card = $(`.course-card[data-select="${CSS.escape(course.id)}"]`);
  card?.classList.add('is-revealing');
  reveal.card = card;
  const cardRect = card?.getBoundingClientRect() || state.lastCardRect[course.id] || null;
  const mapRect = $('#map')?.getBoundingClientRect() || null;
  reveal.trailTimer = setTimeout(() => { reveal.trailTimer = null; flyTrail(cardRect && mapRect ? { x: cardRect.left + cardRect.width / 2 - mapRect.left, y: cardRect.top + cardRect.height / 2 - mapRect.top } : null, landing); }, 100);
  const pulse = $('#map-pulse');
  if (pulse) { pulse.classList.add('is-on'); setTimeout(() => pulse.classList.remove('is-on'), 700); }
  const durationMs = drawOnDurationMs(totalM);
  const began = performance.now();
  let runIndex = 0;
  const tick = (time) => {
    if (state.reveal !== reveal) return;
    const elapsed = time - began;
    if (elapsed < REVEAL_RING_MS) {
      const beat = Math.sin(elapsed / REVEAL_RING_MS * Math.PI);
      rings[0].setRadius(22 + 30 * (elapsed / REVEAL_RING_MS)); rings[0].setStyle({ fillOpacity: .26 * (1 - elapsed / REVEAL_RING_MS) });
      rings[1].setRadius(12 + 22 * beat); rings[1].setStyle({ fillOpacity: .22 * (1 - elapsed / REVEAL_RING_MS * .6) });
    } else if (state.startRing && elapsed >= REVEAL_DRAW_AT_MS) { removeStartRing(); }
    if (elapsed < REVEAL_DRAW_AT_MS) { reveal.frame = requestAnimationFrame(tick); return; }
    const progress = revealProgress(elapsed - REVEAL_DRAW_AT_MS, durationMs);
    const atM = totalM * progress;
    painter.paint(atM);
    while (runIndex < model.runs.length - 1 && atM > model.runs[runIndex].toM) runIndex++;
    const headPoint = partialRoute(coordinates, cumulative, atM).at(-1);
    head.setLatLng(headPoint); head.setStyle({ fillColor: model.runs[runIndex].color, radius: 8 + 3 * Math.sin(elapsed / 90) });
    if (progress >= 1) { finishReveal(reveal); return; }
    reveal.frame = requestAnimationFrame(tick);
  };
  reveal.frame = requestAnimationFrame(tick);
  $('#map-status').textContent = `${variantLabel(route.variant)}を地図に表示しています…`;
  return reveal;
}
function finishReveal(reveal) {
  const { course, route, model } = reveal;
  stopReveal({ finished: true });
  drawFeature(course, route, model, { fit: false });
  const end = model.coordinates.at(-1);
  const px = state.map.latLngToContainerPoint([end[1], end[0]]);
  const chip = document.createElement('span');
  chip.className = 'reveal-chip';
  chip.textContent = `${routeDistanceLabel(course, route)}・${statusText(route.verificationStatus)}`;
  chip.style.left = `${px.x}px`; chip.style.top = `${px.y - 14}px`;
  $('#map')?.append(chip);
  setTimeout(() => chip.remove(), 2800);
  $('#map-status').textContent = `${variantLabel(route.variant)}・${routeDistanceLabel(course, route)}／地図・現地レビュー待ち。地点を押すと説明を読めます。${model.terrain ? '色は上り＝赤・下り＝青。' : ''}`;
}

function checkpointContent(label, description, number, total) {
  return `<div class="checkpoint-popup"><strong>${escapeHtml(label)}</strong><p>${escapeHtml(description)}</p><small>チェックポイント ${number} / ${total}・計算線上の目安</small></div>`;
}
function stopRouteAnimation() {
  clearCallouts();
  const playback = state.playback;
  if (!playback) return;
  cancelAnimationFrame(playback.frame);
  state.line?.painter.setOpacity(1);
  playback.group?.remove();
  state.map?.closePopup();
  state.playback = null;
  $('#replay-route').setAttribute('aria-pressed', 'false');
}
function animateRoute() {
  stopRouteAnimation();
  const model = state.model;
  if (!state.map || !model?.coordinates?.length || state.view !== 'explore') return;
  const course = state.byId.get(state.selectedId); const route = activeRoute(course);
  const { coordinates, cumulative, totalM } = model;
  if (!Number.isFinite(totalM) || totalM <= 0) return;
  const stops = playbackStops(routeWaypoints(course, route), coordinates, cumulative);
  const skippedStops = routeWaypoints(course, route).length - stops.length;
  if (prefersReducedMotion()) { showFinalState(); return; }
  stopReveal();
  state.line?.painter.setOpacity(.22);
  const group = L.layerGroup().addTo(state.routeLayer);
  const painter = createPainter(group, model, route, { weight: 7 });
  const head = L.circleMarker([coordinates[0][1], coordinates[0][0]], { radius: 8, color: '#fff', weight: 3, fillColor: TERRAIN_COLORS.flat, fillOpacity: 1, interactive: false }).addTo(group);
  const playback = { group, painter, frame: null };
  state.playback = playback;
  $('#replay-route').setAttribute('aria-pressed', 'true');
  const speedMperMs = totalM / Math.max(9000, Math.min(20000, totalM / 450 * 1000));
  let progressM = 0; let previousTime = null; let nextStop = 0; let pauseUntil = 0;
  const tick = (time) => {
    if (state.playback !== playback) return;
    const elapsed = previousTime == null ? 0 : Math.min(100, time - previousTime);
    previousTime = time;
    if (pauseUntil) {
      if (time >= pauseUntil) { state.map.closePopup(); pauseUntil = 0; }
    } else {
      progressM = Math.min(totalM, progressM + elapsed * speedMperMs);
      if (stops[nextStop] && progressM >= stops[nextStop].atM) {
        const stop = stops[nextStop]; progressM = stop.atM;
        L.popup({ autoClose: true, closeButton: false, className: 'checkpoint-bubble', offset: [0, -12] }).setLatLng([stop.point[1], stop.point[0]]).setContent(checkpointContent(stop.label, stop.description, nextStop + 1, stops.length)).openOn(state.map);
        $('#map-status').textContent = `${nextStop + 1}/${stops.length} ${stop.label}・経路プレビュー`;
        pauseUntil = time + 2200; nextStop++;
      }
      painter.paint(progressM);
      head.setLatLng(partialRoute(coordinates, cumulative, progressM).at(-1)); head.setStyle({ fillColor: painter.colorAt(progressM) });
      if (progressM >= totalM && nextStop >= stops.length) { showFinalState(); return; }
    }
    playback.frame = requestAnimationFrame(tick);
  };
  $('#map-status').textContent = `${variantLabel(route.variant)}を再生中・${stops.length}地点で説明します${skippedStops ? `（${skippedStops}地点は線から離れています）` : ''}`;
  playback.frame = requestAnimationFrame(tick);
}

function drawMarkers(course, route) {
  state.markerLayer.clearLayers();
  if (!state.showMarkers) return;
  const waypoints = routeWaypoints(course, route);
  waypoints.forEach((waypoint, index) => {
    const last = index === waypoints.length - 1;
    const marker = L.circleMarker([waypoint.point[1], waypoint.point[0]], { radius: index === 0 || last ? 7 : 5, color: '#fff', weight: 2, fillColor: index === 0 ? '#246c55' : last ? '#bf795e' : '#516c64', fillOpacity: 1 });
    const label = waypoint.label || (index === 0 ? '旧経路の起点' : last ? '旧経路の終点' : `旧資料の経由点 ${index + 1}`);
    marker.bindTooltip(label);
    marker.bindPopup(checkpointContent(label, waypoint.description || (waypoint.label ? 'この地点付近を通る計算経路です。施設の入口と通行条件は未確認です。' : '旧資料の経由点です。地点名と施設入口は再調査中です。'), index + 1, waypoints.length));
    marker.addTo(state.markerLayer);
  });
}

function drawFeature(course, route, model, { fit = true } = {}) {
  if (!state.map) return;
  stopRouteAnimation();
  if (!fit) stopReveal();
  state.routeLayer.clearLayers();
  state.line = null;
  if (state.startRing) state.routeLayer.addLayer(state.startRing);
  if (!model) { state.markerLayer.clearLayers(); updateTerrainLegend(null); return; }
  const group = L.layerGroup().addTo(state.routeLayer);
  const painter = createPainter(group, model, route);
  painter.paint(model.totalM);
  state.line = { group, painter, model };
  updateTerrainLegend(model);
  drawMarkers(course, route);
  state.map.invalidateSize();
  if (fit) state.map.fitBounds(modelBounds(model).pad(.17), { animate: !prefersReducedMotion(), maxZoom: 15 });
}

async function selectCourse(id, { updateHash = true } = {}) {
  const course = state.byId.get(id);
  if (!course) return;
  // Capture the card's position before the click handler ends: on phones the list
  // scrolls under the map, so the rect must be read from the pre-scroll layout.
  const clickedCard = $(`.course-card[data-select="${CSS.escape(id)}"]`);
  state.sourceRect = clickedCard?.getBoundingClientRect() || state.sourceRect;
  stopRouteAnimation();
  stopReveal();
  const route = activeRoute(course);
  state.selectedId = id;
  renderList(); renderSelected();
  if (updateHash) history.replaceState(null, '', `#${course.legacyAnchor}`);
  const request = ++state.routeRequest;
  $('#map-status').textContent = `${variantLabel(route.variant)}を読み込み中…`;
  try {
    const feature = await featureFor(route);
    const grades = feature ? await gradesFor(route) : null;
    if (request !== state.routeRequest) return;
    state.feature = feature;
    state.model = feature ? lineModel(route, feature, grades) : null;
    if (state.model) drawOn(course, route, state.model);
    else { drawFeature(course, route, null); $('#map-status').textContent = `${variantLabel(route.variant)}・徒歩線未生成／屋内・鉄道の案を詳細に表示`; }
  } catch (error) {
    if (request !== state.routeRequest) return;
    state.feature = null; state.model = null; state.line = null;
    stopReveal(); updateTerrainLegend(null);
    state.routeLayer?.clearLayers(); state.markerLayer?.clearLayers();
    $('#map-status').textContent = error.message;
  }
}

function showView(view, { updateHash = true } = {}) {
  if (!['discover', 'explore', 'compare', 'walk'].includes(view)) return;
  if (view !== 'explore') { stopRouteAnimation(); stopReveal(); }
  state.view = view;
  $$('.view').forEach((section) => { section.hidden = section.id !== `view-${view}`; });
  $$('[data-view]').forEach((button) => { button.classList.toggle('is-active', button.dataset.view === view); if (button.tagName === 'BUTTON') button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false'); });
  if (updateHash) history.replaceState(null, '', `#${view}`);
  if (view === 'explore') {
    // The panel was display:none while another view was shown; unfold it once the
    // layout is back, then invalidate the map a single time.
    const column = $('#map-column');
    if (column && state.feature) { column.classList.add('is-unfolding'); const pulse = $('#map-pulse'); pulse?.classList.add('is-on'); setTimeout(() => { column.classList.remove('is-unfolding'); pulse?.classList.remove('is-on'); }, 560); }
    setTimeout(() => state.map?.invalidateSize(), 0);
  }
  if (view === 'compare') renderCompare();
  if (view === 'walk') renderWalk();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
  save(localKey.favorites, [...state.favorites]);
  renderSelected(); renderList();
}
function toggleCompare(id) {
  if (state.comparison.includes(id)) state.comparison = state.comparison.filter((item) => item !== id);
  else if (state.comparison.length < 3) state.comparison.push(id);
  else { alert('比較できる候補は3件までです。比較画面で1件外してください。'); return; }
  save(localKey.compare, state.comparison);
  renderSelected(); renderCompare();
}

function openDetail(id) {
  const course = state.byId.get(id);
  if (!course) return;
  const route = activeRoute(course);
  const flagNames = { repeated_geometry_over_10pct: '形状上の反復が10%超', repeated_waypoint: '経由点の再訪', waypoint_off_shape: '経由点が計算形状から40m超', geometry_distance_gap: '経路エンジン値との距離差', legacy_route_text_missing: '旧経路説明の欠落' };
  const flags = course.auditFlags.length ? `自動監査：${course.auditFlags.map((flag) => flagNames[flag] || flag).join('、')}。` : '自動監査の主な警告なし。';
  const routeNote = route.variant === 'legacy' ? `旧資料の経路説明：${course.routeText || '説明なし'}` : route.routeReason;
  const segments = route.segments?.length ? `<h3>雨天時の区間</h3><ol class="detail-segments">${route.segments.map((leg) => `<li><strong>${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</strong><br>${escapeHtml(({ walk_outdoor: '屋外徒歩', walk_indoor: '屋内徒歩', rail: '鉄道' })[leg.kind] || leg.kind)} ／ ${escapeHtml(leg.note)}</li>`).join('')}</ol><p>${escapeHtml((route.conditions || []).join(' '))}</p>` : '';
  const sources = course.evidence?.length ? `<h3>調査資料</h3><ul class="detail-sources">${course.evidence.map((item) => `<li><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a><br><small>${escapeHtml(item.supports)} ／ 確認 ${escapeHtml(item.checkedAt)}</small></li>`).join('')}</ul>` : '<p>資料出典は未整理です。</p>';
  const scenic = ['standard', 'extended'].includes(route.variant) && course.scenicSegments?.length ? `<h3>景観区間の候補</h3><ul class="detail-sources">${course.scenicSegments.map((item) => `<li><strong>${escapeHtml(item.name)}</strong>：${escapeHtml(item.theme)}<br><small>${escapeHtml(item.direction)} ／ ${escapeHtml(item.reviewStatus)} ／ 根拠：${escapeHtml(item.evidenceTitle)}</small></li>`).join('')}</ul>` : '';
  const screening = route.geometryScreening ? `<h3>計算線の点検メモ</h3><p>保存済み形状の同じ辺を照合した結果、約${escapeHtml(route.geometryScreening.repeatedGeometryM)} mの反復候補があります。道路の同一性や通行可能性は未確認です。</p><ul class="detail-sources">${route.geometryScreening.findings.map((item) => `<li>${escapeHtml(item.note)}<br><small>形状上の反復 約${escapeHtml(item.repeatedM)} m ／ 起点座標 ${escapeHtml(item.point.join(', '))}</small></li>`).join('')}</ul><p>地図レビュー待ち：${escapeHtml(route.geometryScreening.openChecks.join('、'))}。</p>` : '';
  const unresolved = course.openQuestions?.length ? `<h3>未確認事項</h3><ul class="detail-sources">${course.openQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '';
  const variantButtons = course.routeOptions ? course.routeOptions.map((option) => `<button type="button" class="variant-chip ${route.variant === option.variant ? 'active' : ''}" data-variant="${escapeHtml(option.variant)}">${escapeHtml(variantLabel(option.variant))}</button>`).join('') : '<span class="variant-chip active">旧経路</span><span class="variant-chip unavailable">A/B/C 再構築待ち</span>';
  $('#detail-content').innerHTML = `<h2 id="detail-title">${escapeHtml(course.title)}</h2><div class="selected-meta"><span class="status-label">${statusText(route.verificationStatus)}</span><span class="card-meta">${escapeHtml(variantLabel(route.variant))} ／ 旧資料 ${escapeHtml(course.id)}</span></div><p>${escapeHtml(course.summary)}</p><div class="detail-grid"><div class="detail-box"><strong>徒歩距離</strong>${routeDistanceLabel(course, route)}（${routeDistanceBasis(course, route)}）${route.variant === 'legacy' ? `<br>旧カードの目標 ${km(route.targetDistanceM)}` : ''}</div><div class="detail-box"><strong>道路の重複</strong>${Number.isFinite(route.repeatedGeometryPct) ? `${route.repeatedGeometryPct}%（形状上の候補値）` : '道路エッジ照合待ち'}</div><div class="detail-box"><strong>個人散歩</strong>豊田駅からの鉄道アクセス・東京駅経由の帰宅は未調査</div><div class="detail-box"><strong>歩行会</strong>休憩・トイレ・段差・途中離脱は再確認が必要</div></div><h3>経路の種類</h3><div class="variant-row">${variantButtons}</div><h3>この道を選ぶ理由</h3><p class="detail-route-text">${escapeHtml(routeNote || '経路選定理由は未整理です。')}</p>${scenic}${screening}${segments}<h3>確認状態</h3><p>計算経路と資料調査の段階です。出入口、通行の安全性、現地での距離は未確認です。${route.variant === 'legacy' ? escapeHtml(flags) : '地図レビューと現地確認が必要です。'}</p>${unresolved}${sources}<p><a href="${escapeHtml(course.legacyUrl)}">旧ページの原資料を見る ↗</a></p>`;
  if (course.publicWarning) $('#detail-content').querySelector('.selected-meta').insertAdjacentHTML('afterend', `<p class="walk-warning">${escapeHtml(course.publicWarning)}</p>`);
  if (retraceText(course, route)) $('#detail-content').querySelector('.selected-meta').insertAdjacentHTML('afterend', `<p class="walk-warning">${escapeHtml(retraceText(course, route))}</p>`);
  const dialog = $('#detail-dialog');
  if (!dialog.open) dialog.showModal();
}

function renderCompare() {
  const courses = state.comparison.map((id) => state.byId.get(id)).filter(Boolean);
  if (!courses.length) { $('#compare-content').innerHTML = '<div class="compare-empty"><strong>まだ比較するコースがありません。</strong><p>地図から候補を最大3件追加してください。</p><button class="outline-button" type="button" data-view="explore">地図から探す</button></div>'; return; }
  const cell = (fn) => courses.map((course) => `<td>${fn(course)}</td>`).join('');
  $('#compare-content').innerHTML = `<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th scope="col">比較項目</th>${courses.map((course) => `<th scope="col">${escapeHtml(course.title)}<br><button type="button" data-remove-compare="${escapeHtml(course.id)}">比較から外す</button></th>`).join('')}</tr></thead><tbody><tr><td>経路の種類</td>${cell((c) => variantLabel(activeRoute(c).variant))}</tr><tr><td>徒歩距離</td>${cell((c) => `${routeDistanceLabel(c, activeRoute(c))}<br><small>${routeDistanceBasis(c, activeRoute(c))}</small>`)}</tr><tr><td>確認状態</td>${cell((c) => statusText(activeRoute(c).verificationStatus))}</tr><tr><td>上り／下り</td>${cell((c) => activeRoute(c).variant === 'legacy' && c.climbM != null ? `${c.climbM} m ／ ${c.descentM} m（旧計算値）` : '再計算待ち')}</tr><tr><td>一筆書き性</td>${cell((c) => Number.isFinite(activeRoute(c).repeatedGeometryPct) ? `${activeRoute(c).repeatedGeometryPct}%（形状上の候補値）` : '道路エッジ照合待ち')}</tr><tr><td>豊田駅からのアクセス</td>${cell(() => '未調査')}</tr><tr><td>雨天・休憩・トイレ</td>${cell(() => '未調査')}</tr><tr><td>景観の選定理由</td>${cell((c) => activeRoute(c).routeReason ? escapeHtml(activeRoute(c).routeReason) : '再調査待ち')}</tr></tbody></table></div><p class="walk-warning">候補の優劣は、道路と景観の調査が済むまで付けません。</p>`;
}

function renderWalk() {
  const course = state.byId.get($('#walk-course').value);
  if (!course) { $('#walk-variant').innerHTML = '<option value="">コースを選んでください</option>'; $('#walk-variant').disabled = true; $('#walk-content').innerHTML = '<div class="compare-empty">コースを選ぶと、経由点を手動で確認できます。</div>'; return; }
  const route = activeRoute(course);
  $('#walk-variant').innerHTML = (course.routeOptions || [route]).map((option) => `<option value="${escapeHtml(option.variant)}">${escapeHtml(variantLabel(option.variant))}</option>`).join('');
  $('#walk-variant').value = route.variant;
  $('#walk-variant').disabled = !course.routeOptions;
  if (!route.geometryUrl) {
    $('#walk-content').innerHTML = `<div class="walk-panel"><span class="status-label">${statusText(route.verificationStatus)}</span><h2>${escapeHtml(course.title)}・${escapeHtml(variantLabel(route.variant))}</h2><p>${escapeHtml(route.routeReason)}</p><ol class="waypoint-list">${(route.segments || []).map((leg) => `<li><strong>${escapeHtml(leg.from)} → ${escapeHtml(leg.to)}</strong>：${escapeHtml(leg.note)}</li>`).join('')}</ol><p class="walk-warning">徒歩の経路線・距離、屋内連続歩行区間、開館状況を確定していません。出発前に公式情報を確認してください。</p></div>`;
    if (course.publicWarning) $('#walk-content').querySelector('.walk-panel').insertAdjacentHTML('afterbegin', `<p class="walk-warning">${escapeHtml(course.publicWarning)}</p>`);
    if (retraceText(course, route)) $('#walk-content').querySelector('.walk-panel').insertAdjacentHTML('afterbegin', `<p class="walk-warning">${escapeHtml(retraceText(course, route))}</p>`);
    return;
  }
  const waypoints = routeWaypoints(course, route);
  const progressId = `${course.id}-${route.variant}`;
  const index = Math.max(0, Math.min(waypoints.length - 1, Number(state.walkProgress[progressId] || 0)));
  const percent = waypoints.length > 1 ? index / (waypoints.length - 1) * 100 : 0;
  $('#walk-content').innerHTML = `<div class="walk-panel"><span class="status-label">${statusText(route.verificationStatus)}</span><h2>${escapeHtml(course.title)}・${escapeHtml(variantLabel(route.variant))}</h2><div class="walk-progress" role="progressbar" aria-valuenow="${index + 1}" aria-valuemin="1" aria-valuemax="${waypoints.length}" aria-label="経由点の進行状況"><span style="width:${percent}%"></span></div><p class="walk-next">${escapeHtml(waypoints[index].label || `旧資料の経由点 ${index + 1}`)} <small>${index + 1} / ${waypoints.length}</small></p><p>予定経由点の進行状況です。出入口と歩く道路は地図・現地レビュー待ちです。</p><div class="walk-controls"><button type="button" data-walk-step="-1" ${index === 0 ? 'disabled' : ''}>前の地点</button><button type="button" class="progress-button" data-walk-step="1" ${index === waypoints.length - 1 ? 'disabled' : ''}>この地点に着いた</button><button type="button" data-walk-reset="true">最初から</button><button type="button" data-location="true">現在位置を地図に表示</button></div><p id="geo-status" class="geo-status">位置情報は許可時だけ使い、保存しません。</p><ol class="waypoint-list">${waypoints.map((waypoint, i) => `<li class="${i === index ? 'current' : ''}">${escapeHtml(waypoint.label || `旧資料の経由点 ${i + 1}`)}</li>`).join('')}</ol><p class="walk-warning">この画面はナビゲーションではありません。残り距離・トイレ・離脱は未確認。通行状況と施設情報は当日確認してください。</p></div>`;
  if (course.publicWarning) $('#walk-content').querySelector('.walk-panel').insertAdjacentHTML('afterbegin', `<p class="walk-warning">${escapeHtml(course.publicWarning)}</p>`);
  if (retraceText(course, route)) $('#walk-content').querySelector('.walk-panel').insertAdjacentHTML('afterbegin', `<p class="walk-warning">${escapeHtml(retraceText(course, route))}</p>`);
}

function handleHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  const course = state.courses.find((item) => item.legacyAnchor === hash);
  if (course) { showView('explore', { updateHash: false }); selectCourse(course.id, { updateHash: false }); return; }
  showView(['discover', 'explore', 'compare', 'walk'].includes(hash) ? hash : 'discover', { updateHash: false });
}

function wireEvents() {
  document.addEventListener('click', async (event) => {
    const view = event.target.closest('[data-view]');
    if (view) { showView(view.dataset.view); return; }
    const theme = event.target.closest('[data-theme-filter]');
    if (theme) { state.search = theme.dataset.themeFilter; $('#search').value = state.search; renderList(); showView('explore'); return; }
    const featured = event.target.closest('[data-featured]');
    if (featured) { showView('explore', { updateHash: false }); await selectCourse(featured.dataset.featured); return; }
    const variant = event.target.closest('[data-variant]');
    if (variant && state.selectedId) {
      state.variantById[state.selectedId] = variant.dataset.variant;
      await selectCourse(state.selectedId);
      if ($('#detail-dialog').open) openDetail(state.selectedId);
      if ($('#walk-course').value === state.selectedId) renderWalk();
      return;
    }
    const select = event.target.closest('[data-select]');
    if (select) { await selectCourse(select.dataset.select); return; }
    const action = event.target.closest('[data-action]');
    if (action) {
      const { id } = action.dataset;
      if (action.dataset.action === 'detail') openDetail(id);
      if (action.dataset.action === 'favorite') toggleFavorite(id);
      if (action.dataset.action === 'compare') toggleCompare(id);
      if (action.dataset.action === 'walk') { $('#walk-course').value = id; showView('walk'); }
      return;
    }
    const remove = event.target.closest('[data-remove-compare]');
    if (remove) { toggleCompare(remove.dataset.removeCompare); return; }
    const step = event.target.closest('[data-walk-step]');
    if (step) { const course = state.byId.get($('#walk-course').value); const id = `${course.id}-${activeRoute(course).variant}`; state.walkProgress[id] = Number(state.walkProgress[id] || 0) + Number(step.dataset.walkStep); save(localKey.walk, state.walkProgress); renderWalk(); return; }
    if (event.target.closest('[data-walk-reset]')) { const course = state.byId.get($('#walk-course').value); const id = `${course.id}-${activeRoute(course).variant}`; state.walkProgress[id] = 0; save(localKey.walk, state.walkProgress); renderWalk(); return; }
    if (event.target.closest('[data-location]')) showLocation();
  });
  $('#search').addEventListener('input', (event) => { state.search = event.target.value; renderList(); });
  $('#series-filter').addEventListener('change', (event) => { state.series = event.target.value; renderList(); });
  $('#distance-filter').addEventListener('change', (event) => { state.distance = event.target.value; renderList(); });
  $('#favorites-only').addEventListener('change', (event) => { state.favoritesOnly = event.target.checked; renderList(); });
  $('#reset-filters').addEventListener('click', () => { state.search = ''; state.series = 'all'; state.distance = 'all'; state.favoritesOnly = false; $('#search').value = ''; $('#series-filter').value = 'all'; $('#distance-filter').value = 'all'; $('#favorites-only').checked = false; renderList(); });
  $('#profile').addEventListener('change', (event) => { state.profile = event.target.value; if (state.selectedId) renderSelected(); });
  $('#walk-course').addEventListener('change', () => { const id = $('#walk-course').value; renderWalk(); if (id) selectCourse(id, { updateHash: false }); });
  $('#walk-variant').addEventListener('change', () => { const id = $('#walk-course').value; if (!id) return; state.variantById[id] = $('#walk-variant').value; renderWalk(); selectCourse(id, { updateHash: false }); });
  $('#fit-route').addEventListener('click', () => { if (state.map && state.model) state.map.fitBounds(modelBounds(state.model).pad(.17), { maxZoom: 15 }); });
  $('#replay-route').addEventListener('click', animateRoute);
  $('#show-route-now').addEventListener('click', () => { if (state.selectedId && state.model) showFinalState('経路全体を表示しました'); else if (state.map) state.map.invalidateSize(); });
  $('#map-layer-toggle').addEventListener('click', () => { state.showMarkers = !state.showMarkers; $('#map-layer-toggle').setAttribute('aria-pressed', String(state.showMarkers)); $('#map-layer-toggle').textContent = state.showMarkers ? '地点を非表示' : '地点を表示'; const course = state.byId.get(state.selectedId); if (course && state.model) drawFeature(course, activeRoute(course), state.model, { fit: false }); });
  $('#close-detail').addEventListener('click', () => $('#detail-dialog').close());
  $('#detail-dialog').addEventListener('click', (event) => { if (event.target.id === 'detail-dialog') event.target.close(); });
  $('#theme-toggle').addEventListener('click', () => { state.theme = state.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  window.addEventListener('hashchange', handleHash);
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  $('#theme-toggle').setAttribute('aria-label', state.theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え');
  save(localKey.theme, state.theme);
}

function showLocation() {
  const output = $('#geo-status');
  if (!navigator.geolocation) { output.textContent = 'この端末では位置情報を利用できません。'; return; }
  output.textContent = '位置情報を確認中…';
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    output.textContent = '現在位置を地図に表示しました。位置は保存していません。';
    if (state.map) {
      state.locationLayer.clearLayers();
      L.circleMarker([coords.latitude, coords.longitude], { radius: 8, color: '#fff', weight: 3, fillColor: '#2b80bb', fillOpacity: 1 }).bindTooltip('現在位置（許可時のみ・経路上とは限りません）').addTo(state.locationLayer);
      showView('explore', { updateHash: false });
      state.map.setView([coords.latitude, coords.longitude], 15);
      $('#map-status').textContent = '現在位置を表示中・経路上とは限りません';
    }
  }, () => { output.textContent = '位置情報を取得できませんでした。手動進行はそのまま使えます。'; }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 });
}

async function init() {
  applyTheme(); wireEvents();
  try {
    const response = await fetch('data/catalog.json');
    if (!response.ok) throw new Error(`コースデータを取得できません (${response.status})`);
    const data = await response.json();
    if (!Array.isArray(data.courses) || data.courses.length !== 97) throw new Error('コース件数が想定と一致しません');
    state.courses = data.courses;
    state.byId = new Map(data.courses.map((course) => [course.id, course]));
    state.comparison = state.comparison.filter((id) => state.byId.has(id)).slice(0, 3);
    const series = new Map(data.courses.map((course) => [course.seriesId, course.seriesName]));
    $('#series-filter').insertAdjacentHTML('beforeend', [...series].map(([id, label]) => `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`).join(''));
    $('#walk-course').insertAdjacentHTML('beforeend', data.courses.map((course) => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.title)}</option>`).join(''));
    renderFeatured(); renderList(); renderCompare(); renderWalk(); initMap(); handleHash();
  } catch (error) {
    console.error('Atlas initialization failed', error);
    $('#featured').textContent = 'コースデータを読み込めませんでした。';
    $('#course-list').textContent = 'コースデータを読み込めませんでした。通信を確認して再読み込みしてください。';
    $('#result-count').textContent = '読み込みに失敗しました';
  }
}

init();
