const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/naokolo.pl.json'), 'utf8'));
assert.equal(content.schemaVersion, 1);
assert.equal(content.game, 'naokolo');
assert.equal(content.locale, 'pl');
assert.equal(Array.isArray(content.categories), true);
assert.equal(content.categories.length >= 5, true);

const ids = new Set();
let cardCount = 0;
const words = new Set();
for (const category of content.categories) {
  assert.match(category.id, /^[a-z0-9][a-z0-9_-]{0,39}$/);
  assert.equal(ids.has(category.id), false, `Powtórzona kategoria: ${category.id}`);
  ids.add(category.id);
  assert.equal(Boolean(category.name), true);
  assert.equal(Array.isArray(category.cards), true);
  assert.equal(category.cards.length >= 8, true, `Za mało kart: ${category.id}`);
  for (const card of category.cards) {
    cardCount += 1;
    assert.equal(typeof card.word, 'string');
    assert.equal(card.word.trim().length > 0, true);
    const key = card.word.trim().toLocaleLowerCase('pl-PL');
    assert.equal(words.has(key), false, `Powtórzone hasło: ${card.word}`);
    words.add(key);
    assert.equal(Array.isArray(card.forbidden), true);
    assert.equal(card.forbidden.length >= 3 && card.forbidden.length <= 6, true, `Nieprawidłowe zakazane: ${card.word}`);
    const forbidden = card.forbidden.map(item => String(item).trim().toLocaleLowerCase('pl-PL'));
    assert.equal(new Set(forbidden).size, forbidden.length, `Powtórzone zakazane: ${card.word}`);
    assert.equal(forbidden.includes(key), false, `Hasło nie powinno być zakazanym słowem samo dla siebie: ${card.word}`);
  }
}

assert.equal(cardCount, 50);
console.log('Naokolo content tests: OK');
