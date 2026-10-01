import { cp, mkdir, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ['index.html', 'manifest.webmanifest', 'sw.js']) {
  const source = path.join(root, file);
  if (existsSync(source)) await copyFile(source, path.join(dist, file));
}

for (const directory of ['assets', 'views']) {
  const source = path.join(root, directory);
  if (existsSync(source)) await cp(source, path.join(dist, directory), { recursive: true });
}

console.log('Prepared Capacitor web bundle in dist/.');
