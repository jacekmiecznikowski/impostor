const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const view = read('views/trzy-w-piec.html');
const game = read('assets/js/games/trzy-w-piec/game.js');
const layout = read('assets/css/trzy-w-piec-layout.css');
const index = read('index.html');

assert.match(view, /id="three-five-timer-unit"/);
assert.match(view, /class="three-five-action-slot"/);
assert.match(view, /data-three-five-tick="5"[^>]*--tick-index:0/);
assert.match(view, /data-three-five-tick="4"[^>]*--tick-index:1/);
assert.match(view, /data-three-five-tick="3"[^>]*--tick-index:2/);
assert.match(view, /data-three-five-tick="2"[^>]*--tick-index:3/);
assert.match(view, /data-three-five-tick="1"[^>]*--tick-index:4/);

assert.match(game, /const elapsed = 1 - progress/);
assert.match(game, /--three-five-elapsed/);
assert.match(game, /tickValue > seconds/);
assert.match(game, /getThreeFiveSecondUnit/);
assert.match(game, /value === 1\) return 'sekunda'/);
assert.match(game, /\[2, 3, 4\]\.includes\(value\).*'sekundy'/s);

assert.match(layout, /calc\(var\(--three-five-elapsed\) \* 1turn\)/);
assert.match(layout, /translate:\s*-50% -50%/);
assert.match(layout, /--three-five-tick-radius/);
assert.match(layout, /\.three-five-action-slot[\s\S]*min-height:\s*6\.8rem/);
assert.match(layout, /\.three-five-player-strip,[\s\S]*\.three-five-prompt-card,[\s\S]*\.three-five-action-slot[\s\S]*width:\s*min\(100%, 30rem\)/);
assert.match(index, /trzy-w-piec-layout\.css\?v=1/);

console.log('Trzy w Pięć timer order and layout tests: OK');
