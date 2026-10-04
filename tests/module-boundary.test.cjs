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
const assetLoader = read('assets/js/shared/asset-loader.js');
const sw = read('sw.js');
const modules = [
  ['impostor', 'registerImpostorGame'], ['ticking-bomb', 'registerTickingBombGame'],
  ['naokolo', 'registerNaokoloGame'], ['co-mam-na-mysli', 'registerCoMamNaMysliGame'],
  ['trzy-w-piec', 'registerThreeFiveGame'], ['synchronizacja', 'registerSynchronizacjaGame'],
  ['trzy-rundy', 'registerTrzyRundyGame'], ['dzika-karta', 'registerDzikaKartaGame']
];
const sources = modules.map(([id, fn]) => [
  id,
  fn,
  read(`assets/js/games/${id}/integration.js`),
  read(`assets/js/games/${id}/bootstrap.js`)
]);

for (const [name, source] of [
  ['app.js', app], ['games/index.js', gamesIndex], ['game-registry.js', registry],
  ...sources.flatMap(([id,, integration, bootstrap]) => [
    [`${id}/integration.js`, integration],
    [`${id}/bootstrap.js`, bootstrap]
  ])
]) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: source, encoding: 'utf8' });
  assert.equal(result.status, 0, `${name} syntax:\n${result.stderr}`);
}

assert.match(index, /app\.js\?v=11/);
assert.match(index, /games\/index\.js\?v=9/);
assert.match(index, /shared\/asset-loader\.js/);
assert.doesNotMatch(index, /assets\/js\/games\/[^"']+\/(?:game|state|rules|setup|scoreboard)\.js/);
assert.doesNotMatch(index, /assets\/css\/(?:impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy|dzika-karta)[^"']*\.css/);

assert.match(app, /from '\.\/games\/index\.js\?v=9'/);
assert.match(app, /loadGameAssets/);
assert.match(app, /loadGameViews/);
assert.match(app, /initializeGameModule/);
assert.doesNotMatch(app, /loadGameSessions\(/);
assert.doesNotMatch(app, /initializeImpostorRemoteContent|initializeTickingBombContent|initializeNaokoloContent|initializeCoMamNaMysliContent|initializeThreeFiveContent|initializeSynchronizacjaContent|initializeTrzyRundyContent|initializeDzikaKartaContent/);

for (const [id, fn, integration, bootstrap] of sources) {
  assert.match(integration, /from '\.\.\/\.\.\/shared\/game-registry\.js\?v=2'/);
  assert.match(integration, new RegExp(`export function ${fn}`));
  assert.match(gamesIndex, new RegExp(`\.\/${id}\/bootstrap\\.js\\?v=1`));
  assert.match(bootstrap, /gameModule\.assets/);
  assert.match(bootstrap, /styles:/);
  assert.match(bootstrap, /scripts:/);
  assert.match(sw, new RegExp(`assets/js/games/${id}/bootstrap\\.js\\?v=1`));
}

assert.doesNotMatch(gamesIndex, /initializeImpostorRemoteContent|initializeTickingBombContent|initializeNaokoloContent/);
assert.doesNotMatch(gamesIndex, /prototypes\/integration/);
assert.match(registry, /Moduł gry „\$\{id\}” jest już zarejestrowany/);
assert.match(registry, /Ekran „\$\{screenName\}” jest już zarejestrowany/);
assert.match(registry, /export async function initializeGameModule/);
assert.match(registry, /Object\.assign\(window, legacyBridge\)/);
assert.match(assetLoader, /async function loadGameAssets/);
assert.equal(fs.existsSync(path.join(root, 'assets/js/games/prototypes/integration.js')), false);
assert.match(sw, /assets\/js\/games\/index\.js\?v=9/);
assert.match(sw, /assets\/js\/shared\/asset-loader\.js/);
assert.match(sw, /assets\/js\/app\.js\?v=11/);
assert.doesNotMatch(sw, /prototypes\/integration/);

console.log('ES module boundary and lazy game bootstrap tests: OK');
