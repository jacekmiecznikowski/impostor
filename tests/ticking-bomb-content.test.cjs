const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/ticking-bomb/content-provider.js'), 'utf8');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, '../content/ticking-bomb.pl.json'), 'utf8'));

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
assert.equal(content.categories.reduce((sum, category) => sum + category.words.length, 0), 211);
assert.equal(content.categories.every(category => category.id && category.name && Array.isArray(category.words) && category.words.length >= 25), true);
const prompts = content.categories.flatMap(category => category.words.map(entry => entry.word));
const normalizedPrompts = prompts.map(prompt => prompt.trim().replace(/[.!?]+$/g, '').toLocaleLowerCase('pl-PL'));
assert.equal(new Set(normalizedPrompts).size, prompts.length, 'Each prompt should be unique');
assert.ok(content.categories.every(category => category.words.every(entry =>
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
