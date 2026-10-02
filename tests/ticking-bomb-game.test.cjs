const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const TickingBombRules = require('../assets/js/games/ticking-bomb/rules.js');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/ticking-bomb/game.js'), 'utf8');
let now = 1000;
let persistCount = 0;
let clickCount = 0;
let tickingStarts = 0;
let tickingStops = 0;
let explosionSounds = 0;
let nextTimerId = 1;
let scheduled = [];
let cleared = [];

const bombState = {
  players: [
    { id: 'p1', name: 'Ala', score: 0, losses: 0 },
    { id: 'p2', name: 'Bartek', score: 0, losses: 0 },
    { id: 'p3', name: 'Celina', score: 0, losses: 0 }
  ],
  mode: 'tracked',
  fusePreset: 'short',
  activeCategories: ['animals'],
  currentPrompt: null,
  currentCategoryId: null,
  currentPlayerIndex: 0,
  lastLoserId: null,
  manualLoserId: null,
  roundNumber: 0
};

const sandbox = {
  console,
  Math,
  Uint32Array,
  TickingBombRules,
  BOMB_CATEGORIES: [
    { id: 'animals', name: 'Zwierzęta', words: [{ word: 'KOT' }, { word: 'PIES' }] }
  ],
  bombState,
  crypto: {
    getRandomValues(values) {
      values[0] = 0x80000000;
      return values;
    }
  },
  performance: { now: () => now },
  document: {
    getElementById: () => null,
    querySelector: () => null,
    createElement: () => ({
      classList: { add() {}, remove() {}, toggle() {} },
      setAttribute() {},
      append() {},
      style: { removeProperty() {} }
    })
  },
  setTimeout(fn, delay) {
    const id = nextTimerId++;
    scheduled.push({ id, fn, delay });
    return id;
  },
  clearTimeout(id) { cleared.push(id); },
  normalizeBombActiveCategories() {},
  getBombCategoryById(id) { return sandbox.BOMB_CATEGORIES.find(category => category.id === id) || null; },
  showToast() {},
  goToScreen() {},
  playSound(type) { if (type === 'click') clickCount += 1; },
  primeBombAudio() {},
  async startBombTicking() { tickingStarts += 1; },
  stopBombTicking() { tickingStops += 1; },
  playBombExplosion() { explosionSounds += 1; },
  persistBombSession() { persistCount += 1; }
};

vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const run = expression => vm.runInContext(expression, sandbox);

const prompt = run('chooseBombPrompt()');
assert.equal(prompt.categoryId, 'animals');
assert.equal(prompt.prompt, 'PIES', 'secure random adapter should feed domain prompt selection');

assert.equal(run("applyBombLoss('p2')"), true);
assert.equal(bombState.lastLoserId, 'p2');
assert.equal(bombState.players[1].losses, 1);
assert.deepEqual(bombState.players.map(player => player.score), [1, 0, 1]);
assert.equal(run("applyBombLoss('missing')"), false);

bombState.players.forEach(player => { player.score = 0; player.losses = 0; });
bombState.currentPlayerIndex = 0;
bombState.mode = 'tracked';
run('bombRuntime.active = true; bombRuntime.passHistory = []; bombRuntime.lastPassAt = 0;');
now = 1000;
run('bombPass()');
assert.equal(bombState.currentPlayerIndex, 1);
assert.equal(clickCount, 1);

now = 1100;
run('bombPass()');
assert.equal(bombState.currentPlayerIndex, 1, 'double tap inside 250 ms should be ignored');
assert.equal(clickCount, 1);

now = 1300;
run('bombPass()');
assert.equal(bombState.currentPlayerIndex, 2);
assert.equal(clickCount, 2);
run('bombUndoPass()');
assert.equal(bombState.currentPlayerIndex, 1);
assert.equal(clickCount, 3);

scheduled = [];
cleared = [];
persistCount = 0;
bombState.currentPlayerIndex = 1;
bombState.roundNumber = 0;
bombState.mode = 'tracked';
bombState.lastLoserId = null;
bombState.players.forEach(player => { player.score = 0; player.losses = 0; });
run('bombRuntime.active = true; bombRuntime.exploded = false; bombRuntime.timeoutId = 77;');
run('explodeBomb()');
assert.equal(bombState.lastLoserId, 'p2');
assert.equal(bombState.players[1].losses, 1);
assert.deepEqual(bombState.players.map(player => player.score), [1, 0, 1]);
assert.equal(bombState.roundNumber, 1);
assert.equal(persistCount, 1);
assert.deepEqual(cleared, [77]);
assert.equal(tickingStops > 0, true);
assert.equal(explosionSounds, 1);
assert.equal(scheduled.length, 1);
assert.equal(scheduled[0].delay, 420);

persistCount = 0;
bombState.mode = 'manual';
bombState.manualLoserId = 'p3';
bombState.players.forEach(player => { player.score = 0; player.losses = 0; });
assert.equal(run('commitBombManualLoser()'), true);
assert.equal(bombState.lastLoserId, 'p3');
assert.equal(bombState.players[2].losses, 1);
assert.deepEqual(bombState.players.map(player => player.score), [1, 1, 0]);
assert.equal(persistCount, 1);

scheduled = [];
bombState.mode = 'tracked';
bombState.fusePreset = 'short';
run('bombRuntime.active = false; bombRuntime.exploded = false; bombRuntime.timeoutId = null;');
(async () => {
  await run('igniteBomb()');
  assert.equal(run('bombRuntime.durationMs'), 17500);
  assert.equal(run('bombRuntime.active'), true);
  assert.equal(tickingStarts, 1);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].delay, 17500);
  console.log('Ticking Bomb gameplay orchestration tests: OK');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
