// Reverse-geocodes every "added" point from tools/diff-report.json via Nominatim, so the
// itinerary text can name a real place instead of the stale "平坦周回で延伸" placeholder.
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=ja&zoom=17&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'walking-plan-sharing-route-fix/1.0 (kn.nakag@gmail.com)' } });
  const data = await res.json();
  return data;
}

async function main() {
  const results = JSON.parse(fs.readFileSync(new URL('./diff-report.json', import.meta.url), 'utf8'));
  const out = {};
  for (const r of results) {
    if (r.kind !== 'CHANGED' || !r.added || !r.added.length) continue;
    out[r.n] = [];
    for (const p of r.added) {
      try {
        const g = await reverseGeocode(p[0], p[1]);
        const addr = g.address || {};
        const name = g.name || addr.road || addr.leisure || addr.tourism || addr.amenity || addr.neighbourhood || addr.suburb || '';
        out[r.n].push({ pt: p, name, display: g.display_name });
        console.log(r.n, p[0], p[1], '->', name || '(no name)', '|', (g.display_name || '').slice(0, 60));
      } catch (e) {
        out[r.n].push({ pt: p, name: '', error: e.message });
        console.log(r.n, p[0], p[1], '-> ERROR', e.message);
      }
      await sleep(1100);
    }
  }
  fs.writeFileSync(new URL('./reverse-geocode-results.json', import.meta.url), JSON.stringify(out, null, 2), 'utf8');
}
main();
