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
const impostorState = read('assets/js/games/impostor/state.js');

assert.match(registry, /GAME_SESSION_METHODS/);
['load', 'save', 'reset', 'hasResume', 'getPlayers'].forEach(method => {
  assert.match(registry, new RegExp(`['"]${method}['"]`), `Brakuje metody sesji ${method}`);
});
assert.match(registry, /function getGameSession/);
assert.match(registry, /function getActiveGameSession/);
assert.match(registry, /function loadGameSessions/);
assert.match(registry, /function syncGameSessionUi/);
assert.match(registry, /function saveGameSession/);
assert.match(registry, /function resetGameSession/);
assert.match(registry, /function hasGameResume/);
assert.match(registry, /function getGamePlayers/);

assert.match(impostorIntegration, /session:\s*\{/);
assert.match(impostorIntegration, /load:\s*\(\) => loadSession\(\)/);
assert.match(impostorIntegration, /save:\s*\(\) => persistSession\(\)/);
assert.match(impostorIntegration, /reset:\s*\(\) => resetImpostorSession\(\)/);
assert.match(impostorIntegration, /hasResume:\s*\(\) => hasSavedSession\(\)/);
assert.match(impostorIntegration, /getPlayers:\s*\(\) => state\.players/);

assert.match(bombIntegration, /session:\s*\{/);
assert.match(bombIntegration, /load:\s*\(\) => loadBombSession\(\)/);
assert.match(bombIntegration, /save:\s*\(\) => persistBombSession\(\)/);
assert.match(bombIntegration, /reset:\s*\(\) => resetBombSession\(\)/);
assert.match(bombIntegration, /hasResume:/);
assert.match(bombIntegration, /getPlayers:\s*\(\) => bombState\.players/);

assert.match(naokoloIntegration, /session:\s*\{/);
assert.match(naokoloIntegration, /load:\s*\(\) => loadNaokoloSession\(\)/);
assert.match(naokoloIntegration, /save:\s*\(\) => persistNaokoloSession\(\)/);
assert.match(naokoloIntegration, /reset:\s*\(\) => resetNaokoloSession\(\)/);
assert.match(naokoloIntegration, /hasResume:/);
assert.match(naokoloIntegration, /getPlayers:\s*\(\) => naokoloState\.players/);

assert.match(impostorState, /function resetImpostorSession/);
assert.match(impostorState, /hasGameResume\('impostor'\)/);
assert.match(app, /loadGameSessions\(\)/);
assert.match(app, /syncGameSessionUi\(\)/);
assert.doesNotMatch(app, /loadBombSession\(\)|loadNaokoloSession\(\)|loadSession\(\)/);
assert.doesNotMatch(app, /\bstate\.|\bbombState\.|\bnaokoloState\./);

console.log('Shared game session interface tests: OK');
