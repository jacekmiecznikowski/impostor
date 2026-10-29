const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const game=fs.readFileSync('assets/js/games/impostor/game.js','utf8');
const provider=fs.readFileSync('assets/js/games/impostor/content-provider.js','utf8');
assert.match(game,/Array\.isArray\(word\?\.hints\)/);
assert.match(game,/Math\.floor\(Math\.random\(\) \* hints\.length\)/);
assert.match(provider,/partyjniakMultiHints/);
assert.match(provider,/entry\.hints/);
const sandbox={state:{activeCategories:['a']},WORD_DATABASE:{a:[{word:'Test',hint:'Pierwsza',hints:['Pierwsza','Druga','Trzecia']}]},normalizeActiveCategories(){},Math:Object.create(Math)};
sandbox.Math.random=()=>0.51;
vm.createContext(sandbox);
vm.runInContext(game.slice(game.indexOf('function getRoundWord()'),game.indexOf('function startGameRound()')),sandbox);
assert.equal(sandbox.getRoundWord().hint,'Druga');
console.log('Impostor randomized hints: OK');


const expanded=JSON.parse(fs.readFileSync('content/impostor-expanded.pl.json','utf8'));
assert.equal(expanded.categories.length,35);
const all=expanded.categories.flatMap(c=>c.words);
assert.equal(all.length,1868);
assert.ok(expanded.categories.every(c=>c.words.length>=45));
assert.ok(all.every(w=>Array.isArray(w.hints)&&w.hints.length===3));
assert.ok(all.every(w=>w.hints.every(h=>typeof h==='string' && h.trim().length>0 && h.length<=80)));
assert.ok(all.every(w=>new Set(w.hints.map(h=>h.trim().toLocaleLowerCase('pl'))).size===3));
assert.ok(all.every(w=>w.word && w.word.trim() && w.word.length<=80));
assert.equal(new Set(all.map(w=>w.word.toLocaleLowerCase('pl'))).size,all.length);
assert.ok(expanded.categories.some(c=>c.id==='dla_doroslych'&&c.words.length>=150));
const adult=expanded.categories.find(c=>c.id==='dla_doroslych').words.map(w=>w.word);
for(const word of ['Niezręczna cisza','Feromony','Ślad po szmince','Skrzypiące łóżko']){
  assert.ok(adult.includes(word), 'Missing recognizable adult word: '+word);
}
for(const word of ['Niezręczna cisza po randce','Kuszący zapach perfum','Romantyczna kolacja z mikrofalówki','Gumowa kaczuszka w sypialni']){
  assert.ok(!adult.includes(word), 'Unplayable adult phrase: '+word);
}
// Deliberately do not impose a 2-word limit: clear expressions are valid game words.

const setup=fs.readFileSync('assets/js/games/impostor/setup.js','utf8');
assert.match(setup,/available\.filter\(id => id !== 'dla_doroslych'\)/);
assert.match(setup,/window\.confirm\('Ta kategoria zawiera humor/);
console.log('Expanded 18+ opt-in catalog: OK');
