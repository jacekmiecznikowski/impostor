const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ThreeFiveRules = require('../assets/js/games/trzy-w-piec/rules.js');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/games/trzy-w-piec/game.js'), 'utf8');
const elements = new Map();
function element(id) {
  if (!elements.has(id)) {
    elements.set(id, {
      id,
      textContent: '',
      dataset: {},
      style: { setProperty() {} },
      classList: { add() {}, remove() {}, toggle() {} },
      offsetWidth: 100
    });
  }
  return elements.get(id);
}

const sandbox = {
  console,
  ThreeFiveRules,
  threeFiveState: {
    players: [{ name: 'Ala', score: 0, turns: 0 }],
    currentPlayerIndex: 0,
    answerCount: 5,
    turnSeconds: 10,
    targetScore: 10,
    turnNumber: 0,
    activeCategories: [],
    recentPromptIds: []
  },
  THREE_FIVE_CATEGORIES: [],
  performance: { now: () => 100 },
  document: {
    getElementById: id => element(id)
  },
  navigator: { vibrate() {} },
  setInterval: () => 123,
  clearInterval() {},
  setGameAwakeMode() {},
  playSound() {},
  showToast() {},
  goToScreen() {},
  persistThreeFiveSession() {},
  renderThreeFiveWinner() {}
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__threeFiveGameTest = { threeFiveRuntime, startThreeFiveCountdown, renderThreeFivePlayScreen, getThreeFiveSecondUnit };`, sandbox);

const api = sandbox.__threeFiveGameTest;
api.threeFiveRuntime.currentPrompt = { id: 'x', text: 'Wymień 3 rzeczy na plaży.', categoryName: 'Świat' };
api.renderThreeFivePlayScreen();
assert.equal(element('three-five-timer-value').textContent, '10');
assert.equal(element('three-five-prompt-text').textContent, 'Wymień 5 rzeczy na plaży.');
assert.equal(element('three-five-prompt-rule-text').textContent, 'Podaj dokładnie 5 odpowiedzi');
assert.equal(element('three-five-start-copy').textContent, 'Od tej chwili masz 10 sekund');

api.startThreeFiveCountdown();
assert.equal(api.threeFiveRuntime.lastWholeSecond, 10);
assert.equal(api.threeFiveRuntime.endsAt, 10100, '10-second preset must actually schedule a ten-second countdown');

assert.equal(api.getThreeFiveSecondUnit(1), 'sekunda');
assert.equal(api.getThreeFiveSecondUnit(2), 'sekundy');
assert.equal(api.getThreeFiveSecondUnit(12), 'sekund');
assert.equal(api.getThreeFiveSecondUnit(22), 'sekundy');
assert.equal(api.getThreeFiveSecondUnit(24), 'sekundy');
assert.equal(api.getThreeFiveSecondUnit(25), 'sekund');

console.log('Trzy w Pięć gameplay parameter tests: OK');
