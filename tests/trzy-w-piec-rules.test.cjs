const assert = require('node:assert/strict');
const ThreeFiveRules = require('../assets/js/games/trzy-w-piec/rules.js');

assert.deepEqual([...ThreeFiveRules.TARGET_SCORES], [5, 10, 15]);
assert.equal(ThreeFiveRules.TURN_SECONDS, 5);
assert.equal(ThreeFiveRules.normalizeTargetScore(15), 15);
assert.equal(ThreeFiveRules.normalizeTargetScore(7, 10), 10);
assert.equal(ThreeFiveRules.nextPlayerIndex(0, 4), 1);
assert.equal(ThreeFiveRules.nextPlayerIndex(3, 4), 0);
assert.equal(ThreeFiveRules.nextPlayerIndex(0, 0), -1);
assert.equal(ThreeFiveRules.scoreVerdict(true), 1);
assert.equal(ThreeFiveRules.scoreVerdict(false), 0);
assert.equal(ThreeFiveRules.hasWinner(10, 10), true);
assert.equal(ThreeFiveRules.hasWinner(9, 10), false);

const categories = [
  { id: 'a', name: 'A', prompts: [{ id: 'a-1', text: 'A1' }, { id: 'a-2', text: 'A2' }] },
  { id: 'b', name: 'B', prompts: [{ id: 'b-1', text: 'B1' }] }
];
const deck = ThreeFiveRules.buildPromptDeck(categories, ['a'], ['a-1'], () => 0);
assert.equal(deck.length, 1);
assert.equal(deck[0].id, 'a-2');
assert.equal(deck[0].categoryName, 'A');

const recycled = ThreeFiveRules.buildPromptDeck(categories, ['a'], ['a-1', 'a-2'], () => 0);
assert.equal(recycled.length, 2, 'when a selected pack is exhausted, prompts should be recycled instead of returning an empty deck');

let recent = [];
for (let index = 0; index < 50; index += 1) recent = ThreeFiveRules.rememberPrompt(recent, `p-${index}`);
assert.equal(recent.length, ThreeFiveRules.RECENT_PROMPT_LIMIT);
assert.equal(recent.at(-1), 'p-49');
assert.equal(new Set(recent).size, recent.length);

console.log('Trzy w Pięć domain rules tests: OK');
