// Extracts the stated target distance (km) for every course-NN card in index.html.
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const cardRe = /<h3 id="course-([^"]+)">([\s\S]*?)<\/h3>([\s\S]*?)(?=<div class="card">|<h3 id="course-|<\/div>\s*<!-- ===================== 1[45]|$)/g;

const targets = {};
let m;
while ((m = cardRe.exec(html))) {
  const id = m[1];
  const title = m[2];
  const body = m[3];
  let km = null;
  let mm = title.match(/約([\d.]+)(?:[〜～]([\d.]+))?km/);
  if (mm) km = mm[2] ? (Number(mm[1]) + Number(mm[2])) / 2 : Number(mm[1]);
  if (km == null) {
    mm = body.match(/歩行：<b>約([\d.]+)km/) || body.match(/距離：<b>約([\d.]+)km/) || body.match(/距離：約([\d.]+)km/);
    if (mm) km = Number(mm[1]);
  }
  if (km == null) {
    mm = body.match(/本更新で約([\d.]+)km/);
    if (mm) km = Number(mm[1]);
  }
  const key = id.startsWith('S') || id.startsWith('E') || id.startsWith('Z') ? id : 'No.' + id;
  targets[key] = km;
}

fs.writeFileSync(new URL('./targets.json', import.meta.url), JSON.stringify(targets, null, 2), 'utf8');
const missing = Object.entries(targets).filter(([k, v]) => v == null).map(([k]) => k);
console.log('Parsed', Object.keys(targets).length, 'cards. Missing distance:', missing.join(', ') || '(none)');
