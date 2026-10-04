const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SynchronizacjaRules = require('../assets/js/games/synchronizacja/rules.js');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/synchronizacja/state.js'), 'utf8');
const store = new Map();
const sandbox = {
  console,
  SynchronizacjaRules,
  SYNCHRONIZACJA_CATEGORIES: [{ id: 'a' }, { id: 'b' }],
  clampPlayerSetupCount(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
  },
  resizePlayerSetupRoster(players, count, createPlayer) {
    return Array.from({ length: count }, (_, index) => players[index] ? { ...players[index] } : createPlayer(index));
  },
  updateSynchronizacjaResumeButton() {},
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__syncStateTest = { synchronizacjaState, createSynchronizacjaPlayers, persistSynchronizacjaSession, loadSynchronizacjaSession, resetSynchronizacjaSession, resetSynchronizacjaMatchScores };`, sandbox);

const api = sandbox.__syncStateTest;
api.createSynchronizacjaPlayers(3, []);
api.synchronizacjaState.players[0].name = 'Ala';
api.synchronizacjaState.players[0].score = 7;
api.synchronizacjaState.players[0].turns = 3;
api.synchronizacjaState.activeCategories = ['b'];
api.synchronizacjaState.currentPlayerIndex = 2;
api.synchronizacjaState.turnNumber = 5;
api.synchronizacjaState.completedRounds = 1;
api.synchronizacjaState.roundResults = { 'sync-player-1': 4, 'sync-player-2': 2 };
api.synchronizacjaState.recentScaleIds = ['b-1'];
api.synchronizacjaState.awaitingRoundDecision = true;
api.persistSynchronizacjaSession();
assert.equal(store.has('partyjniak.synchronizacja.session.v1'), true);

api.synchronizacjaState.players = [];
api.loadSynchronizacjaSession();
assert.equal(api.synchronizacjaState.players.length, 3);
assert.equal(api.synchronizacjaState.players[0].name, 'Ala');
assert.equal(api.synchronizacjaState.players[0].score, 7);
assert.equal(api.synchronizacjaState.players[0].turns, 3);
assert.deepEqual(Array.from(api.synchronizacjaState.activeCategories), ['b']);
assert.equal(api.synchronizacjaState.currentPlayerIndex, 2);
assert.equal(api.synchronizacjaState.turnNumber, 5);
assert.equal(api.synchronizacjaState.completedRounds, 1);
assert.equal(api.synchronizacjaState.roundResults['sync-player-1'], 4);
assert.equal(api.synchronizacjaState.awaitingRoundDecision, true);

api.resetSynchronizacjaMatchScores();
assert.equal(api.synchronizacjaState.players[0].score, 0);
assert.equal(api.synchronizacjaState.turnNumber, 0);
assert.equal(api.synchronizacjaState.completedRounds, 0);
assert.equal(Object.keys(api.synchronizacjaState.roundResults).length, 0);
assert.equal(api.synchronizacjaState.awaitingRoundDecision, false);

api.resetSynchronizacjaSession();
assert.equal(api.synchronizacjaState.players.length, 0);
assert.equal(api.synchronizacjaState.hasSavedSession, false);
assert.equal(store.has('partyjniak.synchronizacja.session.v1'), false);
console.log('Synchronizacja state tests: OK');
