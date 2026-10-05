import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.resolve(root, process.argv[2] || 'dist');
const indexPath = path.join(publicRoot, 'index.html');
const index = await readFile(indexPath, 'utf8');

function fail(message) {
  throw new Error(`Web bundle verification failed: ${message}`);
}

if (!index.includes('data-partyjniak-runtime="inline"')) fail('critical runtime CSS is not inlined');
if (!index.includes('--partyjniak-runtime-bundle:ready')) fail('runtime bundle marker is missing');
if (!index.includes('Font Awesome 6 Free')) fail('Font Awesome CSS is missing from runtime bundle');
if (!index.includes('data:font/woff2;base64,')) fail('fonts are not embedded in runtime bundle');
if (!index.includes('.max-w-lg')) fail('Tailwind max-width utilities are missing');
if (!index.includes('.hidden')) fail('Tailwind hidden utility is missing');
if (index.includes('assets/vendor/')) fail('legacy assets/vendor dependency remains in packaged index');
if (!index.includes('./assets/js/phaser.min.js')) fail('local Phaser script path is missing');

const localReferences = [...index.matchAll(/(?:href|src)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g)]
  .map(match => match[1])
  .filter(reference => !reference.endsWith('/'));

for (const reference of new Set(localReferences)) {
  await access(path.join(publicRoot, reference.slice(2)));
}

console.log(`Verified packaged Partyjniak web bundle at ${publicRoot}.`);
