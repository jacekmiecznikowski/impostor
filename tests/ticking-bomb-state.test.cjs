const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/ticking-bomb/state.js'), 'utf8');
const storage = new Map();
const storageKey = 'partyjniak.ticking-bomb.session.v1';

const sandbox = {
  console,
  Math,
  Date,
  BOMB_CATEGORIES: [
    { id: 'animals', name: 'Zwierzęta' },
    { id: 'food', name: 'Jedzenie' }
  ],
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  }
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const run = expression => vm.runInContext(expression, sandbox);
const snapshot = () => JSON.parse(run('JSON.stringify(bombState)'));

run('createBombPlayers(3, [])');
run("bombState.players[0].name = 'Ala'; bombState.players[1].name = 'Bartek'; bombState.players[2].name = 'Celina';");
run("bombState.mode = 'manual'; bombState.fusePreset = 'long'; bombState.activeCategories = ['animals']; bombState.roundNumber = 4;");
run('persistBombSession()');

const saved = JSON.parse(storage.get(storageKey));
assert.equal(saved.playerCount, 3);
assert.equal(saved.players.length, 3);
assert.equal(saved.players[0].name, 'Ala');
assert.equal(saved.mode, 'manual');
assert.equal(saved.fusePreset, 'long');
assert.deepEqual(saved.activeCategories, ['animals']);
assert.equal(saved.roundNumber, 4);
assert.equal(snapshot().hasSavedSession, true);

storage.set(storageKey, JSON.stringify({
  playerCount: 3,
  players: [
    { id: 'a', name: 'Ala', score: 2, losses: 1 },
    { id: 'b', name: 'Bartek', score: 4, losses: 0 },
    { id: 'c', name: 'Celina', score: 1, losses: 3 }
  ],
  mode: 'manual',
  fusePreset: 'quick',
  activeCategories: ['food', 'missing-category'],
  roundNumber: 7
}));
run('loadBombSession()');

const restored = snapshot();
assert.equal(restored.playerCount, 3);
assert.equal(restored.players[1].score, 4);
assert.equal(restored.players[2].losses, 3);
assert.equal(restored.mode, 'manual');
assert.equal(restored.fusePreset, 'short', 'legacy quick preset should migrate to short');
assert.deepEqual(restored.activeCategories, ['food']);
assert.equal(restored.roundNumber, 7);
assert.equal(restored.hasSavedSession, true);

// Symulacja świeżego startu aplikacji z uszkodzonym localStorage: stan pamięci
// nie może dziedziczyć kategorii z wcześniejszego scenariusza testowego.
storage.set(storageKey, '{invalid json');
run('bombState.activeCategories = []');
run('loadBombSession()');
const fallback = snapshot();
assert.equal(fallback.playerCount, 4);
assert.equal(fallback.players.length, 4);
assert.deepEqual(fallback.activeCategories, ['animals', 'food']);
assert.equal(fallback.hasSavedSession, false);

run("bombState.currentPrompt = 'TEST'; bombState.currentCategoryId = 'food'; bombState.lastLoserId = 'x'; bombState.manualLoserId = 'y';");
run('resetBombRoundState()');
const roundReset = snapshot();
assert.equal(roundReset.currentPrompt, null);
assert.equal(roundReset.currentCategoryId, null);
assert.equal(roundReset.lastLoserId, null);
assert.equal(roundReset.manualLoserId, null);

storage.set(storageKey, JSON.stringify({ playerCount: 2, players: [] }));
run('resetBombSession()');
const reset = snapshot();
assert.equal(storage.has(storageKey), false);
assert.equal(reset.playerCount, 4);
assert.equal(reset.players.length, 4);
assert.equal(reset.mode, 'tracked');
assert.equal(reset.fusePreset, 'unstable');
assert.deepEqual(reset.activeCategories, ['animals', 'food']);
assert.equal(reset.roundNumber, 0);
assert.equal(reset.hasSavedSession, false);

console.log('Ticking Bomb state behavior tests: OK');
