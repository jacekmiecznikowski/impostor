const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const screens = [
  ['impostor-setup', 'setup-options', 'categories-grid'],
  ['ticking-bomb', 'bomb-options', 'bomb-category-grid'],
  ['naokolo', 'naokolo-options', 'naokolo-category-grid'],
  ['co-mam-na-mysli', 'cmm-options', 'cmm-category-grid'],
  ['trzy-w-piec', 'three-five-options', 'three-five-category-grid'],
  ['synchronizacja', 'sync-options', 'sync-category-grid']
];

for (const [file, screen, grid] of screens) {
  const html = read(`views/${file}.html`);
  assert.match(html, new RegExp(`id="screen-${screen}"[^>]*party-options-screen|party-options-screen[^>]*id="screen-${screen}"`));
  assert.doesNotMatch(html, /class="party-options-header"/, 'The global shell is already the settings header');
  assert.match(html, /class="party-options-content"/);
  assert.match(html, /party-options-panel/);
  assert.match(html, /party-options-cta/);
  assert.match(html, new RegExp(`id="${grid}-search"`));
  assert.match(html, new RegExp(`id="${grid}-summary"`));
  assert.match(html, new RegExp(`syncPartyCategoryGrid\\('${grid}'\\)`));
  assert.match(html, /Wszystkie<\/button>/);
  assert.match(html, /Wyczyść<\/button>/);
}
// Trzy w Pięć must load its category pack before its options screen is shown.
assert.match(read('assets/js/games/trzy-w-piec/bootstrap.js'), /await initializeThreeFiveContent\(\)/);
const setups = [
  ['impostor', 'wordCount} haseł'],
  ['ticking-bomb', 'category.words.length} pytań'],
  ['naokolo', 'category.cards.length} kart'],
  ['co-mam-na-mysli', 'category.words.length} haseł'],
  ['trzy-w-piec', 'category.prompts.length} pytań'],
  ['synchronizacja', 'category.scales.length} skal']
];
for (const [game, metric] of setups) {
  const source = read(`assets/js/games/${game}/setup.js`);
  assert.ok(source.includes(metric), `Count missing for ${game}`);
  assert.doesNotMatch(source, /desc\.textContent\s*=\s*category\.desc/);
  assert.doesNotMatch(source, /\${category\.desc}/);
}
const css = read('assets/css/category-setup.css');
for (const selector of ['party-options-screen', 'party-options-content', 'party-options-panel', 'party-options-cta', 'party-category-search', 'party-category-actions']) {
  assert.ok(css.includes(selector), `No CSS for ${selector}`);
}
assert.match(read('index.html'), /assets\/js\/shared\/category-setup\.js/);
assert.match(read('sw.js'), /assets\/js\/shared\/category-setup\.js/);

function fakeCard(text, selected = false) {
  return {
    textContent: text,
    hidden: false,
    classList: { contains(name) { return name === 'is-selected' && selected; } }
  };
}
const cards = [fakeCard('Sport i rekreacja', true), fakeCard('Jedzenie i smaki', false), fakeCard('Zwierzęta i natura', true)];
const summary = { textContent: '' };
const input = { value: '' };
const grid = { querySelectorAll(selector) { assert.equal(selector, '.party-category-card'); return cards; } };
const nodes = { test: grid, 'test-search': input, 'test-summary': summary };
const sandbox = { document: { getElementById(id) { return nodes[id]; } } };
vm.createContext(sandbox);
vm.runInContext(read('assets/js/shared/category-setup.js'), sandbox);
const sync = vm.runInContext('syncPartyCategoryGrid', sandbox);
sync('test');
assert.equal(summary.textContent, '2 z 3 zaznaczonych · min. 1');
input.value = 'ZWIERZETA';
sync('test');
assert.deepEqual(cards.map(c => c.hidden), [true, true, false], 'Polish accents should not block searching');
input.value = 'nie istnieje';
sync('test');
assert.equal(cards.every(c => c.hidden), true);
assert.match(summary.textContent, /Brak pasujących kategorii/);
input.value = '';
sync('test');
assert.equal(cards.every(c => !c.hidden), true);
assert.equal(cards.filter(c => c.classList.contains('is-selected')).length, 2, 'Filtering must never change selected categories');

console.log('Category picker layout, filtering and selection tests: OK');
