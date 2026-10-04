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
const sw = read('sw.js');
const modules = [
  ['impostor', 'registerImpostorGame'], ['ticking-bomb', 'registerTickingBombGame'],
  ['naokolo', 'registerNaokoloGame'], ['co-mam-na-mysli', 'registerCoMamNaMysliGame'],
  ['trzy-w-piec', 'registerThreeFiveGame'], ['synchronizacja', 'registerSynchronizacjaGame'],
  ['trzy-rundy', 'registerTrzyRundyGame'], ['dzika-karta', 'registerDzikaKartaGame']
];
const sources = modules.map(([id, fn]) => [id, fn, read(`assets/js/games/${id}/integration.js`)]);

for (const [name, source] of [['app.js', app], ['games/index.js', gamesIndex], ['game-registry.js', registry], ...sources.map(([id,, source]) => [`${id}/integration.js`, source])]) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: source, encoding: 'utf8' });
  assert.equal(result.status, 0, `${name} syntax:\n${result.stderr}`);
}

assert.match(index, /app\.js\?v=9/);
assert.match(index, /games\/index\.js\?v=7/);
assert.match(app, /from '\.\/games\/index\.js\?v=7'/);
assert.match(app, /initializeGameModules/);
assert.doesNotMatch(app, /initializeImpostorRemoteContent|initializeTickingBombContent|initializeNaokoloContent|initializeCoMamNaMysliContent|initializeThreeFiveContent|initializeSynchronizacjaContent|initializeTrzyRundyContent|initializeDzikaKartaContent/);
assert.doesNotMatch(app, /games\/(?:impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy|dzika-karta)\/integration/);

for (const [id, fn, source] of sources) {
  assert.match(source, /from '\.\.\/\.\.\/shared\/game-registry\.js\?v=2'/);
  assert.match(source, new RegExp(`export function ${fn}`));
  assert.match(gamesIndex, new RegExp(fn));
}

assert.match(gamesIndex, /initializeImpostorRemoteContent/);
assert.match(gamesIndex, /initializeTickingBombContent/);
assert.match(gamesIndex, /initializeNaokoloContent/);
assert.doesNotMatch(gamesIndex, /prototypes\/integration/);
assert.match(registry, /export async function initializeGameModules/);
assert.match(registry, /Object\.assign\(window, legacyBridge\)/);
assert.equal(fs.existsSync(path.join(root, 'assets/js/games/prototypes/integration.js')), false);
assert.match(sw, /assets\/js\/games\/index\.js\?v=7/);
assert.match(sw, /assets\/js\/games\/dzika-karta\/integration\.js\?v=1/);
assert.match(sw, /assets\/js\/app\.js\?v=9/);
assert.doesNotMatch(sw, /prototypes\/integration/);

console.log('ES module boundary and module-driven bootstrap tests: OK');
