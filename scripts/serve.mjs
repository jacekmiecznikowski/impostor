import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || '0.0.0.0';

const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.mp3', 'audio/mpeg'],
  ['.woff2', 'font/woff2'],
  ['.txt', 'text/plain; charset=utf-8']
]);

const cleanupServiceWorker = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('partyjniak-')).map(key => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map(client => client.navigate(client.url)));
  })());
});
`;

function sendText(response, statusCode, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': type,
    'Cache-Control': 'no-store, max-age=0',
    'Pragma': 'no-cache'
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method || 'GET')) {
    sendText(response, 405, 'Method Not Allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`).pathname);
  } catch {
    sendText(response, 400, 'Bad Request');
    return;
  }

  // Local development must never be controlled by the production PWA cache.
  // If an older build already registered a worker, serving this cleanup worker
  // causes the next registration/update check to remove it and clear Partyjniak caches.
  if (pathname === '/sw.js') {
    sendText(response, 200, cleanupServiceWorker, 'text/javascript; charset=utf-8');
    return;
  }

  let filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    let fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      fileStat = await stat(filePath);
    }
    if (!fileStat.isFile()) throw new Error('Not a file');

    const type = MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
    response.writeHead(200, {
      'Content-Type': type,
      'Content-Length': fileStat.size,
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache'
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(filePath).pipe(response);
  } catch {
    sendText(response, 404, 'Not Found');
  }
});

server.listen(port, host, () => {
  console.log(`Partyjniak dev server: http://localhost:${port}`);
  console.log('Runtime assets are served with cache disabled; production Service Worker is disabled for this dev server.');
});
