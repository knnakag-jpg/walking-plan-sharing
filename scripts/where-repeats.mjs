// Prints where a candidate GeoJSON line repeats geometry (cumulative metres, coordinates).
import fs from 'node:fs';
const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const pts = g.geometry.coordinates;
const rad = (n) => n * Math.PI / 180;
const m = (a, b) => { const q = Math.sin(rad(b[1] - a[1]) / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(rad(b[0] - a[0]) / 2) ** 2; return 12742000 * Math.asin(Math.sqrt(q)); };
const k = (p) => p[0].toFixed(5) + ',' + p[1].toFixed(5);
const seen = new Map(); let cum = 0; const rep = [];
for (let i = 1; i < pts.length; i++) {
  const a = k(pts[i - 1]), b = k(pts[i]); const l = m(pts[i - 1], pts[i]); cum += l;
  if (a === b) continue;
  const key = a < b ? a + '|' + b : b + '|' + a;
  if (seen.has(key)) rep.push({ i, cum: Math.round(cum), l, first: seen.get(key), p: pts[i] }); else seen.set(key, Math.round(cum));
}
const grp = [];
for (const r of rep) { const last = grp[grp.length - 1]; if (last && r.i - last.end <= 2) { last.end = r.i; last.len += r.l; last.to = r.p; } else grp.push({ start: r.i, end: r.i, len: r.l, from: r.p, to: r.p, cum: r.cum, first: r.first }); }
for (const x of grp) console.log('len ' + Math.round(x.len) + 'm at ' + x.cum + 'm (first pass ' + x.first + 'm) lat/lon ' + x.from[1].toFixed(5) + ',' + x.from[0].toFixed(5) + ' -> ' + x.to[1].toFixed(5) + ',' + x.to[0].toFixed(5));
