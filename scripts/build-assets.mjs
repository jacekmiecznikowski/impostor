import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const vendor = path.join(root, 'assets', 'vendor');
const require = createRequire(import.meta.url);

await rm(vendor, { recursive: true, force: true });
await mkdir(vendor, { recursive: true });

const phaserDir = path.join(vendor, 'phaser');
await mkdir(phaserDir, { recursive: true });
await copyFile(path.join(root, 'node_modules', 'phaser', 'dist', 'phaser.min.js'), path.join(phaserDir, 'phaser.min.js'));

const fontAwesomeRoot = path.join(root, 'node_modules', '@fortawesome', 'fontawesome-free');
const fontAwesomeTarget = path.join(vendor, 'fontawesome');
await mkdir(path.join(fontAwesomeTarget, 'css'), { recursive: true });
await copyFile(path.join(fontAwesomeRoot, 'css', 'all.min.css'), path.join(fontAwesomeTarget, 'css', 'all.min.css'));
await cp(path.join(fontAwesomeRoot, 'webfonts'), path.join(fontAwesomeTarget, 'webfonts'), { recursive: true });

const interRoot = path.join(root, 'node_modules', '@fontsource', 'inter');
const interTarget = path.join(vendor, 'inter');
await mkdir(interTarget, { recursive: true });
await copyFile(path.join(interRoot, 'latin.css'), path.join(interTarget, 'latin.css'));
await cp(path.join(interRoot, 'files'), path.join(interTarget, 'files'), { recursive: true });

const tailwindCli = require.resolve('tailwindcss/lib/cli.js');
const tailwindResult = spawnSync(process.execPath, [
  tailwindCli,
  '-c', path.join(root, 'tailwind.config.cjs'),
  '-i', path.join(root, 'assets', 'css', 'tailwind-input.css'),
  '-o', path.join(vendor, 'tailwind.css'),
  '--minify'
], { cwd: root, stdio: 'inherit' });

if (tailwindResult.status !== 0) throw new Error('Nie udało się zbudować lokalnego Tailwinda.');
console.log('Built local runtime assets: Tailwind, Phaser, Font Awesome and Inter.');
