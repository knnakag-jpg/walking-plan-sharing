// Builds a season (month 1-12) suitability matrix for every course.
//
// Inputs: var SERIES + card bodies from index.html, metrics from tools/elevation-out.json.
// Outputs: tools/seasons.json { meta, months:[1..12], courses:{ n:{name,seriesId,score:[12],notes:[12]} } }
//          tools/seasons-table.html (a <table> fragment only; legend/CSS is the UI owner's job).
//
// Decision rules (deterministic, documented):
//   0. Climate baseline for every month (stronger ratings win over this):
//        3,4,5,10,11,12 -> ◯
//        1,2  -> △ (cold; ◯ for indoor-heavy courses)
//        6,9  -> △ (rain, lingering heat; ◯ for indoor-heavy courses)
//        7,8  -> △ (heatstroke risk; × when ELEVATION climb_m>150 or META km>7;
//                ◯ for indoor-heavy courses)
//      Indoor-heavy = seriesId==='underground' or card kv contains 雨天：◎.
//   1. Card text matching 最適：10-11月/3-4月 (numbers or N-M ranges in the ~40 chars after
//      最適） -> those months ◎, adjacent months (+/-1, if still △) ◯.
//   2. Seasonal tags found in (course name + card body):
//        桜->[3,4] 梅->[2,3] 花火->[7,8] 紅葉|もみじ|いちょう|黄葉->[11,12]
//        クリスマス|イルミ->[12,1] 夏|残暑->[7,8]
//      -> those months are upgraded to at least ◯.
//   3. Explicit off-season (only downgrades a month still at △):
//        桜->[12,1,2] 梅->[6,7,8,9] 花火->[12,1,2,3] 紅葉|もみじ|いちょう|黄葉->[4,5,6]
//        クリスマス|イルミ->[6,7,8] -> ×.
//   4. Hills (override Jul/Aug): down_steep_km>0.5 or card grade D/F -> 7,8月 = ×.
//   5. 11/28 courses (n starts with 1128- or is G-1128): 11月 = ◎, 12月 = ◯.
//      G-Rain = ◯ all year (rain fallback).
// Rule priority: baseline < 1/2 (upgrades) ; 3 (downgrade from △ only) ; 4 (override) ; 5.
// S/E/Z series (solo/enso/zenkoku, outside Kanto) use the same baseline;
// ◎ comes only from explicit 最適期 tags (rule 1).
// New courses without cards yet are judged from their course name text alone.
import fs from 'node:fs';

const ROOT = new URL('./', import.meta.url);
const html = fs.readFileSync(new URL('../index.html', ROOT), 'utf8');
const elev = JSON.parse(fs.readFileSync(new URL('./elevation-out.json', ROOT), 'utf8'));

// ---- SERIES (same bracket-matching as tools/extract-series.mjs) ----
const startMarker = 'var SERIES = [';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) throw new Error('SERIES not found');
let i = startIdx + 'var SERIES = '.length, depth = 0, end = -1;
for (; i < html.length; i++) {
  const ch = html[i];
  if (ch === '[') depth++;
  else if (ch === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const SERIES = new Function('return ' + html.slice(startIdx + 'var SERIES = '.length, end) + ';')();

// ---- card bodies: h3 id="course-XXX" -> plain text ----
const cardRe = /<h3 id="course-([^"]+)">([\s\S]*?)(?=<div class="card">|<h3 id="course-|<\/div>\s*<!-- ===================== 1[45]|$)/g;
const cards = {};
let m;
while ((m = cardRe.exec(html))) {
  let key = m[1];
  if (/^\d+$/.test(key)) key = 'No.' + key; // course-7 -> No.7 ; S1/E1/Z1/G-1128/1128-D1/... stay as-is
  cards[key] = m[2].replace(/<[^>]+>/g, ' ');
}

// ---- rules ----
const TAG_MONTHS = [
  { re: /桜/, months: [3, 4], off: [12, 1, 2], label: '桜' },
  { re: /梅/, months: [2, 3], off: [6, 7, 8, 9], label: '梅' },
  { re: /花火/, months: [7, 8], off: [12, 1, 2, 3], label: '花火' },
  { re: /紅葉|もみじ|いちょう|黄葉/, months: [11, 12], off: [4, 5, 6], label: '紅葉' },
  { re: /クリスマス|イルミ/, months: [12, 1], off: [6, 7, 8], label: 'クリスマス・イルミ' },
  { re: /夏|残暑/, months: [7, 8], off: [], label: '夏' },
];
const INDOOR_RE = /屋内|地下|空調|アーケード|モール|ショッピング|デパート|百貨店/g;
// Place names that would false-positive the seasonal TAG_MONTHS rules below
// (e.g. 桜木町 is a station, not cherry blossoms). Masked from the tag-matching
// text only; card 最適/indoor rules still see the full text.
const PLACE_NAMES = [
  '桜木町', '桜田', '桜台', '桜丘', '桜ヶ丘', '桜が丘', '桜ケ丘', '桜新町', '桜上水',
  '紅葉坂', '紅葉ヶ丘', '紅葉が丘', '紅葉ケ丘', '紅葉台',
  '梅田', '梅ヶ丘', '梅が丘', '梅ケ丘', '梅屋敷', '梅島',
];
const maskPlaces = (s) => {
  let t = s;
  for (const p of PLACE_NAMES) t = t.split(p).join('□');
  return t;
};
const RANK = { '×': 0, '△': 1, '◯': 2, '◎': 3 };

// META (km/net) is embedded in index.html; parse it for the baseline heat rule.
function parseVarObject(src, marker) {
  const k = src.indexOf(marker);
  if (k === -1) throw new Error(marker + ' not found');
  let j = k + marker.length;
  while (src[j] !== '{') j++;
  let depth = 0, inStr = false, q = '', s = j;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (inStr) {
      if (ch === '\\') { j++; continue; }
      if (ch === q) inStr = false;
    } else if (ch === '"' || ch === "'") { inStr = true; q = ch; }
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) return JSON.parse(src.slice(s, j + 1)); }
  }
  throw new Error(marker + ' unbalanced');
}
const META = parseVarObject(html, 'var META =');
const isIndoor = (text, seriesId) => seriesId === 'underground' || /雨天：?\s*◎/.test(text);

function parseBestMonths(text) {
  const mm = text.match(/最適[：:]([^。\n<]{0,48})/);
  if (!mm) return null;
  const seg = mm[1];
  const months = new Set();
  seg.replace(/(\d{1,2})\s*[〜～\-―－]\s*(\d{1,2})/g, (_, a, b) => {
    let x = Number(a), y = Number(b);
    for (let k = 0; k < 12; k++) { if (x >= 1 && x <= 12) months.add(x); if (x === y) break; x = x % 12 + 1; }
    return '';
  });
  (seg.match(/\d{1,2}/g) || []).forEach((n) => { const v = Number(n); if (v >= 1 && v <= 12) months.add(v); });
  return { months: [...months], raw: mm[0].trim() };
}

const out = { meta: { generated: new Date().toISOString().slice(0, 10), rules: 'best-tag-offseason-indoor-heat' }, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], courses: {} };

for (const series of SERIES) {
  for (const c of series.courses) {
    const text = (c.name || '') + ' ' + (cards[c.n] || '');
    const score = Array(12).fill('△');
    const notes = Array(12).fill('特記なし');
    const set = (mi, grade, note) => {
      if (RANK[grade] > RANK[score[mi]]) { score[mi] = grade; notes[mi] = note; }
    };

    // rule 0: climate baseline
    const meta = META[c.n] || {};
    const km = (typeof meta.km === 'number') ? meta.km : null;
    const e = elev.courses[c.n];
    const climb = (e && e.ok === true && typeof e.climb_m === 'number') ? e.climb_m : 0;
    const indoor = isIndoor(text, series.id);
    for (let mo = 1; mo <= 12; mo++) {
      const mi = mo - 1;
      if ([3, 4, 5, 10, 11, 12].includes(mo)) {
        score[mi] = '◯'; notes[mi] = '気候ベースライン（春秋・初冬は適期）';
      } else if (mo === 1 || mo === 2) {
        if (indoor) { score[mi] = '◯'; notes[mi] = '屋内・地下が多く寒さに強い'; }
        else notes[mi] = '寒さのため△';
      } else if (mo === 6 || mo === 9) {
        if (indoor) { score[mi] = '◯'; notes[mi] = '屋内・地下動線が多く雨期向き'; }
        else notes[mi] = '雨・残暑のため△';
      } else { // 7, 8
        if (indoor) { score[mi] = '◯'; notes[mi] = '屋内・地下が多く暑さを避けられる'; }
        else if (climb > 150 || (km !== null && km > 7)) {
          score[mi] = '×';
          notes[mi] = `上り${climb}m・${km !== null ? km.toFixed(1) : '?'}kmのため暑熱で×`;
        } else notes[mi] = '熱中症リスクのため△';
      }
    }

    // rule 1: 最適
    const best = parseBestMonths(text);
    if (best && best.months.length) {
      for (const mo of best.months) set(mo - 1, '◎', `カード記載「${best.raw}」`);
      for (const mo of best.months) {
        for (const adj of [mo - 1, mo + 1]) {
          const a = ((adj + 11) % 12) + 1;
          if (score[a - 1] === '△') { score[a - 1] = '◯'; notes[a - 1] = `最適期（${best.raw}）の前後月`; }
        }
      }
    }
    // rules 2+3: seasonal tags (place names masked to avoid 地名 false-positives)
    const tagText = maskPlaces(text);
    for (const t of TAG_MONTHS) {
      if (!t.re.test(tagText)) continue;
      for (const mo of t.months) set(mo - 1, '◯', `${t.label}が見どころ`);
      for (const mo of t.off) {
        if (score[mo - 1] === '△') { score[mo - 1] = '×'; notes[mo - 1] = `${t.label}の季節外れ`; }
      }
    }
    // rule 4: hills (override Jul/Aug)
    const downSteep = (e && e.ok === true && typeof e.down_steep_km === 'number') ? e.down_steep_km : 0;
    const hardGrade = /難易度：?\s*[DF]/.test(text);
    if (downSteep > 0.5 || hardGrade) {
      for (const mo of [7, 8]) {
        score[mo - 1] = '×';
        notes[mo - 1] = downSteep > 0.5 ? `急下り${downSteep}kmのため暑熱で×` : '難易度D/Fのため暑熱で×';
      }
    }
    // rule 5: 11/28 courses + G-Rain
    if (/^1128-/.test(c.n) || c.n === 'G-1128') {
      set(10, '◎', '11/28実施想定の最適期');
      set(11, '◯', '11/28実施想定の前後月');
    }
    if (c.n === 'G-Rain') {
      for (let k = 0; k < 12; k++) set(k, '◯', '雨天フォールバック案のため通年◯');
    }
    out.courses[c.n] = { name: c.name, seriesId: series.id, score, notes };
  }
}

fs.writeFileSync(new URL('./seasons.json', ROOT), JSON.stringify(out, null, 2), 'utf8');

// ---- HTML fragment ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const lines = ['<table>', '  <thead>', '    <tr><th>コース</th>' + out.months.map((mo) => `<th>${mo}月</th>`).join('') + '</tr>', '  </thead>', '  <tbody>'];
for (const series of SERIES) {
  for (const c of series.courses) {
    const r = out.courses[c.n];
    const tds = r.score.map((g, k) => `<td class="c" title="${esc(r.notes[k])}"><span class="seas s${g}">${g}</span></td>`).join('');
    lines.push(`    <tr data-n="${esc(c.n)}"><td class="cname">${esc(c.name)}</td>${tds}</tr>`);
  }
}
lines.push('  </tbody>', '</table>');
fs.writeFileSync(new URL('./seasons-table.html', ROOT), lines.join('\n') + '\n', 'utf8');

const n = Object.keys(out.courses).length;
const rowCount = lines.filter((l) => l.startsWith('    <tr data-n=')).length;
console.log('seasons.json courses:', n);
console.log('seasons-table.html rows:', rowCount, 'closes table:', lines[lines.length - 1] === '</table>');

// ---- grouped view (5 seasons, static HTML, relative ranking) ----
// Season months: 春[3,4,5] 梅雨[6] 夏[7,8] 秋[9,10,11] 冬[12,1,2].
// seasonal = 0.5*max + 0.5*mean over the season months (◎=3/◯=2/△=1/×=0).
// Skip the season if any month is ×, except autumn/winter/spring skip only
// when max is under 1 (i.e. every month is ×).
// knee (0-5, from ELEVATION/META): 5 - min(2, down_steep_km*2)
//   - 1 if descent_m>150 - 1 if grade C, -2 if D/F (unknown = B) + 1 if net>=10.
// final = seasonal*10 + knee (+5 for indoor-heavy courses in 梅雨/夏).
// Per season: top 12 = おすすめ, next 15 = 候補, rest under もっと見る.
const stripNo = (cn) => String(cn).replace(/^No\./, '');
const jsq = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const isUp = (cn) => { const mt = META[cn] || {}; return typeof mt.net === 'number' && mt.net >= 10; };
const gradeOf = (cn) => {
  const m = ((cards[cn] || '').match(/難易度：?\s*([A-F])/) || [])[1];
  return m || 'B';
};
const kneeOf = (cn) => {
  const ev = elev.courses[cn] || {};
  const mt = META[cn] || {};
  const ds = (typeof ev.down_steep_km === 'number') ? ev.down_steep_km
    : (typeof mt.downSteep === 'number' ? mt.downSteep : 0);
  const desc = (typeof ev.descent_m === 'number') ? ev.descent_m
    : (typeof mt.descent === 'number' ? mt.descent : 0);
  const net = (typeof mt.net === 'number') ? mt.net : 0;
  const g = gradeOf(cn);
  const k = 5 - Math.min(2, ds * 2) - (desc > 150 ? 1 : 0)
    - (g === 'C' ? 1 : (g === 'D' || g === 'F' ? 2 : 0)) + (net >= 10 ? 1 : 0);
  return Math.max(0, Math.min(5, k));
};
const SEASONS_DEF = [
  { key: 'spring', label: '春（3〜5月）', months: [3, 4, 5], open: false },
  { key: 'rainy', label: '梅雨（6月）', months: [6], open: false },
  { key: 'summer', label: '夏（7〜8月）', months: [7, 8], open: false },
  { key: 'autumn', label: '秋（9〜11月）', months: [9, 10, 11], open: true },
  { key: 'winter', label: '冬（12〜2月）', months: [12, 1, 2], open: false },
];
const listed = new Set();
const gHtml = ['<!-- seasons-grouped: generated by tools/build-seasons.mjs, do not hand-edit -->', '<div class="seasons-groups" id="seasons-groups">'];
for (const sd of SEASONS_DEF) {
  gHtml.push(`<details class="seas-group"${sd.open ? ' open' : ''}>`);
  gHtml.push(`<summary>${esc(sd.label)}</summary>`);
  if (sd.key === 'autumn') {
    gHtml.push('<p class="seas-feature small">📅 <a href="#sec-22">11/28（土）特集：22. 11/28単日特集（1128-D1〜D5）へ</a></p>');
  }
  const all = [];
  for (const series of SERIES) {
    for (const c of series.courses) {
      const r = out.courses[c.n];
      const vals = sd.months.map((mo) => RANK[r.score[mo - 1]]);
      const strict = sd.key === 'rainy' || sd.key === 'summer';
      if (strict ? vals.includes(0) : Math.max(...vals) < 1) continue;
      const mx = Math.max(...vals);
      const mean = vals.reduce((a, v) => a + v, 0) / vals.length;
      const knee = kneeOf(c.n);
      let final = (0.5 * mx + 0.5 * mean) * 10 + knee;
      const body = (c.name || '') + ' ' + (cards[c.n] || '');
      if ((sd.key === 'rainy' || sd.key === 'summer') && isIndoor(body, series.id)) final += 5;
      all.push({ c, series, final, knee });
    }
  }
  all.sort((a, b) => b.final - a.final || b.knee - a.knee
    || String(a.c.n).localeCompare(String(b.c.n), 'ja'));
  const rec = all.slice(0, 12), cand = all.slice(12, 27), more = all.slice(27);
  const chip = (e) => {
    const r = out.courses[e.c.n];
    const meta = META[e.c.n] || {};
    const km = (typeof meta.km === 'number') ? ` <span class="seas-km">${meta.km.toFixed(1)}km</span>` : '';
    const up = (typeof meta.net === 'number' && meta.net >= 10) ? ' <span class="seas-badge up">⬆上り優先</span>' : '';
    const body = cards[e.c.n] || '';
    const rain = (e.series.id === 'underground' || /雨天：?\s*◎/.test(body)) ? ' <span class="seas-badge rain">☔</span>' : '';
    const sc = ` <span class="seas-score">${e.final.toFixed(1)}</span>`;
    listed.add(e.c.n);
    return `<li><button type="button" class="seas-chip" onclick="jumpToMap('${jsq(stripNo(e.c.n))}')" title="${esc(e.c.name)}">${esc(e.c.n)} ${esc(r.name || e.c.name)}${km}${up}${rain}${sc}</button></li>`;
  };
  const ul = (arr) => `<ul class="seas-chips">\n${arr.map(chip).join('\n')}\n</ul>`;
  gHtml.push(`<h4>おすすめ（${rec.length}件）</h4>`, rec.length ? ul(rec) : '<p class="small">該当なし</p>');
  gHtml.push(`<h4>候補（${cand.length}件）</h4>`, cand.length ? ul(cand) : '<p class="small">該当なし</p>');
  if (more.length) {
    gHtml.push(`<details class="seas-more"><summary>もっと見る（${more.length}件）</summary>\n${ul(more)}\n</details>`);
  }
  gHtml.push('</details>');
  console.log(`grouped ${sd.key}: おすすめ ${rec.length} / 候補 ${cand.length} / more ${more.length}`);
  if (sd.key === 'autumn') {
    for (const k of ['No.7', '1128-D4']) {
      const ix = all.findIndex((e) => e.c.n === k);
      console.log(`  autumn ${k}: rank ${ix === -1 ? 'excluded' : ix + 1} of ${all.length}`
        + (ix === -1 ? '' : ` final=${all[ix].final.toFixed(1)} rec=${ix < 12}`));
    }
  }
}
gHtml.push('</div>');
fs.writeFileSync(new URL('./seasons-grouped.html', ROOT), gHtml.join('\n') + '\n', 'utf8');

// ---- inject fragment into index.html (idempotent, allowed region only) ----
{
  const anchor = '<div id="seasons-wrap"';
  const ai = html.indexOf(anchor);
  if (ai === -1) throw new Error('seasons-wrap anchor not found');
  const sMark = '<!-- seasons-grouped:start -->', eMark = '<!-- seasons-grouped:end -->';
  const block = sMark + '\n' + gHtml.join('\n') + '\n' + eMark + '\n';
  let next;
  const si = html.indexOf(sMark);
  if (si === -1) {
    next = html.slice(0, ai) + block + html.slice(ai);
  } else {
    const ei = html.indexOf(eMark, si);
    if (ei === -1) throw new Error('seasons-grouped end marker missing');
    next = html.slice(0, si) + block + html.slice(ei + eMark.length + 1);
  }
  fs.writeFileSync(new URL('../index.html', ROOT), next, 'utf8');
  console.log('index.html grouped block:', si === -1 ? 'inserted' : 'replaced');
}
const unlisted = Object.keys(out.courses).filter((k) => !listed.has(k));
console.log('grouped unlisted (no season):', unlisted.length, unlisted.join(' '));
