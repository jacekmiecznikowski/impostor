const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const payload = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/synchronizacja.pl.json'), 'utf8'));
assert.equal(payload.schemaVersion, 1);
assert.equal(payload.game, 'synchronizacja');
assert.equal(payload.locale, 'pl');
assert.equal(payload.categories.length, 6);

const categoryIds = new Set();
const scaleIds = new Set();
let total = 0;
for (const category of payload.categories) {
  assert.ok(category.id && category.name && category.icon);
  assert.equal(categoryIds.has(category.id), false);
  categoryIds.add(category.id);
  assert.ok(Array.isArray(category.scales) && category.scales.length >= 8);
  for (const scale of category.scales) {
    assert.ok(scale.id && scale.left && scale.right);
    assert.notEqual(scale.left, scale.right);
    assert.equal(scaleIds.has(scale.id), false);
    scaleIds.add(scale.id);
    total += 1;
  }
}
assert.equal(total, 48);
console.log('Synchronizacja content tests: OK');
