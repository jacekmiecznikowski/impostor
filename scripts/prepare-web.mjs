import { cp, mkdir, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function requirePath(relativePath, label = relativePath) {
  const resolved = path.join(root, relativePath);
  if (!existsSync(resolved)) throw new Error(`Brakuje ${label}. Uruchom npm install przed buildem.`);
  return resolved;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ['index.html', 'manifest.webmanifest', 'sw.js']) {
  const source = path.join(root, file);
  if (existsSync(source)) await copyFile(source, path.join(dist, file));
}

for (const directory of ['assets', 'views', 'content']) {
  const source = path.join(root, directory);
  if (existsSync(source)) await cp(source, path.join(dist, directory), { recursive: true });
}

const vendorRoot = path.join(dist, 'assets', 'vendor');
await mkdir(vendorRoot, { recursive: true });

await copyFile(
  requirePath('node_modules/phaser/dist/phaser.min.js', 'lokalnego Phasera'),
  path.join(vendorRoot, 'phaser.min.js')
);

const fontAwesomeRoot = path.join(vendorRoot, 'fontawesome');
await mkdir(path.join(fontAwesomeRoot, 'css'), { recursive: true });
await copyFile(
  requirePath('node_modules/@fortawesome/fontawesome-free/css/all.min.css', 'lokalnego Font Awesome'),
  path.join(fontAwesomeRoot, 'css', 'all.min.css')
);
await cp(
  requirePath('node_modules/@fortawesome/fontawesome-free/webfonts', 'webfontów Font Awesome'),
  path.join(fontAwesomeRoot, 'webfonts'),
  { recursive: true }
);

const tailwindCli = requirePath('node_modules/tailwindcss/lib/cli.js', 'lokalnego kompilatora Tailwind');
await execFileAsync(process.execPath, [
  tailwindCli,
  '-c', path.join(root, 'tailwind.config.cjs'),
  '-i', path.join(root, 'assets/css/tailwind-source.css'),
  '-o', path.join(vendorRoot, 'tailwind.css'),
  '--minify'
], { cwd: root });

console.log('Prepared fully local Capacitor web bundle in dist/.');
