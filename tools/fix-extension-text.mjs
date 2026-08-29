// Replaces the stale "平坦周回で延伸（V6・+0.8km）" placeholder — in both the 経路ノード prose
// line and the 旅程表 time-table row — with text that matches the ACTUAL rebuilt route:
// either a real place name + real round-trip km (mode: replace), or removed entirely if the
// final route needed no extension at all (mode: remove).
import fs from 'node:fs';

const htmlPath = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(htmlPath, 'utf8');
const plan = JSON.parse(fs.readFileSync(new URL('./extension-text-plan.json', import.meta.url), 'utf8'));

const cardRe = /<h3 id="course-([^"]+)">/g;
const cardStarts = [];
let m;
while ((m = cardRe.exec(html))) cardStarts.push({ id: m[1], idx: m.index });
cardStarts.push({ id: null, idx: html.length });

let changedRoute = 0, changedTable = 0, missing = [];

for (const num of Object.keys(plan)) {
  const cardId = num.replace('No.', '');
  const start = cardStarts.find((c) => c.id === cardId);
  if (!start) { missing.push(num); continue; }
  const startIdx = cardStarts.indexOf(start);
  const endIdx = cardStarts[startIdx + 1].idx;
  let segment = html.slice(start.idx, endIdx);
  const original = segment;
  const { mode, name, km } = plan[num];

  // 1) 経路ノード prose line (two historical placeholder phrasings)
  const routePhrases = ['<b>平坦周回で延伸（V6・+0.8km）</b> → ゴール', '<b>平坦周回で延伸（最大7km）</b> → ゴール'];
  for (const routePhrase of routePhrases) {
    if (segment.includes(routePhrase)) {
      const replacement = mode === 'remove'
        ? 'ゴール'
        : `<b>${name}方面へ実在の歩道で延伸（往復約${km}km）</b> → ゴール`;
      segment = segment.replace(routePhrase, replacement);
      changedRoute++;
    }
  }

  // 2) 旅程表 time-table row
  const rowRe = /<tr><td class="c">([\d:-]+)<\/td><td>平坦周回で延伸（舗装・V6）<\/td><td class="c">\+0\.8km<\/td><td>[^<]*<\/td><\/tr>/;
  const rowMatch = segment.match(rowRe);
  if (rowMatch) {
    const time = rowMatch[1];
    const newRow = mode === 'remove'
      ? '' // no real extension happened — drop the phantom row entirely
      : `<tr><td class="c">${time}</td><td>${name}方面へ延伸（実在の歩道・Valhalla歩行者ルートで検証済み）</td><td class="c">往復${km}km</td><td>延伸区間は実在の歩道・園路を往復。多目的トイレ・ベンチの有無は現地で確認。膝配慮のため登りは緩勾配のみ、下りはEV/迂回。</td></tr>`;
    segment = segment.replace(rowMatch[0], newRow);
    changedTable++;
  }

  if (segment !== original) {
    html = html.slice(0, start.idx) + segment + html.slice(endIdx);
    // re-anchor subsequent indices since length changed
    const delta = segment.length - original.length;
    for (let i = startIdx + 1; i < cardStarts.length; i++) cardStarts[i].idx += delta;
  }
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(`route-line fixed: ${changedRoute}, table-row fixed: ${changedTable}, missing cards: ${missing.join(',') || '(none)'}`);
