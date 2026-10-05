import { cp, mkdir, readFile, rm, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const runtimeCssPath = path.join(root, 'assets', 'css', 'runtime.css');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const sourceIndex = await readFile(path.join(root, 'index.html'), 'utf8');
const runtimeCss = await readFile(runtimeCssPath, 'utf8');
const runtimeLink = '<link rel="stylesheet" href="./assets/css/runtime.css">';
if (!sourceIndex.includes(runtimeLink)) throw new Error('Brakuje runtime.css w index.html.');

const androidIndex = sourceIndex.replace(
  runtimeLink,
  `<style data-partyjniak-runtime="inline">${runtimeCss}</style>`
);
await writeFile(path.join(dist, 'index.html'), androidIndex, 'utf8');

for (const file of ['manifest.webmanifest', 'sw.js']) {
  const source = path.join(root, file);
  if (existsSync(source)) await copyFile(source, path.join(dist, file));
}

for (const directory of ['assets', 'views', 'content']) {
  const source = path.join(root, directory);
  if (existsSync(source)) await cp(source, path.join(dist, directory), { recursive: true });
}

console.log('Prepared Capacitor web bundle in dist/ with self-contained critical runtime CSS.');
