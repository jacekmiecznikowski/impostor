const assert = require('node:assert/strict');
const ThreeFiveRules = require('../assets/js/games/trzy-w-piec/rules.js');

assert.equal(ThreeFiveRules.DEFAULT_ANSWER_COUNT, 3);
assert.equal(ThreeFiveRules.DEFAULT_TURN_SECONDS, 5);
assert.equal(ThreeFiveRules.MAX_CHALLENGE_VALUE, 60);
assert.equal(ThreeFiveRules.normalizeChallengeValue(5, 3), 5);
assert.equal(ThreeFiveRules.normalizeChallengeValue(0, 3), 1);
assert.equal(ThreeFiveRules.normalizeChallengeValue(999, 5), 60);
assert.equal(ThreeFiveRules.normalizeChallengeValue('nope', 5), 5);
assert.equal(ThreeFiveRules.formatPrompt('Wymień 3 rzeczy, które są zielone.', 5), 'Wymień 5 rzeczy, które są zielone.');
assert.equal(ThreeFiveRules.formatPrompt('Wymień 3 rzeczy.', 60), 'Wymień 60 rzeczy.');
assert.equal(ThreeFiveRules.nextPlayerIndex(0, 4), 1);
assert.equal(ThreeFiveRules.nextPlayerIndex(3, 4), 0);
assert.equal(ThreeFiveRules.nextPlayerIndex(0, 0), -1);
assert.equal(ThreeFiveRules.isRoundComplete(0, 4), false);
assert.equal(ThreeFiveRules.isRoundComplete(3, 4), false);
assert.equal(ThreeFiveRules.isRoundComplete(4, 4), true);
assert.equal(ThreeFiveRules.isRoundComplete(8, 4), true);
assert.equal(ThreeFiveRules.scoreVerdict(true), 1);
assert.equal(ThreeFiveRules.scoreVerdict(false), 0);

const standings = ThreeFiveRules.sortStandings([
  { name: 'Bartek', score: 2, turns: 3 },
  { name: 'Ala', score: 3, turns: 3 },
  { name: 'Celina', score: 3, turns: 3 }
]);
assert.deepEqual(standings.map(player => player.name), ['Ala', 'Celina', 'Bartek']);
assert.deepEqual(ThreeFiveRules.getLeaders(standings).map(player => player.name), ['Ala', 'Celina']);

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
