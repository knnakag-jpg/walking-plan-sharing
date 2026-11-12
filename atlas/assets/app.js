const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const km = (meters) => `${(meters / 1000).toFixed(1)} km`;
const distanceLabel = (route) => Number.isFinite(route?.distanceM) ? km(route.distanceM) : '距離未確定';
const variantLabel = (variant) => ({ standard: 'A 標準', extended: 'B 延長', rainy: 'C 雨天', legacy: '旧経路' })[variant] || variant;
const statusText = (status) => ({ idea: 'アイデア', researched: '資料調査済み', routed: '経路計算済み・再調査待ち', map_reviewed: '地図レビュー済み', field_verified: '現地確認済み' })[status] || '確認状態不明';
const localKey = { favorites: 'walking-atlas-favorites-v1', compare: 'walking-atlas-compare-v1', theme: 'walking-atlas-theme-v1', walk: 'walking-atlas-walk-v1' };
const saved = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode still supports in-memory use */ } };
const state = { courses: [], byId: new Map(), view: 'discover', selectedId: null, variantById: {}, feature: null, routeCache: new Map(), map: null, routeLayer: null, markerLayer: null, locationLayer: null, routeAnimations: [], showMarkers: true, routeRequest: 0, favorites: new Set(saved(localKey.favorites, [])), comparison: saved(localKey.compare, []), walkProgress: saved(localKey.walk, {}), profile: 'solo', theme: saved(localKey.theme, 'light'), search: '', series: 'all', distance: 'all', favoritesOnly: false };
const activeRoute = (course) => course?.routeOptions?.find((route) => route.variant === (state.variantById[course.id] || course.defaultVariant)) || course?.route;
const routeWaypoints = (course, route) => route?.waypoints || course.waypoints;

function visibleCourses() {
  const query = state.search.trim().toLocaleLowerCase('ja');
  return state.courses.filter((course) => {
    if (state.series !== 'all' && course.seriesId !== state.series) return false;
    if (state.favoritesOnly && !state.favorites.has(course.id)) return false;
    const distance = activeRoute(course).distanceM;
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
  $('#course-list').innerHTML = courses.length ? courses.map((course) => { const route = activeRoute(course); return `<button type="button" class="course-card ${course.id === state.selectedId ? 'selected' : ''}" data-select="${escapeHtml(course.id)}" aria-pressed="${course.id === state.selectedId}"><span class="card-badge">${escapeHtml(variantLabel(route.variant))}</span><h3>${escapeHtml(course.title)}</h3><div class="card-meta"><span class="distance-pill">徒歩 ${distanceLabel(route)}</span><span>${escapeHtml(course.seriesName)}</span></div><p>${escapeHtml(course.summary)}</p></button>`; }).join('') : '<div class="empty-state">条件に合う候補はありません。絞り込みを変えてください。</div>';
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
  $('#variant-switch').innerHTML = course.routeOptions ? `${course.routeOptions.map((option) => `<button type="button" data-variant="${escapeHtml(option.variant)}" class="${option.variant === route.variant ? 'active' : ''}" aria-pressed="${option.variant === route.variant}">${escapeHtml(variantLabel(option.variant))}</button>`).join('')}<span class="variant-hint">A/Bは地図・現地レビュー待ち</span>` : '<span class="variant-hint">旧経路のみ・A/B/Cは再構築待ち</span>';
  $('#map-legend').innerHTML = route.variant === 'legacy' ? '<span><i class="legend-line legacy"></i>旧経路・再調査待ち</span><span><i class="legend-dot"></i>旧資料の経由点</span><span>距離は経路形状から計算</span>' : `<span>${escapeHtml(variantLabel(route.variant))}・${escapeHtml(statusText(route.verificationStatus))}</span><span>${route.geometryUrl ? '道路に沿う計算形状・現地未確認' : '徒歩線は未生成'}</span>`;
  const profileNote = state.profile === 'group' ? '歩行会：集合・解散、坂、休憩、トイレ、途中離脱の評価は未完了。' : '個人散歩：豊田駅からのアクセスと中央線への帰路は未調査。';
  $('#selected-summary').innerHTML = `<h2>${escapeHtml(course.title)}</h2><p>${escapeHtml(route.routeReason || course.summary)}</p><div class="selected-meta"><span class="status-label">${statusText(route.verificationStatus)}</span><span class="card-meta">徒歩 ${distanceLabel(route)} ${route.geometryUrl ? '／ 経路形状から計算' : '／ 調査中'}</span></div><p class="profile-note">${profileNote}</p><div class="selected-actions"><button type="button" data-action="detail" data-id="${escapeHtml(course.id)}">道の詳細</button><button type="button" data-action="favorite" data-id="${escapeHtml(course.id)}" aria-pressed="${state.favorites.has(course.id)}">${state.favorites.has(course.id) ? '保存済み ♥' : '保存 ♡'}</button><button type="button" data-action="compare" data-id="${escapeHtml(course.id)}" aria-pressed="${state.comparison.includes(course.id)}">${state.comparison.includes(course.id) ? '比較に追加済み' : '比較に追加 ＋'}</button><button type="button" data-action="walk" data-id="${escapeHtml(course.id)}">当日画面</button></div>`;
}

function initMap() {
  if (!window.L) { $('#map-fallback').hidden = false; $('#map-status').textContent = '地図ライブラリを読み込めません'; return; }
  try {
    state.map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([35.69, 139.76], 11);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    const tiles = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>' }).addTo(state.map);
    let tileErrors = 0;
    tiles.on('tileerror', () => { if (++tileErrors >= 4) { $('#map-fallback').hidden = false; $('#map-status').textContent = '背景地図を読み込めません'; } });
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

function stopRouteAnimation() {
  state.routeAnimations.forEach((animation) => { try { animation.finish(); } catch { animation.cancel(); } });
  state.routeAnimations = [];
}

function animateRoute() {
  stopRouteAnimation();
  if (!state.map || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    state.routeLayer.eachLayer((group) => group.eachLayer?.((layer) => {
      const path = layer._path;
      if (!path?.getTotalLength || !path.animate) return;
      const length = path.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) return;
      state.routeAnimations.push(path.animate([
        { strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
        { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
      ], { duration: 1050, easing: 'ease-in-out', fill: 'none' }));
    }));
  }));
}

function drawFeature(course, route, feature, { fit = true, animate = true } = {}) {
  if (!state.map) return;
  stopRouteAnimation();
  state.routeLayer.clearLayers();
  state.markerLayer.clearLayers();
  if (!feature) return;
  const geo = L.geoJSON(feature, { style: { color: route.variant === 'extended' ? '#b65d3e' : '#315f50', weight: 5, opacity: .92, dashArray: route.variant === 'legacy' ? '8 7' : route.variant === 'extended' ? '13 6' : null, lineCap: 'round' } }).addTo(state.routeLayer);
  const waypoints = routeWaypoints(course, route);
  if (state.showMarkers) waypoints.forEach((waypoint, index) => {
    const last = index === waypoints.length - 1;
    const marker = L.circleMarker([waypoint.point[1], waypoint.point[0]], { radius: index === 0 || last ? 7 : 5, color: '#fff', weight: 2, fillColor: index === 0 ? '#246c55' : last ? '#bf795e' : '#516c64', fillOpacity: 1 });
    marker.bindTooltip(waypoint.label || (index === 0 ? '旧経路の起点' : last ? '旧経路の終点' : `旧資料の経由点 ${index + 1}`));
    marker.addTo(state.markerLayer);
  });
  state.map.invalidateSize();
  const bounds = geo.getBounds();
  if (fit && bounds.isValid()) state.map.fitBounds(bounds.pad(.17), { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches, maxZoom: 15 });
  if (animate) animateRoute();
}

async function selectCourse(id, { updateHash = true } = {}) {
  const course = state.byId.get(id);
  if (!course) return;
  const route = activeRoute(course);
  state.selectedId = id;
  renderList(); renderSelected();
  if (updateHash) history.replaceState(null, '', `#${course.legacyAnchor}`);
  const request = ++state.routeRequest;
  $('#map-status').textContent = `${variantLabel(route.variant)}を読み込み中…`;
  try {
    const feature = await featureFor(route);
    if (request !== state.routeRequest) return;
    state.feature = feature;
    drawFeature(course, route, feature);
    $('#map-status').textContent = route.geometryUrl ? `${distanceLabel(route)}・${variantLabel(route.variant)}／地図・現地レビュー待ち` : `${variantLabel(route.variant)}・徒歩線未生成／屋内・鉄道の案を詳細に表示`;
  } catch (error) {
    if (request !== state.routeRequest) return;
    state.feature = null;
    state.routeLayer?.clearLayers(); state.markerLayer?.clearLayers();
    $('#map-status').textContent = error.message;
  }
}

function showView(view, { updateHash = true } = {}) {
  if (!['discover', 'explore', 'compare', 'walk'].includes(view)) return;
  state.view = view;
  $$('.view').forEach((section) => { section.hidden = section.id !== `view-${view}`; });
  $$('[data-view]').forEach((button) => { button.classList.toggle('is-active', button.dataset.view === view); if (button.tagName === 'BUTTON') button.setAttribute('aria-current', button.dataset.view === view ? 'page' : 'false'); });
  if (updateHash) history.replaceState(null, '', `#${view}`);
  if (view === 'explore') setTimeout(() => state.map?.invalidateSize(), 0);
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
  const scenic = route.variant !== 'legacy' && course.scenicSegments?.length ? `<h3>景観区間の候補</h3><ul class="detail-sources">${course.scenicSegments.map((item) => `<li><strong>${escapeHtml(item.name)}</strong>：${escapeHtml(item.theme)}<br><small>${escapeHtml(item.direction)} ／ ${escapeHtml(item.reviewStatus)} ／ 根拠：${escapeHtml(item.evidenceTitle)}</small></li>`).join('')}</ul>` : '';
  const unresolved = course.openQuestions?.length ? `<h3>未確認事項</h3><ul class="detail-sources">${course.openQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '';
  const variantButtons = course.routeOptions ? course.routeOptions.map((option) => `<button type="button" class="variant-chip ${route.variant === option.variant ? 'active' : ''}" data-variant="${escapeHtml(option.variant)}">${escapeHtml(variantLabel(option.variant))}</button>`).join('') : '<span class="variant-chip active">旧経路</span><span class="variant-chip unavailable">A/B/C 再構築待ち</span>';
  $('#detail-content').innerHTML = `<h2 id="detail-title">${escapeHtml(course.title)}</h2><div class="selected-meta"><span class="status-label">${statusText(route.verificationStatus)}</span><span class="card-meta">${escapeHtml(variantLabel(route.variant))} ／ 旧資料 ${escapeHtml(course.id)}</span></div><p>${escapeHtml(course.summary)}</p><div class="detail-grid"><div class="detail-box"><strong>徒歩距離</strong>${distanceLabel(route)}${route.geometryUrl ? '（経路形状から計算）' : '（未計測）'}${route.variant === 'legacy' ? `<br>旧カードの目標 ${km(route.targetDistanceM)}` : ''}</div><div class="detail-box"><strong>道路の重複</strong>${Number.isFinite(route.repeatedGeometryPct) ? `${route.repeatedGeometryPct}%（形状上の候補値）` : '道路エッジ照合待ち'}</div><div class="detail-box"><strong>個人散歩</strong>豊田駅からの鉄道アクセス・東京駅経由の帰宅は未調査</div><div class="detail-box"><strong>歩行会</strong>休憩・トイレ・段差・途中離脱は再確認が必要</div></div><h3>経路の種類</h3><div class="variant-row">${variantButtons}</div><h3>この道を選ぶ理由</h3><p class="detail-route-text">${escapeHtml(routeNote || '経路選定理由は未整理です。')}</p>${scenic}${segments}<h3>確認状態</h3><p>計算経路と資料調査の段階です。出入口、通行の安全性、現地での距離は未確認です。${route.variant === 'legacy' ? escapeHtml(flags) : '地図レビューと現地確認が必要です。'}</p>${unresolved}${sources}<p><a href="${escapeHtml(course.legacyUrl)}">旧ページの原資料を見る ↗</a></p>`;
  const dialog = $('#detail-dialog');
  if (!dialog.open) dialog.showModal();
}

function renderCompare() {
  const courses = state.comparison.map((id) => state.byId.get(id)).filter(Boolean);
  if (!courses.length) { $('#compare-content').innerHTML = '<div class="compare-empty"><strong>まだ比較するコースがありません。</strong><p>地図から候補を最大3件追加してください。</p><button class="outline-button" type="button" data-view="explore">地図から探す</button></div>'; return; }
  const cell = (fn) => courses.map((course) => `<td>${fn(course)}</td>`).join('');
  $('#compare-content').innerHTML = `<div class="compare-table-wrap"><table class="compare-table"><thead><tr><th scope="col">比較項目</th>${courses.map((course) => `<th scope="col">${escapeHtml(course.title)}<br><button type="button" data-remove-compare="${escapeHtml(course.id)}">比較から外す</button></th>`).join('')}</tr></thead><tbody><tr><td>経路の種類</td>${cell((c) => variantLabel(activeRoute(c).variant))}</tr><tr><td>徒歩距離</td>${cell((c) => `${distanceLabel(activeRoute(c))}<br><small>${activeRoute(c).geometryUrl ? '形状から計算' : '未計測'}</small>`)}</tr><tr><td>確認状態</td>${cell((c) => statusText(activeRoute(c).verificationStatus))}</tr><tr><td>上り／下り</td>${cell((c) => activeRoute(c).variant === 'legacy' && c.climbM != null ? `${c.climbM} m ／ ${c.descentM} m（旧計算値）` : '再計算待ち')}</tr><tr><td>一筆書き性</td>${cell((c) => Number.isFinite(activeRoute(c).repeatedGeometryPct) ? `${activeRoute(c).repeatedGeometryPct}%（形状上の候補値）` : '道路エッジ照合待ち')}</tr><tr><td>豊田駅からのアクセス</td>${cell(() => '未調査')}</tr><tr><td>雨天・休憩・トイレ</td>${cell(() => '未調査')}</tr><tr><td>景観の選定理由</td>${cell((c) => activeRoute(c).routeReason ? escapeHtml(activeRoute(c).routeReason) : '再調査待ち')}</tr></tbody></table></div><p class="walk-warning">候補の優劣は、道路と景観の調査が済むまで付けません。</p>`;
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
    return;
  }
  const waypoints = routeWaypoints(course, route);
  const progressId = `${course.id}-${route.variant}`;
  const index = Math.max(0, Math.min(waypoints.length - 1, Number(state.walkProgress[progressId] || 0)));
  const percent = waypoints.length > 1 ? index / (waypoints.length - 1) * 100 : 0;
  $('#walk-content').innerHTML = `<div class="walk-panel"><span class="status-label">${statusText(route.verificationStatus)}</span><h2>${escapeHtml(course.title)}・${escapeHtml(variantLabel(route.variant))}</h2><div class="walk-progress" role="progressbar" aria-valuenow="${index + 1}" aria-valuemin="1" aria-valuemax="${waypoints.length}" aria-label="経由点の進行状況"><span style="width:${percent}%"></span></div><p class="walk-next">${escapeHtml(waypoints[index].label || `旧資料の経由点 ${index + 1}`)} <small>${index + 1} / ${waypoints.length}</small></p><p>予定経由点の進行状況です。出入口と歩く道路は地図・現地レビュー待ちです。</p><div class="walk-controls"><button type="button" data-walk-step="-1" ${index === 0 ? 'disabled' : ''}>前の地点</button><button type="button" class="progress-button" data-walk-step="1" ${index === waypoints.length - 1 ? 'disabled' : ''}>この地点に着いた</button><button type="button" data-walk-reset="true">最初から</button><button type="button" data-location="true">現在位置を地図に表示</button></div><p id="geo-status" class="geo-status">位置情報は許可時だけ使い、保存しません。</p><ol class="waypoint-list">${waypoints.map((waypoint, i) => `<li class="${i === index ? 'current' : ''}">${escapeHtml(waypoint.label || `旧資料の経由点 ${i + 1}`)}</li>`).join('')}</ol><p class="walk-warning">この画面はナビゲーションではありません。残り距離・トイレ・離脱は未確認。通行状況と施設情報は当日確認してください。</p></div>`;
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
  $('#fit-route').addEventListener('click', () => { if (state.map && state.routeLayer.getLayers().length) state.map.fitBounds(state.routeLayer.getBounds?.() || state.routeLayer.getLayers()[0].getBounds(), { maxZoom: 15 }); });
  $('#replay-route').addEventListener('click', animateRoute);
  $('#show-route-now').addEventListener('click', stopRouteAnimation);
  $('#map-layer-toggle').addEventListener('click', () => { state.showMarkers = !state.showMarkers; $('#map-layer-toggle').setAttribute('aria-pressed', String(state.showMarkers)); $('#map-layer-toggle').textContent = state.showMarkers ? '地点を非表示' : '地点を表示'; const course = state.byId.get(state.selectedId); if (course && state.feature) drawFeature(course, activeRoute(course), state.feature, { fit: false, animate: false }); });
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
