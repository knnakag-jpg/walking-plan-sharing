// Extracts `var SERIES = [...]` from index.html into tools/waypoints-raw.json
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const startMarker = 'var SERIES = [';
const startIdx = html.indexOf(startMarker);
if (startIdx === -1) throw new Error('SERIES not found');
// find matching closing "];" for the array by bracket counting from startIdx+ "var SERIES = "
let i = startIdx + 'var SERIES = '.length;
let depth = 0, end = -1;
for (; i < html.length; i++) {
  const ch = html[i];
  if (ch === '[') depth++;
  else if (ch === ']') { depth--; if (depth === 0) { end = i + 1; break; } }
}
if (end === -1) throw new Error('could not find end of SERIES array');
const arrLiteral = html.slice(startIdx + 'var SERIES = '.length, end);

// eslint-disable-next-line no-new-func
const SERIES = new Function('return ' + arrLiteral + ';')();

fs.writeFileSync(new URL('./waypoints-raw.json', import.meta.url), JSON.stringify(SERIES, null, 2), 'utf8');
console.log('Extracted', SERIES.length, 'series,', SERIES.reduce((a,s)=>a+s.courses.length,0), 'courses');
