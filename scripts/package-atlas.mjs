import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'data');
const destination = path.join(root, 'atlas', 'data');
if (!fs.existsSync(path.join(root, 'atlas', 'index.html'))) throw new Error('atlas/index.html is missing');
fs.mkdirSync(path.join(destination, 'routes'), { recursive: true });
for (const file of ['catalog.json', 'route-audit.json']) fs.copyFileSync(path.join(source, file), path.join(destination, file));
const routes = fs.readdirSync(path.join(source, 'routes')).filter((file) => file.endsWith('.geojson'));
for (const file of routes) fs.copyFileSync(path.join(source, 'routes', file), path.join(destination, 'routes', file));
const bundled = fs.readdirSync(path.join(destination, 'routes')).filter((file) => file.endsWith('.geojson'));
if (bundled.length !== routes.length) throw new Error(`stale bundled route files: source=${routes.length}, bundle=${bundled.length}`);
const elevationSource = JSON.parse(fs.readFileSync(path.join(source, 'research', 'route-elevation.json'), 'utf8'));
fs.rmSync(path.join(destination, 'elevation'), { recursive: true, force: true });
fs.mkdirSync(path.join(destination, 'elevation'), { recursive: true });
for (const [slug, item] of Object.entries(elevationSource.routes)) {
  fs.writeFileSync(path.join(destination, 'elevation', `${slug}.json`), JSON.stringify({ source: 'gsi_dem5a', attribution: elevationSource._meta.source, sampleM: 10, totalM: item.totalM, status: item.status, grades: item.gradients }));
}
console.log(`Packaged Walking Atlas: ${routes.length} route shapes and ${Object.keys(elevationSource.routes).length} elevation grade files in atlas/data.`);
