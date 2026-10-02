const assert = require('node:assert/strict');
const Rules = require('../assets/js/games/co-mam-na-mysli/rules.js');

const categories = [
  { id: 'a', name: 'A', words: [{ word: 'Kot' }, { word: 'Pies' }] },
  { id: 'b', name: 'B', words: [{ word: 'Rower' }] }
];

const deck = Rules.buildDeck(categories, ['a'], () => 0.5);
assert.equal(deck.length, 2);
assert.equal(deck.every(card => card.categoryId === 'a'), true);
assert.deepEqual(Rules.scoreRound(5, 2), { correct: 5, passed: 2, score: 5 });
assert.deepEqual(Rules.scoreRound(-2, -1), { correct: 0, passed: 0, score: 0 });
assert.equal(Rules.nextPlayerIndex(0, 4), 1);
assert.equal(Rules.nextPlayerIndex(3, 4), 0);
assert.equal(Rules.nextPlayerIndex(0, 0), -1);

console.log('Co mam na myśli rules tests: OK');
