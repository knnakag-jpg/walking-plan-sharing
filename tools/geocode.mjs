// One-off Nominatim geocoding helper. Usage: node tools/geocode.mjs "query1" "query2" ...
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const queries = process.argv.slice(2);

async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=ja&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'walking-plan-sharing-route-fix/1.0 (kn.nakag@gmail.com)' } });
  const data = await res.json();
  return data[0] ? { lat: Number(data[0].lat), lon: Number(data[0].lon), display: data[0].display_name } : null;
}

for (const q of queries) {
  const r = await geocode(q);
  if (r) console.log(`${q}\t${r.lat.toFixed(5)}\t${r.lon.toFixed(5)}\t${r.display}`);
  else console.log(`${q}\tNOT FOUND`);
  await sleep(1100);
}
