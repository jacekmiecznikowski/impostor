const assert = require('node:assert/strict');
const { assignRoles, scoreVote, shuffle } = require('../assets/js/games/impostor/rules.js');

const players = [
  { id: 1, name: 'Ala', score: 0 },
  { id: 2, name: 'Bartek', score: 0 },
  { id: 3, name: 'Celina', score: 0 },
  { id: 4, name: 'Darek', score: 0 }
];

{
  const result = shuffle([1, 2, 3, 4], () => 0.99);
  assert.deepEqual(result, [1, 2, 3, 4]);
}

{
  const result = assignRoles(players, 1, 'none', 'Pizza', 'Ser', () => 0.99);
  assert.equal(result.impostorIds.length, 1);
  assert.equal(Object.values(result.roles).filter(role => role.isImpostor).length, 1);
  assert.equal(Object.values(result.roles).find(role => role.isImpostor).word, 'Brak podpowiedzi');
  assert.equal(Object.values(result.roles).filter(role => !role.isImpostor).every(role => role.word === 'Pizza'), true);
}

{
  const result = assignRoles(players, 1, 'always', 'Pizza', 'Ser', () => 0.99);
  assert.equal(Object.values(result.roles).find(role => role.isImpostor).word, 'Ser');
}

{
  const copy = players.map(player => ({ ...player }));
  assert.equal(scoreVote(copy, [4], 4), true);
  assert.deepEqual(copy.map(player => player.score), [2, 2, 2, 0]);
}

{
  const copy = players.map(player => ({ ...player }));
  assert.equal(scoreVote(copy, [4], 1), false);
  assert.deepEqual(copy.map(player => player.score), [0, 0, 0, 5]);
}

assert.throws(() => assignRoles(players, 4, 'none', 'A', 'B'), /liczba impostorów/i);
assert.throws(() => assignRoles(players, 1, 'invalid', 'A', 'B'), /tryb podpowiedzi/i);

console.log('Core production rules tests: OK');
