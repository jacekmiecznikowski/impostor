const assert = require('node:assert/strict');
const rules = require('../assets/js/games/naokolo/rules.js');

assert.deepEqual([...rules.ROUND_TIMES], [30, 45, 60, 90]);
assert.equal(rules.normalizeRoundTime(45), 45);
assert.equal(rules.normalizeRoundTime(12, 60), 60);
assert.equal(rules.nextPlayerIndex(0, 4), 1);
assert.equal(rules.nextPlayerIndex(3, 4), 0);
assert.equal(rules.nextPlayerIndex(0, 0), -1);

assert.deepEqual(rules.scoreTurn({ guessed: 5, skipped: 2, forbidden: 2 }), {
  guessed: 5,
  skipped: 2,
  forbidden: 2,
  score: 3
});
assert.equal(rules.scoreTurn({ guessed: 0, forbidden: 2 }).score, -2);

const source = [1, 2, 3, 4];
const shuffled = rules.shuffle(source, () => 0);
assert.deepEqual(source, [1, 2, 3, 4], 'shuffle must not mutate source');
assert.deepEqual(shuffled, [2, 3, 4, 1]);

const categories = [
  { id: 'a', name: 'A', cards: [{ word: 'Alpha', forbidden: ['x', 'y', 'z'] }] },
  { id: 'b', name: 'B', cards: [{ word: 'Beta', forbidden: ['u', 'v', 'w'] }] }
];
const deck = rules.buildDeck(categories, ['b'], () => 0.5);
assert.equal(deck.length, 1);
assert.equal(deck[0].word, 'Beta');
assert.equal(deck[0].categoryId, 'b');
assert.deepEqual(deck[0].forbidden, ['u', 'v', 'w']);
assert.notEqual(deck[0].forbidden, categories[1].cards[0].forbidden, 'deck should copy forbidden arrays');

console.log('Naokolo domain rules tests: OK');
