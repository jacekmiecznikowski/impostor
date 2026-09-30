const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/shared/content-repository.js'), 'utf8');
const storage = new Map();
const sandbox = {
  window: { location: { origin: 'https://partyjniak.test' } },
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  URL,
  console,
  setTimeout,
  clearTimeout,
  AbortController,
  fetch: async () => { throw new Error('offline'); }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const repository = sandbox.window.PartyjniakContent.repository;
const valid = repository.validate({
  schemaVersion: 1,
  game: 'impostor',
  locale: 'pl',
  categories: [{ id: 'jedzenie', name: 'Jedzenie', icon: 'fa-burger', desc: 'Jedzenie', words: [{ word: 'Pizza', hint: 'Ser' }] }],
  discussionTips: ['Pytaj ostrożnie.']
}, 'impostor', 'pl');
assert.equal(valid.categories[0].words[0].word, 'Pizza');

assert.throws(() => repository.validate({ game: 'impostor', categories: [{ id: '__proto__', name: 'X', words: [{ word: 'Y' }] }] }, 'impostor', 'pl'));
assert.throws(() => repository.validate({ game: 'impostor', categories: [{ id: 'x', name: 'X', icon: 'fa-x\" onclick=alert(1)', words: [{ word: 'Y' }] }] }, 'impostor', 'pl'));
assert.throws(() => repository.setRemoteBaseUrl('javascript:alert(1)'));

console.log('Content repository tests: OK');
