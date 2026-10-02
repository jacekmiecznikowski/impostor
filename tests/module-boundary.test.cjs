const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const index = read('index.html');
const app = read('assets/js/app.js');
const registry = read('assets/js/shared/game-registry.js');
const impostorIntegration = read('assets/js/games/impostor/integration.js');
const bombIntegration = read('assets/js/games/ticking-bomb/integration.js');
const sw = read('sw.js');

assert.match(index, /<script type="module" src="\.\/assets\/js\/app\.js\?v=1"><\/script>/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/shared\/game-registry\.js\?v=1"/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/games\/impostor\/integration\.js\?v=1"/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/games\/ticking-bomb\/integration\.js\?v=1"/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/shared\/game-registry\.js[^\"]*"[^>]*defer/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/games\/impostor\/integration\.js[^\"]*"[^>]*defer/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/games\/ticking-bomb\/integration\.js[^\"]*"[^>]*defer/);

assert.match(app, /from '\.\/shared\/game-registry\.js\?v=1'/);
assert.match(app, /from '\.\/games\/impostor\/integration\.js\?v=1'/);
assert.match(app, /from '\.\/games\/ticking-bomb\/integration\.js\?v=1'/);
assert.match(app, /registerGameModules\(\);[\s\S]*await loadAppViews\(\)/);
assert.match(app, /getGameModule\(requestedGame\)/);

assert.match(registry, /export function registerGameModule/);
assert.match(registry, /export function getGameModule/);
assert.match(registry, /Object\.assign\(window, legacyBridge\)/);

assert.match(impostorIntegration, /import \{ getGameModule, registerGameModule \} from '\.\.\/\.\.\/shared\/game-registry\.js\?v=1'/);
assert.match(impostorIntegration, /export function registerImpostorGame/);
assert.doesNotMatch(impostorIntegration, /^registerGameModule\(/m);

assert.match(bombIntegration, /import \{ getGameModule, registerGameModule \} from '\.\.\/\.\.\/shared\/game-registry\.js\?v=1'/);
assert.match(bombIntegration, /export function registerTickingBombGame/);
assert.doesNotMatch(bombIntegration, /^registerGameModule\(/m);

assert.match(sw, /assets\/js\/shared\/game-registry\.js\?v=1/);
assert.match(sw, /assets\/js\/games\/impostor\/integration\.js\?v=1/);
assert.match(sw, /assets\/js\/games\/ticking-bomb\/integration\.js\?v=1/);
assert.match(sw, /assets\/js\/app\.js\?v=1/);

console.log('ES module boundary and PWA module revision tests: OK');
