const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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

const adult = read('content/cmm-pack/adult.json');
assert.equal(adult.id, 'adult');
assert.equal(adult.adult, true);
assert.ok(adult.name.includes('18+'));
assert.equal(adult.words.length, 150);
const adultWords = adult.words.map(w => w.word.trim());
assert.ok(adultWords.every(w => w.length > 0 && w.length <= 80 && w.split(' ').filter(Boolean).length <= 5));
assert.equal(new Set([...words, ...adultWords].map(w => w.toLocaleLowerCase('pl-PL'))).size, 1500,
  'All regular and 18+ entries must be unique');

// In the old client the remote payload is used without opt-in: the public
// remote catalogue MUST contain regular categories only.
const stateSource = fs.readFileSync(path.join(__dirname, '../assets/js/games/co-mam-na-mysli/state.js'), 'utf8');
const setupSource = fs.readFileSync(path.join(__dirname, '../assets/js/games/co-mam-na-mysli/setup.js'), 'utf8');
assert.ok(stateSource.includes("category.adult !== true && category.id !== 'adult'"));
assert.ok(setupSource.includes('getDefaultCoMamNaMysliCategories()'));
assert.ok(setupSource.includes('category.adult === true'));

(async () => {
  const runtime = {
    console,
    fetch: async url => {
      const file = String(url).replace('./', '');
      if (file === 'content/co-mam-na-mysli.pl.json' ||
          file === 'content/cmm-pack/adult.json' ||
          ids.some(id => file === 'content/cmm-pack/' + id + '.json')) {
        return { ok: true, json: async () => read(file) };
      }
      return { ok: false, status: 404 };
    },
    contentRepository: {
      loadRemote: async () => ({ schemaVersion: 1, game: 'co-mam-na-mysli', locale: 'pl', categories })
    }
  };
  vm.createContext(runtime);
  vm.runInContext(provider, runtime);
  await vm.runInContext('initializeCoMamNaMysliContent()', runtime);
  const loaded = JSON.parse(vm.runInContext('JSON.stringify(CO_MAM_NA_MYSLI_CATEGORIES)', runtime));
  assert.equal(loaded.length, 10);
  assert.equal(loaded.filter(c => c.adult === true).length, 1);
  assert.equal(loaded.find(c => c.id === 'adult').words.length, 150);
  assert.equal(loaded.filter(c => !c.adult).reduce((n,c) => n + c.words.length,0), 1350);
  console.log('Co mam na myśli? content tests: OK');
})().catch(err => { console.error(err); process.exitCode = 1; });

