const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ThreeFiveRules = require('../assets/js/games/trzy-w-piec/rules.js');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/trzy-w-piec/state.js'), 'utf8');
const store = new Map();
const sandbox = {
  console,
  ThreeFiveRules,
  THREE_FIVE_CATEGORIES: [{ id: 'a' }, { id: 'b' }],
  clampPlayerSetupCount(value, min, max, fallback) {
    const parsed = Number.parseInt(value, 10);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
  },
  resizePlayerSetupRoster(players, count, createPlayer) {
    return Array.from({ length: count }, (_, index) => players[index] ? { ...players[index] } : createPlayer(index));
  },
  updateThreeFiveResumeButton() {},
  localStorage: {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); }
  }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__threeFiveStateTest = { threeFiveState, createThreeFivePlayers, persistThreeFiveSession, loadThreeFiveSession, resetThreeFiveSession, resetThreeFiveMatchScores };`, sandbox);

const api = sandbox.__threeFiveStateTest;
api.createThreeFivePlayers(3, []);
api.threeFiveState.players[0].name = 'Ala';
api.threeFiveState.players[0].score = 4;
api.threeFiveState.players[0].turns = 6;
api.threeFiveState.answerCount = 5;
api.threeFiveState.turnSeconds = 10;
api.threeFiveState.activeCategories = ['b'];
api.threeFiveState.currentPlayerIndex = 0;
api.threeFiveState.turnNumber = 12;
api.threeFiveState.completedRounds = 4;
api.threeFiveState.roundResults = { 'three-five-player-1': 1, 'three-five-player-2': 0, 'three-five-player-3': 1 };
api.threeFiveState.awaitingRoundDecision = true;
api.threeFiveState.gameFinished = false;
api.threeFiveState.recentPromptIds = ['b-1'];
api.persistThreeFiveSession();
assert.equal(api.threeFiveState.hasSavedSession, true);
assert.equal(store.has('partyjniak.trzy-w-piec.session.v1'), true);

api.threeFiveState.players = [];
api.threeFiveState.answerCount = 3;
api.threeFiveState.turnSeconds = 5;
api.loadThreeFiveSession();
assert.equal(api.threeFiveState.players.length, 3);
assert.equal(api.threeFiveState.players[0].name, 'Ala');
assert.equal(api.threeFiveState.players[0].score, 4);
assert.equal(api.threeFiveState.players[0].turns, 6);
assert.equal(api.threeFiveState.answerCount, 5);
assert.equal(api.threeFiveState.turnSeconds, 10);
assert.deepEqual(Array.from(api.threeFiveState.activeCategories), ['b']);
assert.equal(api.threeFiveState.currentPlayerIndex, 0);
assert.equal(api.threeFiveState.turnNumber, 12);
assert.equal(api.threeFiveState.completedRounds, 4);
assert.equal(api.threeFiveState.awaitingRoundDecision, true);
assert.equal(api.threeFiveState.gameFinished, false);
assert.equal(api.threeFiveState.roundResults['three-five-player-1'], 1);
assert.equal(api.threeFiveState.roundResults['three-five-player-2'], 0);
assert.deepEqual(Array.from(api.threeFiveState.recentPromptIds), ['b-1']);

// Old sessions migrate to round-based play. Completed rounds are derived from turn count.
store.set('partyjniak.trzy-w-piec.session.v1', JSON.stringify({
  playerCount: 2,
  players: [{ name: 'A' }, { name: 'B' }],
  targetScore: 15,
  activeCategories: ['a'],
  currentPlayerIndex: 0,
  turnNumber: 6,
  recentPromptIds: []
}));
api.loadThreeFiveSession();
assert.equal(api.threeFiveState.answerCount, 3);
assert.equal(api.threeFiveState.turnSeconds, 5);
assert.equal(api.threeFiveState.completedRounds, 3);
assert.equal(api.threeFiveState.awaitingRoundDecision, false);
assert.equal(api.threeFiveState.gameFinished, false);

api.threeFiveState.answerCount = 999;
api.threeFiveState.turnSeconds = 999;
api.persistThreeFiveSession();
assert.equal(api.threeFiveState.answerCount, 60);
assert.equal(api.threeFiveState.turnSeconds, 60);

api.resetThreeFiveMatchScores();
assert.equal(api.threeFiveState.players[0].score, 0);
assert.equal(api.threeFiveState.players[0].turns, 0);
assert.equal(api.threeFiveState.currentPlayerIndex, 0);
assert.equal(api.threeFiveState.turnNumber, 0);
assert.equal(api.threeFiveState.completedRounds, 0);
assert.deepEqual(api.threeFiveState.roundResults, {});
assert.equal(api.threeFiveState.awaitingRoundDecision, false);
assert.equal(api.threeFiveState.gameFinished, false);

api.resetThreeFiveSession();
assert.equal(api.threeFiveState.players.length, 0);
assert.equal(api.threeFiveState.answerCount, 3);
assert.equal(api.threeFiveState.turnSeconds, 5);
assert.equal(api.threeFiveState.hasSavedSession, false);
assert.equal(store.has('partyjniak.trzy-w-piec.session.v1'), false);

console.log('Trzy w Pięć session state tests: OK');
