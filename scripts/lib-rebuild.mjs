// 本編コースの組み直し共通部品：OSMの名前付き地点を歩道へ寄せ、Valhalla歩行者でA/Bを計算する。
// 座標は OSM の実在ノード/ウェイのみ。距離合わせの延伸はしない。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePolyline } from '../tools/lib-polyline.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const rd = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
export const wr = (p, o) => fs.writeFileSync(path.join(root, p), JSON.stringify(o, null, 2));
export const P = (id, label, lat, lon, source) => ({ id, label, coord: [lat, lon], source });
export const WALKWAY = 'footway|path|pedestrian|living_street|residential|service|steps|tertiary|unclassified|track|cycleway|secondary|primary';
const rad = (n) => n * Math.PI / 180;
export const meters = (a, b) => { const q = Math.sin(rad(b[0] - a[0]) / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(rad(b[1] - a[1]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
export const lengthM = (p) => p.slice(1).reduce((s, v, i) => s + meters(p[i], v), 0);
export const repeatedM = (p) => { const e = new Map(); for (let i = 1; i < p.length; i++) { const a = p[i - 1].map((n) => n.toFixed(5)).join(','), b = p[i].map((n) => n.toFixed(5)).join(','); if (a === b) continue; const k = a < b ? a + '|' + b : b + '|' + a; const v = e.get(k) || { c: 0, l: meters(p[i - 1], p[i]) }; v.c++; e.set(k, v); } return [...e.values()].reduce((s, v) => s + Math.max(0, v.c - 1) * v.l, 0); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Overpass: 名前の正規表現で地点をまとめて取る（bbox 必須）。
export async function overpass(bbox, names) {
  const [s, w, n, e] = bbox;
  const q = `[out:json][timeout:90];(nwr["railway"~"^(station|halt|stop)$"](${s},${w},${n},${e});nwr["name"~"${names}"](${s},${w},${n},${e}););out center tags 400;`;
  let j;
  for (let i = 0; i < 4; i++) {
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) });
    if (res.ok) { j = await res.json(); break; }
    await wait(20000);
  }
  if (!j) throw new Error('Overpass failed');
  return j.elements.map((x) => { const c = x.center || x; const t = x.tags || {}; return { t: x.type[0], id: x.id, name: t.name || null, kind: t.railway || t.leisure || t.tourism || t.amenity || t.historic || null, lat: +c.lat.toFixed(5), lon: +c.lon.toFixed(5) }; }).filter((x) => x.name);
}

export async function buildCourse(spec) {
  const cache = path.join(root, `data/research/${spec.slug}-walkway-snap.json`);
  let known = fs.existsSync(cache) ? JSON.parse(fs.readFileSync(cache, 'utf8')) : {};
  const all = [...new Map(Object.values(spec.variants).flatMap((v) => v).map((p) => [p.id, p])).values()];
  const missing = all.filter((p) => !known[p.id]);
  if (missing.length) {
    const q = '[out:json][timeout:60];(' + missing.map((p) => `way(around:70,${p.coord[0]},${p.coord[1]})["highway"~"^(${WALKWAY})$"];`).join('') + ');out geom;';
    let res;
    for (let i = 0; i < 3; i++) { res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8', 'User-Agent': 'WalkingAtlasRouteResearch/1.0' }, body: new URLSearchParams({ data: q }) }); if (res.ok) break; await wait(20000); }
    if (!res.ok) throw new Error('Overpass ' + res.status);
    const ways = (await res.json()).elements.filter((e) => e.geometry);
    for (const p of missing) { let best = null; for (const w of ways) for (const v of w.geometry) { const d = meters(p.coord, [v.lat, v.lon]); if (d <= 70 && (!best || d < best.d)) best = { d, lat: v.lat, lon: v.lon, wayId: w.id }; } known[p.id] = best ? { snapped: [best.lat, best.lon], movedM: Math.round(best.d), wayId: best.wayId } : { snapped: null }; }
    fs.writeFileSync(cache, JSON.stringify(known, null, 1));
  }
  const snap = (list) => list.map((p) => (known[p.id]?.snapped ? { ...p, original: p.coord, coord: known[p.id].snapped } : p));
  const out = { calculatedAt: new Date().toISOString(), engine: 'valhalla-pedestrian', variants: {} };
  for (const [variant, points] of Object.entries(spec.variants)) {
    const pts = snap(points);
    const legs = [];
    for (let i = 0; i < pts.length - 1; i += 9) {
      const chunk = pts.slice(i, i + 10);
      const res = await fetch('https://valhalla1.openstreetmap.de/route', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Id': 'walking-atlas-route-research' }, body: JSON.stringify({ locations: chunk.map(({ coord }) => ({ lat: coord[0], lon: coord[1] })), costing: 'pedestrian', units: 'kilometers' }) });
      if (!res.ok) throw new Error('Valhalla ' + res.status);
      const json = await res.json();
      if (!json.trip?.legs?.length) throw new Error('Valhalla: ' + JSON.stringify(json).slice(0, 200));
      legs.push(...json.trip.legs); await wait(1200);
    }
    const shape = legs.flatMap((leg, i) => { const d = decodePolyline(leg.shape, 6); return i ? d.slice(1) : d; });
    const distanceM = lengthM(shape);
    const engineM = legs.reduce((s, l) => s + l.summary.length * 1000, 0);
    if (Math.abs(distanceM - engineM) > Math.max(30, distanceM * 0.02)) throw new Error(`${variant}: engine/shape distance mismatch`);
    const rep = repeatedM(shape);
    const offsets = pts.map((p) => Math.min(...shape.map((s) => meters(p.coord, s))));
    const geometryUrl = `data/routes/${spec.slug}-${variant}.geojson`;
    fs.writeFileSync(path.join(root, geometryUrl), JSON.stringify({ type: 'Feature', id: `${spec.courseId}-${variant}`, properties: { courseId: spec.courseId, routeVariant: variant, verificationStatus: 'routed', reviewNote: spec.reviewNote || 'Pins are OSM named points snapped to the nearest walkway; entrances need map review', engine: 'valhalla-pedestrian', calculatedAt: out.calculatedAt, distanceM: Math.round(distanceM), engineDistanceM: Math.round(engineM), repeatedGeometryM: Math.round(rep) }, geometry: { type: 'LineString', coordinates: shape.map(([lat, lon]) => [lon, lat]) } }));
    out.variants[variant] = { label: spec.labels?.[variant] || variant, distanceM: Math.round(distanceM), engineDistanceM: Math.round(engineM), repeatedGeometryM: Math.round(rep), repeatedGeometryPct: Number((rep / distanceM * 100).toFixed(1)), legKm: legs.map((l) => Math.round(l.summary.length * 100) / 100), geometryUrl, stops: pts.map((p, i) => ({ id: p.id, label: p.label, coord: p.coord, source: p.source, offsetM: Math.round(offsets[i]) })) };
    console.log(spec.courseId, variant, (distanceM / 1000).toFixed(2) + ' km', 'repeat ' + Math.round(rep) + ' m (' + out.variants[variant].repeatedGeometryPct + '%)', 'maxOffset ' + Math.round(Math.max(...offsets)) + ' m', out.variants[variant].legKm.join(' '));
  }
  wr(`data/research/${spec.slug}-route-build.json`, out);
  return out;
}
