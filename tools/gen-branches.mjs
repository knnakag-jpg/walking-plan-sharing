// Embeds A/B branch data (tools/branches/plan.json) into index.html.
//
// - Generates one deterministic line `var BRANCHES = {...};` before `var ROUTE_GEOM`,
//   replacing the existing line if present (idempotent).
// - Inserts one `.branch-switch` + `.branch-note` block into each of the 9 target
//   cards (skipped when already present, so re-runs are no-ops).
// - Uses plan.json values only; no numbers are invented here.
//
// Usage:
//   node tools/gen-branches.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePolyline, decodePolyline } from './lib-polyline.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.dirname(here);
const planPath = path.join(here, 'branches', 'plan.json');
const htmlPath = path.join(root, 'index.html');

// plan.json key order is kept.
const IDS = ['G-1128', 'No.43', 'S7', 'No.58', 'No.9', 'No.34', 'No.18', '1128-D2', 'G-Rain'];
// h3 anchor suffix per course (card heading id is `course-<suffix>`).
const H3 = { 'G-1128': 'G-1128', 'No.43': '43', 'S7': 'S7', 'No.58': '58', 'No.9': '9', 'No.34': '34', 'No.18': '18', '1128-D2': '1128-D2', 'G-Rain': 'G-Rain' };
// Insertion anchor: cards with <h4>旅程</h4> use it; others use the route-node block;
// No.9 has neither, so the block goes right after its .kv line.
const ANCHOR = {
  'G-1128': '<h4>旅程</h4>', 'No.18': '<h4>旅程</h4>', '1128-D2': '<h4>旅程</h4>', 'G-Rain': '<h4>旅程</h4>',
  'No.43': '<div class="route">', 'S7': '<div class="route">', 'No.58': '<div class="route">', 'No.34': '<div class="route">',
  'No.9': 'AFTER_KV',
};
const DEFAULT = Object.fromEntries(IDS.map((id) => [id, id === 'G-1128' ? 'A' : 'B']));

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function km1(v) {
  return '約' + Number(v).toFixed(1) + 'km';
}
function numsLine(e) {
  return '距離 ' + km1(e.km) + '・上り ' + Math.round(e.climb) + 'm・下り ' + Math.round(e.desc) + 'm'
    + '・戻り率 ' + e.overlap + '%・急な下り ' + Number(e.steepDown).toFixed(1) + 'km';
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
const branches = {};
for (const id of IDS) {
  if (!plan[id] || !plan[id].A || !plan[id].B) throw new Error('plan.json lacks A/B for ' + id);
  branches[id] = {};
  for (const br of ['A', 'B']) {
    const e = plan[id][br];
    // plan shape = base64(JSON([[lat,lon],...])); the map needs an encoded polyline (precision 6).
    const coords = JSON.parse(Buffer.from(e.shape, 'base64').toString('utf8'));
    const shape = encodePolyline(coords, 6);
    // Round-trip sanity: same point count back through the page's decoder.
    const back = decodePolyline(shape, 6);
    if (back.length !== coords.length) throw new Error('polyline round-trip mismatch for ' + id + br);
    const profile = JSON.parse(Buffer.from(e.profileEnc, 'base64').toString('utf8'));
    if (!Array.isArray(profile) || !profile.length) throw new Error('empty profile for ' + id + br);
    branches[id][br] = {
      label: e.label, why: e.why, km: e.km, climb: e.climb, desc: e.desc,
      overlap: e.overlap, steepDown: e.steepDown, shape, profile,
    };
  }
}

let html = fs.readFileSync(htmlPath, 'utf8');

// 1. BRANCHES line (replace if present, else insert before var ROUTE_GEOM).
const line = '  var BRANCHES = ' + JSON.stringify(branches).replace(/</g, '\\u003c') + ';';
if (html.includes('var BRANCHES = ')) {
  html = html.replace(/^  var BRANCHES = .*?;$/m, () => line);
} else {
  const marker = '  var ROUTE_GEOM = ';
  const at = html.indexOf(marker);
  if (at < 0) throw new Error('var ROUTE_GEOM line not found');
  html = html.slice(0, at) + line + '\n' + html.slice(at);
}

// 2. Card switch blocks (skip cards that already have one).
for (const id of IDS) {
  if (html.includes('data-course="' + id + '"')) continue;
  const dflt = DEFAULT[id];
  const btn = (br) => '    <button type="button" class="branch-btn' + (br === dflt ? ' on' : '')
    + '" data-branch="' + br + '" aria-pressed="' + (br === dflt ? 'true' : 'false') + '">' + br + '案</button>';
  const de = branches[id][dflt];
  const block = '<div class="branch-switch" data-course="' + id + '" data-default="' + dflt + '">\n'
    + '    <span class="branch-title">経路分岐：</span>\n'
    + btn('A') + '\n' + btn('B') + '\n'
    + '  </div>\n'
    + '  <div class="branch-note" data-course="' + id + '"><b>' + esc(de.label) + '</b><br>' + esc(de.why)
    + '<br><span class="branch-nums">' + esc(numsLine(de)) + '</span></div>\n';
  const h3 = '<h3 id="course-' + H3[id] + '"';
  const h3at = html.indexOf(h3);
  if (h3at < 0) throw new Error('card heading not found for ' + id);
  const anchor = ANCHOR[id];
  if (anchor === 'AFTER_KV') {
    const kvAt = html.indexOf('<div class="kv">', h3at);
    if (kvAt < 0) throw new Error('kv not found for ' + id);
    const kvEnd = html.indexOf('</div>', kvAt) + '</div>'.length;
    const indent = '  ';
    html = html.slice(0, kvEnd) + '\n' + indent + block.trimEnd() + html.slice(kvEnd);
  } else {
    const aAt = html.indexOf(anchor, h3at);
    if (aAt < 0) throw new Error('anchor ' + anchor + ' not found for ' + id);
    const lineStart = html.lastIndexOf('\n', aAt) + 1;
    const indent = html.slice(lineStart, aAt).match(/^\s*/)[0];
    html = html.slice(0, lineStart) + indent + block + html.slice(lineStart);
  }
}

fs.writeFileSync(htmlPath, html);
const total = Buffer.byteLength(html, 'utf8');
console.log('BRANCHES embedded: ' + IDS.length + ' courses x A/B, index.html ' + (total / 1048576).toFixed(2) + 'MB');
if (total > 3 * 1048576) {
  console.error('index.html exceeds 3MB');
  process.exit(1);
}
