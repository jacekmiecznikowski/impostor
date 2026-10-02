const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const NaokoloRules = require('../assets/js/games/naokolo/rules.js');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/naokolo/state.js'), 'utf8');
const store = new Map();
const sandbox = {
  console,
  NaokoloRules,
  NAOKOLO_CATEGORIES: [{ id: 'a' }, { id: 'b' }],
  clampPlayerSetupCount(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
  },
  resizePlayerSetupRoster(players, count, createPlayer) {
    return Array.from({ length: count }, (_, index) => players[index] ? { ...players[index] } : createPlayer(index));
  },
  updateNaokoloResumeButton() {},
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__naokoloStateTest = { naokoloState, createNaokoloPlayers, persistNaokoloSession, loadNaokoloSession, resetNaokoloSession };`, sandbox);

const api = sandbox.__naokoloStateTest;
api.createNaokoloPlayers(3, []);
api.naokoloState.players[0].name = 'Ala';
api.naokoloState.players[0].score = 5;
api.naokoloState.players[0].turns = 2;
api.naokoloState.roundTime = 45;
api.naokoloState.activeCategories = ['b'];
api.naokoloState.currentPlayerIndex = 2;
api.naokoloState.roundNumber = 7;
api.persistNaokoloSession();
assert.equal(api.naokoloState.hasSavedSession, true);
assert.equal(store.has('partyjniak.naokolo.session.v1'), true);

api.naokoloState.players = [];
api.naokoloState.roundTime = 90;
api.naokoloState.currentPlayerIndex = 0;
api.loadNaokoloSession();
assert.equal(api.naokoloState.players.length, 3);
assert.equal(api.naokoloState.players[0].name, 'Ala');
assert.equal(api.naokoloState.players[0].score, 5);
assert.equal(api.naokoloState.players[0].turns, 2);
assert.equal(api.naokoloState.roundTime, 45);
assert.deepEqual(Array.from(api.naokoloState.activeCategories), ['b']);
assert.equal(api.naokoloState.currentPlayerIndex, 2);
assert.equal(api.naokoloState.roundNumber, 7);

api.resetNaokoloSession();
assert.equal(api.naokoloState.players.length, 0);
assert.equal(api.naokoloState.hasSavedSession, false);
assert.equal(store.has('partyjniak.naokolo.session.v1'), false);

console.log('Naokolo session state tests: OK');
