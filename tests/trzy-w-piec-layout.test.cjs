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
assert.match(view, /id="three-five-timer-ticks"/);
assert.match(view, /data-three-five-preset[^>]*data-answers="3"[^>]*data-seconds="5"/);
assert.match(view, /data-three-five-preset[^>]*data-answers="5"[^>]*data-seconds="10"/);
assert.match(view, /id="three-five-answer-count"[^>]*min="1"[^>]*max="60"/);
assert.match(view, /id="three-five-turn-seconds"[^>]*min="1"[^>]*max="60"/);

assert.match(game, /threeFiveState\.turnSeconds/);
assert.match(game, /threeFiveState\.answerCount/);
assert.match(game, /ThreeFiveRules\.formatPrompt/);
assert.match(game, /for \(let index = 0; index < total; index \+= 1\)/);
assert.match(game, /--tick-angle/);
assert.match(game, /const totalMs = turnSeconds \* 1000/);
assert.match(game, /threeFiveRuntime\.endsAt = performance\.now\(\) \+ turnSeconds \* 1000/);
assert.doesNotMatch(game, /ThreeFiveRules\.TURN_SECONDS/);
assert.match(game, /tickValue > seconds/);

assert.match(layout, /var\(--three-five-elapsed-angle\)/);
assert.match(layout, /\.three-five-timer-tick,[\s\S]*inset:\s*7%/);
assert.match(layout, /\.three-five-timer-tick::before[\s\S]*top:\s*4px/);
assert.match(layout, /transform:\s*rotate\(var\(--tick-angle\)\)/);
assert.match(layout, /\.three-five-action-slot[\s\S]*min-height:\s*6\.8rem/);
assert.match(layout, /\.three-five-player-strip,[\s\S]*\.three-five-prompt-card,[\s\S]*\.three-five-action-slot[\s\S]*width:\s*min\(100%, 30rem\)/);
assert.match(index, /trzy-w-piec-layout\.css\?v=2/);

console.log('Trzy w Pięć timer order and layout tests: OK');
