const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  FUSE_PRESETS,
  randomBetween,
  pickRandomIndex,
  choosePrompt,
  chooseStartingPlayerIndex,
  getFuseDurationMs,
  nextPlayerIndex,
  scoreLoss
} = require('../assets/js/games/ticking-bomb/rules.js');

assert.equal(Object.isFrozen(FUSE_PRESETS), true);
assert.equal(FUSE_PRESETS.unstable.minSeconds, 5);
assert.equal(FUSE_PRESETS.unstable.maxSeconds, 120);
assert.equal(FUSE_PRESETS.short.maxSeconds, 30);
assert.equal(FUSE_PRESETS.long.minSeconds, 30);

assert.equal(randomBetween(10, 20, () => 0.5), 15);
assert.equal(randomBetween(7, 7, () => 0.8), 7);
assert.equal(randomBetween(0, 10, () => -1), 0);
assert.equal(randomBetween(0, 10, () => 2), 10);
assert.throws(() => randomBetween('x', 10), /granic/i);

assert.equal(pickRandomIndex(4, () => 0), 0);
assert.equal(pickRandomIndex(4, () => 0.74), 2);
assert.equal(pickRandomIndex(4, () => 1), 3);
assert.equal(pickRandomIndex(0), -1);
assert.equal(chooseStartingPlayerIndex(3, () => 0.99), 2);

const categories = [
  {
    id: 'animals',
    name: 'Zwierzęta',
    words: [{ word: 'KOT' }, { word: 'PIES' }]
  },
  {
    id: 'food',
    name: 'Jedzenie',
    words: [{ word: 'PIZZA' }, { word: 'ZUPA' }]
  }
];

assert.deepEqual(
  choosePrompt(categories, ['food'], () => 0),
  { categoryId: 'food', categoryName: 'Jedzenie', prompt: 'PIZZA' }
);

const sequence = [0.99, 0.99];
assert.deepEqual(
  choosePrompt(categories, ['animals', 'food'], () => sequence.shift()),
  { categoryId: 'food', categoryName: 'Jedzenie', prompt: 'ZUPA' }
);
assert.equal(choosePrompt(categories, ['missing'], () => 0), null);
assert.equal(choosePrompt([], ['animals'], () => 0), null);

assert.equal(getFuseDurationMs('short', () => 0), 5000);
assert.equal(getFuseDurationMs('short', () => 0.5), 17500);
assert.equal(getFuseDurationMs('long', () => 1), 120000);
assert.equal(getFuseDurationMs('missing', () => 0), 5000, 'unknown preset falls back to unstable');

assert.equal(nextPlayerIndex(0, 3), 1);
assert.equal(nextPlayerIndex(2, 3), 0);
assert.equal(nextPlayerIndex(-1, 3), 0);
assert.equal(nextPlayerIndex(0, 0), -1);

const players = [
  { id: 'p1', name: 'Ala', score: 2, losses: 0 },
  { id: 'p2', name: 'Bartek', score: 4, losses: 1 },
  { id: 'p3', name: 'Celina', score: 0, losses: 2 }
];
const before = JSON.parse(JSON.stringify(players));
const result = scoreLoss(players, 'p2');
assert.deepEqual(players, before, 'domain scoring must not mutate input');
assert.equal(result.loserId, 'p2');
assert.deepEqual(result.players.map(player => player.score), [3, 4, 1]);
assert.deepEqual(result.players.map(player => player.losses), [0, 2, 2]);
assert.equal(scoreLoss(players, 'missing'), null);
assert.equal(scoreLoss(null, 'p1'), null);

const root = path.join(__dirname, '..');
const gameSource = fs.readFileSync(path.join(root, 'assets/js/games/ticking-bomb/game.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(root, 'assets/js/games/ticking-bomb/state.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

['choosePrompt', 'chooseStartingPlayerIndex', 'getFuseDurationMs', 'nextPlayerIndex', 'scoreLoss'].forEach(method => {
  assert.match(gameSource, new RegExp(`TickingBombRules\\.${method}`), `game.js powinien delegować ${method} do rules.js`);
});
assert.doesNotMatch(gameSource, /function secureRandomBetween/);
assert.doesNotMatch(stateSource, /const BOMB_FUSE_PRESETS/);

const rulesScript = indexSource.indexOf('./assets/js/games/ticking-bomb/rules.js');
const stateScript = indexSource.indexOf('./assets/js/games/ticking-bomb/state.js');
const gameScript = indexSource.indexOf('./assets/js/games/ticking-bomb/game.js');
assert.ok(rulesScript >= 0 && rulesScript < stateScript && stateScript < gameScript, 'rules.js musi ładować się przed state.js i game.js');

console.log('Ticking Bomb domain rules tests: OK');
