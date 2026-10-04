const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const registry = read('assets/js/shared/game-registry.js');
const app = read('assets/js/app.js');
const impostorIntegration = read('assets/js/games/impostor/integration.js');
const bombIntegration = read('assets/js/games/ticking-bomb/integration.js');
const naokoloIntegration = read('assets/js/games/naokolo/integration.js');
const cmmIntegration = read('assets/js/games/co-mam-na-mysli/integration.js');
const threeFiveIntegration = read('assets/js/games/trzy-w-piec/integration.js');
const syncIntegration = read('assets/js/games/synchronizacja/integration.js');
const impostorState = read('assets/js/games/impostor/state.js');

assert.match(registry, /GAME_SESSION_METHODS/);
['load', 'save', 'reset', 'hasResume', 'getPlayers'].forEach(method => {
  assert.match(registry, new RegExp(`['"]${method}['"]`), `Brakuje metody sesji ${method}`);
});
assert.match(registry, /function getGameSession/);
assert.match(registry, /function loadGameSessions/);
assert.match(registry, /function syncGameSessionUi/);
assert.match(registry, /function saveGameSession/);
assert.match(registry, /function resetGameSession/);
assert.match(registry, /function hasGameResume/);
assert.match(registry, /function getGamePlayers/);

for (const [source, methods] of [
  [impostorIntegration, ['loadSession', 'persistSession', 'resetImpostorSession']],
  [bombIntegration, ['loadBombSession', 'persistBombSession', 'resetBombSession']],
  [naokoloIntegration, ['loadNaokoloSession', 'persistNaokoloSession', 'resetNaokoloSession']],
  [cmmIntegration, ['loadCoMamNaMysliSession', 'persistCoMamNaMysliSession', 'resetCoMamNaMysliSession']],
  [threeFiveIntegration, ['loadThreeFiveSession', 'persistThreeFiveSession', 'resetThreeFiveSession']],
  [syncIntegration, ['loadSynchronizacjaSession', 'persistSynchronizacjaSession', 'resetSynchronizacjaSession']]
]) {
  assert.match(source, /session:\s*\{/);
  methods.forEach(method => assert.match(source, new RegExp(method)));
  assert.match(source, /hasResume:/);
  assert.match(source, /getPlayers:/);
}

assert.match(impostorState, /function resetImpostorSession/);
assert.match(app, /loadGameSessions\(\)/);
assert.match(app, /syncGameSessionUi\(\)/);
assert.doesNotMatch(app, /loadBombSession\(\)|loadNaokoloSession\(\)|loadCoMamNaMysliSession\(\)|loadThreeFiveSession\(\)|loadSynchronizacjaSession\(\)|loadSession\(\)/);
assert.doesNotMatch(app, /\bstate\.|\bbombState\.|\bnaokoloState\.|\bcoMamNaMysliState\.|\bthreeFiveState\.|\bsynchronizacjaState\./);

console.log('Shared game session interface tests: OK');
