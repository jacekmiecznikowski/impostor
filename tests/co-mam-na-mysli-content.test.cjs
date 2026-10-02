const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/co-mam-na-mysli.pl.json'), 'utf8'));
assert.equal(data.game, 'co-mam-na-mysli');
assert.equal(data.locale, 'pl');
assert.equal(data.categories.length, 6);

const words = data.categories.flatMap(category => category.words.map(entry => String(entry.word).trim()));
assert.equal(words.length, 90);
assert.equal(new Set(words.map(word => word.toLocaleLowerCase('pl-PL'))).size, words.length, 'Hasła powinny być unikalne');
assert.equal(data.categories.every(category => category.words.length === 15), true);
assert.equal(words.every(word => word.length > 0 && word.length <= 80), true);

console.log('Co mam na myśli content tests: OK');
