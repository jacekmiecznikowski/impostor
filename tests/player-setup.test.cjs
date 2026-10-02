const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/shared/player-setup.js'), 'utf8');
const sandbox = { console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__playerSetupTest = { clampPlayerSetupCount, resizePlayerSetupRoster };`, sandbox);

const { clampPlayerSetupCount, resizePlayerSetupRoster } = sandbox.__playerSetupTest;

assert.equal(clampPlayerSetupCount('4', 3, 12, 4), 4);
assert.equal(clampPlayerSetupCount('1', 3, 12, 4), 3);
assert.equal(clampPlayerSetupCount('99', 3, 12, 4), 12);
assert.equal(clampPlayerSetupCount('x', 3, 12, 4), 4);

const original = [
  { id: 1, name: 'Ala', score: 3 },
  { id: 2, name: 'Bartek', score: 1 }
];
const expanded = resizePlayerSetupRoster(original, 4, index => ({ id: index + 1, name: `Gracz ${index + 1}`, score: 0 }));
assert.deepEqual(JSON.parse(JSON.stringify(expanded)), [
  { id: 1, name: 'Ala', score: 3 },
  { id: 2, name: 'Bartek', score: 1 },
  { id: 3, name: 'Gracz 3', score: 0 },
  { id: 4, name: 'Gracz 4', score: 0 }
]);
assert.notEqual(expanded[0], original[0], 'shared roster helper should clone existing players');
assert.equal(original.length, 2, 'shared roster helper should not mutate source roster');

const reduced = resizePlayerSetupRoster(expanded, 2, () => { throw new Error('should not create'); });
assert.equal(reduced.length, 2);
assert.equal(reduced[0].name, 'Ala');
assert.equal(reduced[1].name, 'Bartek');

console.log('Shared player setup tests: OK');
