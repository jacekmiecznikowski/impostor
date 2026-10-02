const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/co-mam-na-mysli/state.js'), 'utf8');
const store = new Map();
const sandbox = {
  console,
  CO_MAM_NA_MYSLI_CATEGORIES: [{ id: 'a' }, { id: 'b' }],
  clampPlayerSetupCount(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
  },
  resizePlayerSetupRoster(players, count, createPlayer) {
    return Array.from({ length: count }, (_, index) => players[index] ? { ...players[index] } : createPlayer(index));
  },
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  },
  Date,
  Math
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__cmmStateTest = { coMamNaMysliState, createCoMamNaMysliPlayers, persistCoMamNaMysliSession, loadCoMamNaMysliSession, resetCoMamNaMysliSession };`, sandbox);

const api = sandbox.__cmmStateTest;
api.createCoMamNaMysliPlayers(3, []);
api.coMamNaMysliState.players[0].name = 'Ala';
api.coMamNaMysliState.players[0].score = 8;
api.coMamNaMysliState.players[0].turns = 3;
api.coMamNaMysliState.roundTime = 45;
api.coMamNaMysliState.activeCategories = ['b'];
api.coMamNaMysliState.currentPlayerIndex = 2;
api.coMamNaMysliState.roundNumber = 6;
api.persistCoMamNaMysliSession();
assert.equal(store.has('partyjniak.co-mam-na-mysli.session.v1'), true);
assert.equal(api.coMamNaMysliState.hasSavedSession, true);

api.coMamNaMysliState.players = [];
api.coMamNaMysliState.currentPlayerIndex = 0;
api.loadCoMamNaMysliSession();
assert.equal(api.coMamNaMysliState.players.length, 3);
assert.equal(api.coMamNaMysliState.players[0].name, 'Ala');
assert.equal(api.coMamNaMysliState.players[0].score, 8);
assert.equal(api.coMamNaMysliState.players[0].turns, 3);
assert.equal(api.coMamNaMysliState.roundTime, 45);
assert.deepEqual(Array.from(api.coMamNaMysliState.activeCategories), ['b']);
assert.equal(api.coMamNaMysliState.currentPlayerIndex, 2);
assert.equal(api.coMamNaMysliState.roundNumber, 6);

api.resetCoMamNaMysliSession();
assert.equal(api.coMamNaMysliState.players.length, 0);
assert.equal(api.coMamNaMysliState.hasSavedSession, false);
assert.equal(store.has('partyjniak.co-mam-na-mysli.session.v1'), false);

console.log('Co mam na myśli session state tests: OK');
