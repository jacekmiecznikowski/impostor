const fs = require('fs');
const vm = require('vm');

const fakeEls = new Map();
const makeEl = () => ({
  innerText: '', textContent: '', innerHTML: '', className: '', disabled: false,
  style: {}, dataset: {}, value: '',
  classList: { add(){}, remove(){}, toggle(){} },
  setAttribute(){}, appendChild(){}, append(){}, replaceChildren(){}, focus(){ this.focused = true; }
});
const document = {
  getElementById(id) { if (!fakeEls.has(id)) fakeEls.set(id, makeEl()); return fakeEls.get(id); },
  querySelectorAll() { return []; },
  createElement() { return makeEl(); },
  createTextNode(text) { return { textContent: text }; }
};
const context = vm.createContext({
  console, Math, JSON, Number, String, Object, Array, Set,
  document,
  localStorage: { getItem(){return null;}, setItem(){}, removeItem(){} },
  window: {},
  setTimeout, clearTimeout, setInterval, clearInterval
});
for (const file of ['assets/js/data.js','assets/js/state.js','assets/js/game.js','assets/js/setup.js']) {
  vm.runInContext(fs.readFileSync(file,'utf8'), context, { filename: file });
}
vm.runInContext(`
  playSound = () => {};
  showToast = (title, message) => { globalThis.lastToast = {title, message}; };
  goToScreen = () => {};
  persistSession = () => {};
  updateHintModeUI = () => {};
  updateImpostorButtonsUI = () => {};
  renderResultsScreen = () => {};
`, context);

function assert(cond, msg) { if (!cond) throw new Error(msg); }

vm.runInContext(`
state.players = [1,2,3,4].map(id => ({id, name:'G'+id, score:0}));
state.playerCount = 4;
state.impostorCount = 1;
state.hintMode = 'none';
state.activeCategories = ['jedzenie'];
startGameRound();
`, context);
let result = vm.runInContext(`({imp: state.impostorIds.length, roles: Object.values(state.playerRoles), players: state.players.length})`, context);
assert(result.imp === 1, 'Powinien być dokładnie 1 impostor');
assert(result.roles.length === 4, 'Każdy gracz powinien dostać rolę');
assert(result.roles.filter(r => r.isImpostor).length === 1, 'Rola impostora ma być dokładnie jedna');
assert(result.roles.find(r => r.isImpostor).word === 'Brak podpowiedzi', 'Tryb none nie może dawać podpowiedzi');

vm.runInContext(`
state.selectedVotedPlayerId = state.impostorIds[0];
submitGroupVote();
`, context);
result = vm.runInContext(`({scores: state.players.map(p=>p.score), impId: state.impostorIds[0]})`, context);
result.scores.forEach((score, idx) => {
  const id = idx + 1;
  assert(score === (id === result.impId ? 0 : 2), 'Niepoprawna punktacja po złapaniu impostora');
});

for (let i=0;i<3;i++) {
  const el = document.getElementById('player-name-'+i);
  el.value = i < 2 ? 'Ala' : 'Ola';
  el.dataset.score = '0';
}
vm.runInContext(`state.playerCount=3; state.players=[]; globalThis.lastToast=null; goToSetupOptions();`, context);
const dup = vm.runInContext(`globalThis.lastToast`, context);
assert(dup && dup.title === 'Powtórzone imię', 'Duplikaty imion powinny być blokowane');

console.log('Core logic tests: OK');
