const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const index = read('index.html');
const app = read('assets/js/app.js');
const gamesIndex = read('assets/js/games/index.js');
const registry = read('assets/js/shared/game-registry.js');
const impostorIntegration = read('assets/js/games/impostor/integration.js');
const bombIntegration = read('assets/js/games/ticking-bomb/integration.js');
const prototypesIntegration = read('assets/js/games/prototypes/integration.js');
const sw = read('sw.js');

for (const [name, source] of [
  ['app.js', app],
  ['games/index.js', gamesIndex],
  ['game-registry.js', registry],
  ['impostor/integration.js', impostorIntegration],
  ['ticking-bomb/integration.js', bombIntegration],
  ['prototypes/integration.js', prototypesIntegration]
]) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: source,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, `${name} nie przechodzi kontroli składni ES module:\n${result.stderr}`);
}

assert.match(index, /<script type="module" src="\.\/assets\/js\/app\.js\?v=2"><\/script>/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/shared\/game-registry\.js\?v=2"/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/games\/index\.js\?v=1"/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/shared\/game-registry\.js[^\"]*"[^>]*defer/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/games\/(?:impostor|ticking-bomb)\/integration\.js[^\"]*"[^>]*defer/);

assert.match(app, /from '\.\/shared\/game-registry\.js\?v=2'/);
assert.match(app, /from '\.\/games\/index\.js\?v=1'/);
assert.doesNotMatch(app, /games\/(?:impostor|ticking-bomb)\/integration/);
assert.match(app, /registerGameModules\(\);[\s\S]*await loadAppViews\(\)/);
assert.match(app, /getGameModule\(requestedGame\)/);

assert.match(gamesIndex, /from '\.\/impostor\/integration\.js\?v=2'/);
assert.match(gamesIndex, /from '\.\/ticking-bomb\/integration\.js\?v=2'/);
assert.match(gamesIndex, /from '\.\/prototypes\/integration\.js\?v=1'/);
assert.match(gamesIndex, /export function registerGameModules/);

assert.match(registry, /export function registerGameModule/);
assert.match(registry, /export function getGameModule/);
assert.match(registry, /export function getGameCatalog/);
assert.match(registry, /export function getGameScreenConfig/);
assert.match(registry, /export function getGameViewFragments/);
assert.match(registry, /Object\.assign\(window, legacyBridge\)/);

assert.match(impostorIntegration, /from '\.\.\/\.\.\/shared\/game-registry\.js\?v=2'/);
assert.match(impostorIntegration, /export function registerImpostorGame/);
assert.doesNotMatch(impostorIntegration, /^registerGameModule\(/m);

assert.match(bombIntegration, /from '\.\.\/\.\.\/shared\/game-registry\.js\?v=2'/);
assert.match(bombIntegration, /export function registerTickingBombGame/);
assert.doesNotMatch(bombIntegration, /^registerGameModule\(/m);

assert.match(prototypesIntegration, /export function registerPrototypeGames/);

assert.match(sw, /assets\/js\/shared\/game-registry\.js\?v=2/);
assert.match(sw, /assets\/js\/games\/index\.js\?v=1/);
assert.match(sw, /assets\/js\/games\/impostor\/integration\.js\?v=2/);
assert.match(sw, /assets\/js\/games\/ticking-bomb\/integration\.js\?v=2/);
assert.match(sw, /assets\/js\/games\/prototypes\/integration\.js\?v=1/);
assert.match(sw, /assets\/js\/app\.js\?v=2/);

console.log('ES module boundary and PWA module revision tests: OK');
