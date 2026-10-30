const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const legacy = read('content/co-mam-na-mysli.pl.json');
assert.equal(legacy.categories.length, 6);
assert.equal(legacy.categories.reduce((sum, c) => sum + c.words.length, 0), 90);

const ids = ['zwierzeta', 'zawody', 'jedzenie', 'miejsca', 'przedmioty',
  'czynnosci', 'bohaterowie', 'sport_hobby', 'transport'];
const categories = ids.map(id => read('content/cmm-pack/' + id + '.json'));
assert.deepEqual(categories.map(c => c.id), ids);
assert.ok(categories.every(c => c.name && c.desc && c.icon && c.words.length === 150));

const words = categories.flatMap(c => c.words.map(w => String(w.word).trim()));
assert.equal(words.length, 1350);
assert.equal(new Set(words.map(w => w.toLocaleLowerCase('pl-PL'))).size, words.length);
assert.ok(words.every(w => w && w.length <= 80 && w.split(' ').filter(Boolean).length <= 5));
for (const expected of ['Shrek', 'Harry Potter', 'Piłka nożna', 'Samochód', 'Łowienie ryb', 'Stetoskop', 'Żyrafa']) {
  assert.ok(words.includes(expected), 'Missing guessable prompt: ' + expected);
}

const provider = fs.readFileSync(path.join(__dirname, '../assets/js/games/co-mam-na-mysli/content-provider.js'), 'utf8');
assert.ok(provider.includes('./content/cmm-pack/'), 'Offline loader must use expanded category packs');
assert.ok(provider.includes('Promise.all'), 'All nine packs should load together');
console.log('Co mam na myśli? content tests: OK');
