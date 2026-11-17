// Per-route elevation profiles from the GSI elevation tiles (DEM5A PNG).
//
// The saved route shapes carry no elevation, and tools/elevation-out.json is a
// different waypoint series (legacy engine output), so it cannot be laid over the
// shapes that are actually drawn. This script samples the DEM at points along each
// drawn shape instead, and stores the smoothed series next to the route.
//
// Source: 地理院タイル（標高タイル（基盤地図情報数値標高モデル））を加工して作成
//   https://maps.gsi.go.jp/development/ichiran.html
// Decode (https://maps.gsi.go.jp/development/demtile.html):
//   x = 2^16 R + 2^8 G + B ; x < 2^23: h = x*0.01 ; x = 2^23: NA ; x > 2^23: h = (x - 2^24)*0.01
//   Invalid pixels are (R,G,B) = (128,0,0), i.e. exactly x = 2^23.
//
// PNG pixels are read through Windows PowerShell + System.Drawing (no npm package
// is available in this repo). Tiles are cached under tools/.dem-cache/.
//
// Usage:
//   node scripts/build-route-elevation.mjs            # all routes, resumes by cache
//   node scripts/build-route-elevation.mjs --only=no-17,no-11
//   node scripts/build-route-elevation.mjs --verify   # check output coverage only

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PATH = path.join(root, 'data/research/route-elevation.json');
const TILE_CACHE = path.join(root, 'tools/.dem-cache');
const TILE_ZOOM = 15; // DEM5A (5m mesh) maximum zoom
const SAMPLE_INTERVAL_M = 10;
const META = {
  source: '国土地理院 地理院タイル（標高タイル（基盤地図情報数値標高モデル））dem5a_png z15 を加工して作成',
  sourceUrl: 'https://maps.gsi.go.jp/development/ichiran.html',
  samplingM: SAMPLE_INTERVAL_M,
  smoothing: 'median3+ma5 on elevation; grade = signed percent over a 30m window per 10m part',
  script: 'scripts/build-route-elevation.mjs',
};

const argv = process.argv.slice(2);
const VERIFY_ONLY = argv.includes('--verify');
const onlyArg = argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean)) : null;

const rad = (v) => v * Math.PI / 180;
function meters(a, b) {
  const dLat = rad(b[1] - a[1]); const dLon = rad(b[0] - a[0]);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 12742000 * Math.asin(Math.sqrt(q));
}

// lon/lat -> DEM tile x/y and pixel inside the tile.
function demTile(lon, lat, z) {
  const n = 2 ** z;
  const xf = (lon + 180) / 360 * n;
  const latRad = rad(lat);
  const yf = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  const tx = Math.floor(xf); const ty = Math.floor(yf);
  const px = Math.min(255, Math.max(0, Math.floor((xf - tx) * 256)));
  const py = Math.min(255, Math.max(0, Math.floor((yf - ty) * 256)));
  return { z, tx, ty, px, py };
}

async function fetchTile({ z, tx, ty }) {
  fs.mkdirSync(TILE_CACHE, { recursive: true });
  const safe = path.join(TILE_CACHE, `${z}_${tx}_${ty}.png`);
  const failMarker = path.join(TILE_CACHE, `${z}_${tx}_${ty}.fail`);
  if (fs.existsSync(failMarker)) return { error: 'previous fetch failed' };
  if (!fs.existsSync(safe)) {
    const url = `https://cyberjapandata.gsi.go.jp/xyz/dem5a_png/${z}/${tx}/${ty}.png`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      if (body.length < 8 || body.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
      fs.writeFileSync(safe, body);
    } catch (error) {
      fs.writeFileSync(failMarker, error.message); // remember the miss, never invent a value
      return { error: error.message };
    }
    await new Promise((resolve) => setTimeout(resolve, 350)); // stay polite to the public tile server
  }
  return { file: safe };
}

// Read one pixel per request through PowerShell, returned in request order.
// Each tile is opened once however many samples fall in it, and the request list goes
// through a temp file because Windows limits command lines to ~32k characters.
// (An earlier version keyed results by tile file, so every sample in a tile read the
// same pixel; results are now positional and checked for that.)
function readPixels(requests) {
  if (!requests.length) return [];
  const specFile = path.join(os.tmpdir(), `dem-spec-${process.pid}.txt`);
  fs.writeFileSync(specFile, requests.map((r) => `${r.file}|${r.px}|${r.py}`).join('\n'));
  const script = [
    'Add-Type -AssemblyName System.Drawing',
    '$bitmaps = @{}',
    '$out = New-Object System.Collections.Generic.List[string]',
    `foreach ($line in [System.IO.File]::ReadAllLines('${specFile}')) {`,
    '  $p = $line.Split("|")',
    '  try {',
    '    if (-not $bitmaps.ContainsKey($p[0])) { $bitmaps[$p[0]] = [System.Drawing.Bitmap]::FromFile($p[0]) }',
    '    $c = $bitmaps[$p[0]].GetPixel([int]$p[1], [int]$p[2])',
    '    $out.Add("$($c.R),$($c.G),$($c.B)")',
    '  } catch { $out.Add("ERR") }',
    '}',
    'foreach ($b in $bitmaps.Values) { $b.Dispose() }',
    '$out -join ";"',
  ].join('\n');
  try {
    const result = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    const values = result.trim().split(';');
    if (values.length !== requests.length) throw new Error(`pixel read returned ${values.length} values for ${requests.length} requests`);
    return values;
  } finally { fs.rmSync(specFile, { force: true }); }
}

function decodeElevation(rgb) {
  if (!rgb || rgb === 'ERR') return null;
  const [r, g, b] = rgb.split(',').map(Number);
  const x = r * 65536 + g * 256 + b;
  if (x === 2 ** 23) return null; // NA pixel
  return (x < 2 ** 23 ? x : x - 2 ** 24) * 0.01;
}

function smooth(z) {
  const n = z.length;
  const med = z.map((v, i) => {
    const w = [z[Math.max(0, i - 1)], v, z[Math.min(n - 1, i + 1)]].slice().sort((a, b) => a - b);
    return w[1];
  });
  return med.map((_, i) => {
    let s = 0; let c = 0;
    for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < n) { s += med[j]; c++; } }
    return s / c;
  });
}

function samplePoints(coordinates, cumulative, totalM) {
  const out = [];
  let i = 1;
  for (let atM = 0; atM <= totalM; atM += SAMPLE_INTERVAL_M) {
    while (i < cumulative.length - 1 && cumulative[i] < atM) i++;
    const a = coordinates[i - 1]; const b = coordinates[i];
    const span = cumulative[i] - cumulative[i - 1] || 1;
    const f = Math.max(0, Math.min(1, (atM - cumulative[i - 1]) / span));
    out.push([a[0] + f * (b[0] - a[0]), a[1] + f * (b[1] - a[1]), Math.round(atM)]);
  }
  if (out.at(-1)[2] !== Math.round(totalM)) out.push([coordinates.at(-1)[0], coordinates.at(-1)[1], Math.round(totalM)]);
  return out;
}

function courses() {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));
  const rows = [];
  for (const course of catalog.courses) {
    for (const route of course.routeOptions || [course.route]) {
      if (!route.geometryUrl) continue;
      const slug = path.basename(route.geometryUrl, '.geojson');
      if (ONLY && !ONLY.has(slug)) continue;
      rows.push({ courseId: course.id, routeId: route.id, variant: route.variant, slug, geometryUrl: route.geometryUrl });
    }
  }
  // 新しく組み直した curated の経路は、catalog に載る前でも標高を計算できるようにする。
  const curatedRoot = path.join(root, 'data/curated');
  if (fs.existsSync(curatedRoot)) for (const name of fs.readdirSync(curatedRoot).filter((n) => n.endsWith('.json'))) {
    const curated = JSON.parse(fs.readFileSync(path.join(curatedRoot, name), 'utf8'));
    const build = JSON.parse(fs.readFileSync(path.join(root, curated.buildFile), 'utf8'));
    const list = build.results || Object.entries(build.variants).map(([variant, value]) => ({ variant, ...value }));
    for (const item of list) {
      if (!item.geometryUrl) continue;
      const slug = path.basename(item.geometryUrl, '.geojson');
      if (ONLY && !ONLY.has(slug)) continue;
      if (rows.some((row) => row.slug === slug)) continue;
      rows.push({ courseId: curated.id, routeId: `${slug}`, variant: item.variant, slug, geometryUrl: item.geometryUrl });
    }
  }
  const personalRoot = path.join(root, 'data/personal');
  if (fs.existsSync(personalRoot)) for (const name of fs.readdirSync(personalRoot).filter((n) => n.endsWith('.json'))) {
    const spec = JSON.parse(fs.readFileSync(path.join(personalRoot, name), 'utf8'));
    const slug = path.basename(spec.geometryUrl, '.geojson');
    if (ONLY && !ONLY.has(slug)) continue;
    rows.push({ courseId: spec.id, routeId: `${spec.slug}-personal`, variant: 'personal', slug, geometryUrl: spec.geometryUrl });
  }
  return rows;
}

function summaryFor(profile, coordinates, cumulative) {
  const total = cumulative.at(-1);
  let climb = 0; let descent = 0;
  let min = Infinity; let max = -Infinity;
  for (let i = 0; i < profile.length; i++) {
    const z = profile[i].z;
    if (z < min) min = z; if (z > max) max = z;
    if (!i) continue;
    const dz = z - profile[i - 1].z;
    if (dz > 0) climb += dz; else descent -= dz;
  }
  let steepUp = 0; let steepDown = 0;
  for (let i = 1; i < profile.length; i++) {
    const dM = profile[i].d - profile[i - 1].d;
    if (dM <= 0) continue;
    const grade = (profile[i].z - profile[i - 1].z) / dM * 100;
    if (grade >= 5) steepUp += dM; else if (grade <= -5) steepDown += dM;
  }
  return {
    sampleM: SAMPLE_INTERVAL_M, totalM: Math.round(total),
    climbM: Math.round(climb * 10) / 10, descentM: Math.round(descent * 10) / 10,
    minM: Math.round(min * 10) / 10, maxM: Math.round(max * 10) / 10,
    steepUpM: Math.round(steepUp), steepDownM: Math.round(steepDown),
  };
}

// Signed gradient (percent, + = uphill) for each 10m part of the line, for the map's
// up = red / down = blue fade. The grade is measured over a 30m window centred on the
// part (the repo's own tools/build-elevation.mjs uses 3% as "up/down" and 8% as
// "steep"), so single-sample DEM noise does not paint a stripe. Parts that touch a
// span with no DEM reading are 0 so an unknown stretch is never coloured as a slope.
function gradePercents(profile, unknownRuns = []) {
  const unknown = new Set();
  for (const [from, to] of unknownRuns) for (let i = from; i <= to; i++) unknown.add(i);
  const last = profile.length - 1;
  return profile.slice(1).map((point, i) => {
    const lo = Math.max(0, i - 1); const hi = Math.min(last, i + 2);
    for (let k = lo; k <= hi; k++) if (unknown.has(k)) return 0;
    const dM = profile[hi].d - profile[lo].d;
    if (dM <= 0) return 0;
    return Math.round((profile[hi].z - profile[lo].z) / dM * 1000) / 10;
  });
}

async function buildOne(row) {
  const feature = JSON.parse(fs.readFileSync(path.join(root, row.geometryUrl), 'utf8'));
  const coordinates = feature.geometry.coordinates;
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) cumulative.push(cumulative[i - 1] + meters(coordinates[i - 1], coordinates[i]));
  const totalM = cumulative.at(-1);
  const samples = samplePoints(coordinates, cumulative, totalM);
  const tiles = samples.map(([lon, lat]) => demTile(lon, lat, TILE_ZOOM));
  const unique = [...new Map(tiles.map((tile) => [`${tile.tx}_${tile.ty}`, tile])).values()];
  const downloads = await Promise.all(unique.map(async (tile) => ({ tile, result: await fetchTile(tile) })));
  const available = new Set(downloads.filter((item) => item.result.file).map((item) => `${item.tile.tx}_${item.tile.ty}`));
  // One request per sample, in sample order. Samples whose tile is missing are never
  // requested; they stay null and are reported as unknown (never invented).
  const requests = []; const requestIndex = [];
  tiles.forEach((tile, index) => {
    if (!available.has(`${tile.tx}_${tile.ty}`)) return;
    requests.push({ file: path.join(TILE_CACHE, `${tile.z}_${tile.tx}_${tile.ty}.png`), px: tile.px, py: tile.py });
    requestIndex.push(index);
  });
  const pixelValues = readPixels(requests);
  const raw = samples.map(() => null);
  requestIndex.forEach((sampleIndex, i) => { raw[sampleIndex] = decodeElevation(pixelValues[i]); });
  // Guard the exact bug this replaced: a route that crosses several pixels cannot be
  // one constant value per tile, so a long route with only a handful of distinct
  // readings means the reader is collapsing samples again.
  const readings = raw.filter((z) => z != null);
  const distinct = new Set(readings.map((z) => z.toFixed(2))).size;
  if (readings.length > 60 && distinct < Math.min(12, readings.length / 20)) throw new Error(`${row.slug}: only ${distinct} distinct DEM readings for ${readings.length} samples`);
  // Gaps (NA / missing tiles) are carried over from the nearest known sample along
  // the line; if nothing at all is known the route is stored as unavailable.
  // Long interpolated spans are elevation-unknown water/coastal areas (e.g. a ferry
  // leg, the Nakanoshima Ohashi seafront), so they are never coloured as a slope:
  // the gradient is forced to 0 there rather than smearing a neighbour's hill.
  const known = raw.map((z, i) => (z == null ? null : i)).filter((i) => i != null);
  if (!known.length) return { status: 'no_dem', profile: [], gradients: [] };
  const filled = raw.map((z, i) => {
    if (z != null) return z;
    const before = [...known].reverse().find((k) => k < i);
    const after = known.find((k) => k > i);
    if (before != null && after != null) return raw[before] + (raw[after] - raw[before]) * ((i - before) / (after - before));
    return raw[before ?? after];
  });
  const zs = smooth(filled);
  const profile = zs.map((z, i) => ({ d: samples[i][2], z: Math.round(z * 10) / 10 }));
  // Runs of samples with no DEM reading, recorded so the map can leave them uncoloured.
  const unknownRuns = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] != null) continue;
    let j = i; while (j + 1 < raw.length && raw[j + 1] == null) j++;
    unknownRuns.push([i, j]); i = j;
  }
  const gradients = gradePercents(profile, unknownRuns);
  const summary = summaryFor(profile, coordinates, cumulative);
  const naCount = raw.filter((z) => z == null).length;
  return {
    status: naCount ? 'partial_dem_filled' : 'dem',
    naSamples: naCount,
    unknownRuns,
    ...summary,
    profile,
    gradients,
  };
}

async function main() {
  const rows = courses();
  if (VERIFY_ONLY) {
    if (!fs.existsSync(OUT_PATH)) { console.error('route-elevation.json not found'); process.exit(1); }
    const data = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    const gaps = rows.filter((row) => !data.routes[row.slug]?.profile?.length);
    console.log(`Elevation verify: ${rows.length - gaps.length}/${rows.length} route shapes with profiles${gaps.length ? ` (missing: ${gaps.map((row) => row.slug).join(', ')})` : ''}`);
    if (gaps.length) process.exit(1);
    return;
  }
  const existing = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, 'utf8')) : { routes: {} };
  for (const row of rows) {
    const current = existing.routes[row.slug];
    if (current?.profile?.length && current?.gradients?.length && !ONLY) continue;
    const result = await buildOne(row);
    existing.routes[row.slug] = { courseId: row.courseId, variant: row.variant, geometry: row.geometryUrl, ...result };
    fs.writeFileSync(OUT_PATH, JSON.stringify(existing));
    console.log(`${row.slug}: ${result.status} ${result.profile.length} samples${result.status === 'dem' || result.status === 'partial_dem_filled' ? `, ${result.minM}–${result.maxM} m, climb ${result.climbM} / descent ${result.descentM} m` : ''}`);
  }
  existing._meta = META;
  fs.writeFileSync(OUT_PATH, JSON.stringify(existing)); // compact: ~66k grade numbers
  console.log(`Wrote ${Object.keys(existing.routes).length} elevation profiles to ${path.relative(root, OUT_PATH)}`);
}

export { demTile, readPixels, decodeElevation };
if (process.argv[1] && process.argv[1].endsWith("build-route-elevation.mjs")) main().catch((error) => { console.error(error); process.exit(1); });
