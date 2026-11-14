import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.geojson': 'application/geo+json; charset=utf-8' };
const port = Number(process.argv[2] || 8765);
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${port}`).pathname);
  const relative = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const absolute = path.resolve(root, `.${relative}`);
  if (!(absolute === root || absolute.startsWith(root + path.sep))) { response.writeHead(403).end(); return; }
  fs.readFile(absolute, (error, body) => {
    if (error) { response.writeHead(error.code === 'ENOENT' ? 404 : 500).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(absolute)] || 'application/octet-stream', 'Cache-Control': 'no-store' }).end(body);
  });
}).listen(port, '127.0.0.1', () => console.log(`Local preview: http://127.0.0.1:${port}/`));
