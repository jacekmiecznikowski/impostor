const assert = require('node:assert/strict');
const Rules = require('../assets/js/games/synchronizacja/rules.js');

assert.equal(Rules.createTarget(() => 0), 8);
assert.equal(Rules.createTarget(() => 0.999999), 92);
assert.equal(Rules.normalizePosition(-4), 0);
assert.equal(Rules.normalizePosition(105), 100);
assert.equal(Rules.normalizePosition(51.7), 52);

assert.equal(Rules.scoreDistance(0), 4);
assert.equal(Rules.scoreDistance(4), 4);
assert.equal(Rules.scoreDistance(5), 3);
assert.equal(Rules.scoreDistance(9), 3);
assert.equal(Rules.scoreDistance(10), 2);
assert.equal(Rules.scoreDistance(16), 2);
assert.equal(Rules.scoreDistance(17), 1);
assert.equal(Rules.scoreDistance(25), 1);
assert.equal(Rules.scoreDistance(26), 0);
assert.deepEqual(Rules.scoreGuess(70, 64), { target: 70, guess: 64, distance: 6, points: 3 });

assert.equal(Rules.nextPlayerIndex(0, 4), 1);
assert.equal(Rules.nextPlayerIndex(3, 4), 0);
assert.equal(Rules.isRoundComplete(4, 4), true);
assert.equal(Rules.isRoundComplete(3, 4), false);
assert.equal(Rules.isRoundComplete(0, 4), false);

const categories = [
  { id: 'a', name: 'A', scales: [{ id: 'a1', left: 'L1', right: 'R1' }, { id: 'a2', left: 'L2', right: 'R2' }] },
  { id: 'b', name: 'B', scales: [{ id: 'b1', left: 'L3', right: 'R3' }] }
];
const fresh = Rules.buildScaleDeck(categories, ['a'], ['a1'], () => 0);
assert.equal(fresh.length, 1);
assert.equal(fresh[0].id, 'a2');
const recycled = Rules.buildScaleDeck(categories, ['a'], ['a1', 'a2'], () => 0);
assert.equal(recycled.length, 2);

let recent = [];
for (let index = 0; index < 40; index += 1) recent = Rules.rememberScale(recent, `s-${index}`);
assert.equal(recent.length, Rules.RECENT_SCALE_LIMIT);
assert.equal(recent.at(-1), 's-39');

const standings = Rules.sortStandings([{ name: 'B', score: 3, turns: 2 }, { name: 'A', score: 7, turns: 3 }, { name: 'C', score: 7, turns: 2 }]);
assert.equal(standings[0].name, 'C');
assert.deepEqual(Rules.getLeaders(standings).map(player => player.name), ['C', 'A']);
console.log('Synchronizacja rules tests: OK');
