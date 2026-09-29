// test helper kept intentionally framework-free
const assert = require('node:assert/strict');

function shuffleArray(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function assignRoles(players, impostorCount, hintMode, secretWord, secretHint, random = Math.random) {
  const shuffled = shuffleArray(players, random);
  const impostorIds = shuffled.slice(0, impostorCount).map(player => player.id);
  const roles = {};
  players.forEach(player => {
    const isImpostor = impostorIds.includes(player.id);
    const giveHint = hintMode === 'always' || (hintMode === 'random' && random() < 0.5);
    roles[player.id] = {
      isImpostor,
      word: isImpostor ? (giveHint ? secretHint : 'Brak podpowiedzi') : secretWord
    };
  });
  return { impostorIds, roles };
}

function scoreVote(players, impostorIds, selectedId) {
  const next = players.map(player => ({ ...player }));
  if (impostorIds.includes(selectedId)) {
    next.forEach(player => { if (!impostorIds.includes(player.id)) player.score += 2; });
  } else {
    next.forEach(player => { if (impostorIds.includes(player.id)) player.score += 5; });
  }
  return next;
}

function uniqueNames(names) {
  const normalized = names.map(name => name.trim().toLocaleLowerCase('pl-PL'));
  return new Set(normalized).size === normalized.length;
}

const players = [
  { id: 1, name: 'Ala', score: 0 },
  { id: 2, name: 'Bartek', score: 0 },
  { id: 3, name: 'Celina', score: 0 },
  { id: 4, name: 'Darek', score: 0 }
];

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
  const impostorIds = [4];
  const scored = scoreVote(players, impostorIds, 4);
  assert.deepEqual(scored.map(player => player.score), [2, 2, 2, 0]);
}

{
  const impostorIds = [4];
  const scored = scoreVote(players, impostorIds, 1);
  assert.deepEqual(scored.map(player => player.score), [0, 0, 0, 5]);
}

assert.equal(uniqueNames(['Ala', 'Bartek', 'Celina']), true);
assert.equal(uniqueNames(['Ala', ' ala ', 'Celina']), false);

console.log('Core logic tests: OK');
