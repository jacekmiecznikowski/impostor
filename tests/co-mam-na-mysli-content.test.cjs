const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = relative => JSON.parse(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'));
const legacy = read('content/co-mam-na-mysli.pl.json');
assert.equal(legacy.game, 'co-mam-na-mysli');
assert.equal(legacy.locale, 'pl');
assert.equal(legacy.categories.length, 6);
assert.equal(legacy.categories.reduce((n, c) => n + c.words.length, 0), 90, 'Historical seed must remain unchanged');

const ids = ['zwierzeta', 'zawody', 'jedzenie', 'miejsca', 'przedmioty',
  'czynnosci', 'bohaterowie', 'sport_hobby', 'transport'];
const categories = ids.map(id => read('content/cmm-pack/' + id + '.json'));
assert.deepEqual(categories.map(c => c.id), ids);
assert.ok(categories.every(c => c.name && c.desc && /^fa-[a-z0-9-]+$/.test(c.icon)));
assert.ok(categories.every(c => c.words.length === 150), 'Every category must have 150 guessable prompts');

const words = categories.flatMap(c => c.words.map(w => w.word.trim()));
assert.equal(words.length, 1350);
assert.equal(new Set(words.map(w => w.toLocaleLowerCase('pl-PL'))).size, words.length,
  'No duplicate words across categories');
assert.ok(words.every(w => w.length > 0 && w.length <= 80 && w.split(/\\s+/).length <= 5));
for (const expected of ['Shrek', 'Harry Potter', 'Piłka nożna', 'Samochód',
  'Łowienie ryb', 'Stetoskop', 'Żyrafa']) {
  assert.ok(words.includes(expected), 'Expected well-known prompt: ' + expected);
}

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/co-mam-na-mysli/content-provider.js'), 'utf8');
assert.match(source, /cmm-pack/);
const sandbox = {
  console,
  fetch: async url => {
    const match = String(url).match(/^\\.\\/content\\/cmm-pack\\/([a-z_]+)\\.json$/);
    if (!match) return { ok: false, status: 404 };
    return { ok: true, json: async () => read('content/cmm-pack/' + match[1] + '.json') };
  },
  contentRepository: { loadRemote: async () => null }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

(async () => {
  await vm.runInContext('initializeCoMamNaMysliContent()', sandbox);
  const loaded = JSON.parse(vm.runInContext('JSON.stringify(CO_MAM_NA_MYSLI_CATEGORIES)', sandbox));
  assert.deepEqual(loaded.map(c => c.id), ids, 'All nine offline packs must load in order');
  assert.equal(loaded.reduce((n, c) => n + c.words.length, 0), 1350);
  console.log('Co mam na myśli? content tests: OK');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
