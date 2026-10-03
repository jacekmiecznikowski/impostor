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
const naokoloIntegration = read('assets/js/games/naokolo/integration.js');
const cmmIntegration = read('assets/js/games/co-mam-na-mysli/integration.js');
const threeFiveIntegration = read('assets/js/games/trzy-w-piec/integration.js');
const prototypesIntegration = read('assets/js/games/prototypes/integration.js');
const sw = read('sw.js');

for (const [name, source] of [
  ['app.js', app], ['games/index.js', gamesIndex], ['game-registry.js', registry],
  ['impostor/integration.js', impostorIntegration], ['ticking-bomb/integration.js', bombIntegration],
  ['naokolo/integration.js', naokoloIntegration], ['co-mam-na-mysli/integration.js', cmmIntegration],
  ['trzy-w-piec/integration.js', threeFiveIntegration], ['prototypes/integration.js', prototypesIntegration]
]) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: source, encoding: 'utf8' });
  assert.equal(result.status, 0, `${name} nie przechodzi kontroli składni ES module:\n${result.stderr}`);
}

assert.match(index, /<script type="module" src="\.\/assets\/js\/app\.js\?v=6"><\/script>/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/shared\/game-registry\.js\?v=2"/);
assert.match(index, /rel="modulepreload" href="\.\/assets\/js\/games\/index\.js\?v=4"/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/shared\/game-registry\.js[^\"]*"[^>]*defer/);
assert.doesNotMatch(index, /<script[^>]+src="\.\/assets\/js\/games\/(?:impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec)\/integration\.js[^\"]*"[^>]*defer/);

assert.match(app, /from '\.\/shared\/game-registry\.js\?v=2'/);
assert.match(app, /from '\.\/games\/index\.js\?v=4'/);
assert.doesNotMatch(app, /initializeGameModules/);
assert.doesNotMatch(app, /games\/(?:impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec)\/integration/);
assert.match(app, /registerGameModules\(\);[\s\S]*await loadAppViews\(\)/);
assert.match(app, /initializeCoMamNaMysliContent/);
assert.match(app, /initializeThreeFiveContent/);

assert.match(gamesIndex, /from '\.\/impostor\/integration\.js\?v=2'/);
assert.match(gamesIndex, /from '\.\/ticking-bomb\/integration\.js\?v=2'/);
assert.match(gamesIndex, /from '\.\/naokolo\/integration\.js\?v=1'/);
assert.match(gamesIndex, /from '\.\/co-mam-na-mysli\/integration\.js\?v=1'/);
assert.match(gamesIndex, /from '\.\/trzy-w-piec\/integration\.js\?v=1'/);
assert.match(gamesIndex, /from '\.\/prototypes\/integration\.js\?v=3'/);
assert.match(gamesIndex, /registerCoMamNaMysliGame\(\)/);
assert.match(gamesIndex, /registerThreeFiveGame\(\)/);

assert.match(registry, /export function registerGameModule/);
assert.match(registry, /export function getGameScreenConfig/);
assert.match(registry, /Object\.assign\(window, legacyBridge\)/);

for (const [source, fn] of [
  [impostorIntegration, 'registerImpostorGame'], [bombIntegration, 'registerTickingBombGame'],
  [naokoloIntegration, 'registerNaokoloGame'], [cmmIntegration, 'registerCoMamNaMysliGame'],
  [threeFiveIntegration, 'registerThreeFiveGame']
]) {
  assert.match(source, /from '\.\.\/\.\.\/shared\/game-registry\.js\?v=2'/);
  assert.match(source, new RegExp(`export function ${fn}`));
  assert.doesNotMatch(source, /^registerGameModule\(/m);
}
assert.match(prototypesIntegration, /export function registerPrototypeGames/);

assert.match(sw, /assets\/js\/shared\/game-registry\.js\?v=2/);
assert.match(sw, /assets\/js\/games\/index\.js\?v=4/);
assert.match(sw, /assets\/js\/games\/co-mam-na-mysli\/integration\.js\?v=1/);
assert.match(sw, /assets\/js\/games\/trzy-w-piec\/integration\.js\?v=1/);
assert.match(sw, /assets\/js\/games\/prototypes\/integration\.js\?v=3/);
assert.match(sw, /assets\/js\/app\.js\?v=6/);

console.log('ES module boundary and PWA module revision tests: OK');
