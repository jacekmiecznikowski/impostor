const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const registry = read('assets/js/shared/game-registry.js');
const app = read('assets/js/app.js');

assert.match(registry, /GAME_SESSION_METHODS/);
['load', 'save', 'reset', 'hasResume', 'getPlayers'].forEach(method => {
  assert.match(registry, new RegExp(`['"]${method}['"]`));
});

const entries = [
  ['impostor', ['loadSession', 'persistSession', 'resetImpostorSession']],
  ['ticking-bomb', ['loadBombSession', 'persistBombSession', 'resetBombSession']],
  ['naokolo', ['loadNaokoloSession', 'persistNaokoloSession', 'resetNaokoloSession']],
  ['co-mam-na-mysli', ['loadCoMamNaMysliSession', 'persistCoMamNaMysliSession', 'resetCoMamNaMysliSession']],
  ['trzy-w-piec', ['loadThreeFiveSession', 'persistThreeFiveSession', 'resetThreeFiveSession']],
  ['synchronizacja', ['loadSynchronizacjaSession', 'persistSynchronizacjaSession', 'resetSynchronizacjaSession']],
  ['trzy-rundy', ['loadTrzyRundySession', 'persistTrzyRundySession', 'resetTrzyRundySession']],
  ['dzika-karta', ['loadDzikaKartaSession', 'persistDzikaKartaSession', 'resetDzikaKartaSession']]
];

for (const [id, methods] of entries) {
  const source = read(`assets/js/games/${id}/integration.js`);
  assert.match(source, /session:\s*\{/);
  methods.forEach(method => assert.match(source, new RegExp(method)));
  assert.match(source, /hasResume:/);
  assert.match(source, /getPlayers:/);
}

assert.match(app, /gameModule\.session\?\.load\?\.\(\)/);
assert.match(app, /syncGameSessionUi\(gameModule\)/);
assert.doesNotMatch(app, /loadGameSessions\(\)/);
assert.doesNotMatch(app, /loadBombSession\(\)|loadNaokoloSession\(\)|loadCoMamNaMysliSession\(\)|loadThreeFiveSession\(\)|loadSynchronizacjaSession\(\)|loadTrzyRundySession\(\)|loadDzikaKartaSession\(\)|loadSession\(\)/);
assert.doesNotMatch(app, /\bstate\.|\bbombState\.|\bnaokoloState\.|\bcoMamNaMysliState\.|\bthreeFiveState\.|\bsynchronizacjaState\.|\btrzyRundyState\.|\bdzikaKartaState\./);

console.log('Shared lazy game session interface tests: OK');
