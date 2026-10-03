const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '../content/trzy-w-piec.pl.json');
const payload = JSON.parse(fs.readFileSync(file, 'utf8'));

assert.equal(payload.schemaVersion, 1);
assert.equal(payload.game, 'trzy-w-piec');
assert.equal(payload.locale, 'pl');
assert.equal(Array.isArray(payload.categories), true);
assert.equal(payload.categories.length, 5);

const ids = new Set();
let promptCount = 0;
payload.categories.forEach(category => {
  assert.match(category.id, /^[a-z0-9][a-z0-9_-]+$/);
  assert.ok(category.name);
  assert.ok(category.desc);
  assert.ok(category.icon);
  assert.equal(category.prompts.length, 20);
  category.prompts.forEach(prompt => {
    assert.ok(prompt.id);
    assert.ok(prompt.text);
    assert.match(prompt.text, /^Wymień 3 /);
    assert.equal(ids.has(prompt.id), false, `duplicate prompt id: ${prompt.id}`);
    ids.add(prompt.id);
    promptCount += 1;
  });
});
assert.equal(promptCount, 100);

console.log('Trzy w Pięć content tests: OK');
