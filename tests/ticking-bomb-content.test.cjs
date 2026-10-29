const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/ticking-bomb/content-provider.js'), 'utf8');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/ticking-bomb.pl.json'), 'utf8'));
const expanded = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/ticking-bomb-expanded.pl.json'), 'utf8'));
assert.match(source, /ticking-bomb-expanded\.pl\.json/);


const sandbox = {
  console,
  fetch: async () => { throw new Error('offline'); },
  contentRepository: {
    validate: value => value,
    loadRemote: async () => null
  },
  normalizeBombActiveCategories() {}
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const run = expression => vm.runInContext(expression, sandbox);

assert.equal(run("formatBombPromptLabel('  Wymieniajcie zwierzęta...  ')"), 'ZWIERZĘTA');
assert.equal(run("formatBombPromptLabel('Mówcie rzeczy czerwone!')"), 'RZECZY CZERWONE');
assert.equal(run("formatBombPromptLabel('Państwa w Europie?')"), 'PAŃSTWA W EUROPIE');
assert.equal(run("formatBombPromptLabel('')"), '');

const normalized = JSON.parse(run(`JSON.stringify(normalizeBombPromptContent(${JSON.stringify({
  categories: [{ id: 'x', name: 'X', words: [{ word: 'Wymieniajcie owoce.', hint: '' }, { word: 'Mówcie miasta!', hint: '' }] }]
})}))`));
assert.deepEqual(normalized.categories[0].words.map(entry => entry.word), ['OWOCE', 'MIASTA']);

assert.equal(content.game, 'ticking-bomb');
assert.equal(content.locale, 'pl');
assert.equal(content.categories.length, 8);
assert.equal(content.categories.reduce((sum, category) => sum + category.words.length, 0), 96);
assert.equal(content.categories.every(category => category.id && category.name && Array.isArray(category.words) && category.words.length > 0), true);
assert.equal(expanded.categories.length, 9);
assert.equal(expanded.categories.reduce((sum, category) => sum + category.words.length, 0), 1350);
assert.ok(expanded.categories.every(category => category.id && category.name && category.words.length >= 150));
assert.deepEqual(expanded.categories.filter(c => !c.adult).map(c => c.id), content.categories.map(c => c.id));
assert.equal(expanded.categories.filter(c => c.adult === true).length, 1);
assert.equal(expanded.categories.find(c => c.id === 'adult')?.adult, true);
assert.match(expanded.categories.find(c => c.id === 'adult').name, /18\+/);
assert.match(source, /localAdult/);
const prompts = expanded.categories.flatMap(category => category.words.map(entry => entry.word));
const normalizedPrompts = prompts.map(prompt => prompt.trim().replace(/[.!?]+$/g, '').toLocaleLowerCase('pl-PL'));
assert.equal(new Set(normalizedPrompts).size, prompts.length, 'Each prompt should be unique');
assert.ok(expanded.categories.every(category => category.words.every(entry =>
  typeof entry.word === 'string' &&
  /^(Wymieniajcie|Mówcie) /.test(entry.word) &&
  typeof entry.hint === 'string'
)));
for (const prompt of [
  'Wymieniajcie zwierzęta żyjące w lesie.',
  'Wymieniajcie dania z ziemniaków.',
  'Wymieniajcie rzeczy na kółkach.',
  'Wymieniajcie czynności przed snem.'
]) {
  assert.ok(prompts.includes(prompt), 'Expected rapid-fire prompt: ' + prompt);
}
for (const removedDuplicate of [
  'Wymieniajcie rzeczy, które można zgubić.',
  'Wymieniajcie przedmioty okrągłe.',
  'Wymieniajcie gatunki filmów.'
]) {
  assert.ok(!prompts.includes(removedDuplicate), 'Redundant prompt still exists: ' + removedDuplicate);
}

console.log('Ticking Bomb content behavior tests: OK');

// Adult content is bundled only for clients with explicit opt-in support.
const stateSource = fs.readFileSync(path.join(__dirname, '../assets/js/games/ticking-bomb/state.js'), 'utf8');
const setupSource = fs.readFileSync(path.join(__dirname, '../assets/js/games/ticking-bomb/setup.js'), 'utf8');
assert.match(stateSource, /getBombDefaultCategoryIds\(\)/);
assert.match(setupSource, /const allIds = getBombDefaultCategoryIds\(\)/);
assert.match(setupSource, /category\.adult === true/);

// Verify the actual loader on a remote-first startup: CMS normalization strips
// unknown fields, but the locally bundled adult flag must be restored.
(async () => {
  const remoteSafe = { ...expanded, categories: expanded.categories.filter(c => c.id !== 'adult') };
  const app = {
    console,
    fetch: async url => ({
      ok: url.endsWith('ticking-bomb-expanded.pl.json'),
      json: async () => expanded
    }),
    contentRepository: {
      validate: value => ({
        ...value,
        categories: value.categories.map(({ adult, ...category }) => ({ ...category }))
      }),
      loadRemote: async () => remoteSafe
    },
    normalizeBombActiveCategories() {}
  };
  vm.createContext(app);
  vm.runInContext(source, app);
  await vm.runInContext('initializeTickingBombContent()', app);
  const categories = JSON.parse(vm.runInContext('JSON.stringify(BOMB_CATEGORIES)', app));
  assert.equal(categories.length, 9, 'Local adult pack must be merged with normal remote content');
  assert.equal(categories.filter(c => c.adult === true).length, 1);
  assert.equal(categories.find(c => c.id === 'adult')?.words.length, 150);
  assert.equal(categories.filter(c => c.id !== 'adult').reduce((n,c) => n + c.words.length, 0), 1200);
})().catch(error => { console.error(error); process.exitCode = 1; });
