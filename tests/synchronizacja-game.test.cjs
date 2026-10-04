const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SynchronizacjaRules = require('../assets/js/games/synchronizacja/rules.js');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/synchronizacja/game.js'), 'utf8');
const elements = new Map();
function fakeClassList() { return { add() {}, remove() {}, toggle() {} }; }
function makeElement(id = '') {
  return {
    id,
    textContent: '',
    style: { setProperty() {} },
    classList: fakeClassList(),
    children: [],
    append(...children) { this.children.push(...children); },
    appendChild(child) { this.children.push(child); return child; },
    replaceChildren(...children) { this.children = [...children]; }
  };
}
function element(id) {
  if (!elements.has(id)) elements.set(id, makeElement(id));
  return elements.get(id);
}

let lastScreen = null;
let persistCount = 0;
const sandbox = {
  console,
  SynchronizacjaRules,
  synchronizacjaState: {
    players: [
      { id: 'p1', name: 'Ala', score: 0, turns: 0 },
      { id: 'p2', name: 'Bartek', score: 0, turns: 0 }
    ],
    activeCategories: ['a'],
    currentPlayerIndex: 0,
    turnNumber: 0,
    completedRounds: 0,
    roundResults: {},
    recentScaleIds: [],
    awaitingRoundDecision: false,
    gameFinished: false
  },
  SYNCHRONIZACJA_CATEGORIES: [{ id: 'a', name: 'A', scales: [{ id: 'a1', left: 'Tani', right: 'Drogi' }, { id: 'a2', left: 'Cichy', right: 'Głośny' }] }],
  document: {
    getElementById: id => element(id),
    createElement: () => makeElement()
  },
  navigator: { vibrate() {} },
  playSound() {},
  showToast() {},
  setGameAwakeMode() {},
  goToScreen(screen) { lastScreen = screen; },
  persistSynchronizacjaSession() { persistCount += 1; },
  resetSynchronizacjaMatchScores() {
    this.synchronizacjaState?.players?.forEach(player => { player.score = 0; player.turns = 0; });
  }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__syncGameTest = { synchronizacjaRuntime, setSynchronizacjaGuess, submitSynchronizacjaGuess, advanceSynchronizacjaTurn, continueSynchronizacjaRound, finishSynchronizacjaGame };`, sandbox);

const api = sandbox.__syncGameTest;
api.synchronizacjaRuntime.currentScale = { id: 'a1', left: 'Tani', right: 'Drogi', categoryName: 'A' };
api.synchronizacjaRuntime.target = 70;
api.setSynchronizacjaGuess(64);
api.submitSynchronizacjaGuess();
assert.equal(sandbox.synchronizacjaState.players[0].score, 3);
assert.equal(sandbox.synchronizacjaState.players[0].turns, 1);
assert.equal(sandbox.synchronizacjaState.turnNumber, 1);
assert.equal(sandbox.synchronizacjaState.roundResults.p1, 3);
assert.equal(lastScreen, 'sync-reveal');

api.advanceSynchronizacjaTurn();
assert.equal(sandbox.synchronizacjaState.currentPlayerIndex, 1);
assert.equal(lastScreen, 'sync-ready');

api.synchronizacjaRuntime.currentScale = { id: 'a2', left: 'Cichy', right: 'Głośny', categoryName: 'A' };
api.synchronizacjaRuntime.target = 20;
api.setSynchronizacjaGuess(80);
api.submitSynchronizacjaGuess();
assert.equal(sandbox.synchronizacjaState.players[1].score, 0);
api.advanceSynchronizacjaTurn();
assert.equal(sandbox.synchronizacjaState.completedRounds, 1);
assert.equal(sandbox.synchronizacjaState.awaitingRoundDecision, true);
assert.equal(sandbox.synchronizacjaState.currentPlayerIndex, 0);
assert.equal(lastScreen, 'sync-round-summary');

api.continueSynchronizacjaRound();
assert.equal(sandbox.synchronizacjaState.awaitingRoundDecision, false);
assert.equal(Object.keys(sandbox.synchronizacjaState.roundResults).length, 0);
assert.equal(lastScreen, 'sync-ready');

sandbox.synchronizacjaState.awaitingRoundDecision = true;
api.finishSynchronizacjaGame();
assert.equal(sandbox.synchronizacjaState.gameFinished, true);
assert.equal(lastScreen, 'sync-final');
assert.ok(persistCount >= 4);
console.log('Synchronizacja gameplay tests: OK');
