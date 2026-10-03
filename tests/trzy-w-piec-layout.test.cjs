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
assert.match(view, /class="three-five-timer-sweep"/);
assert.doesNotMatch(view, /three-five-timer-ticks|data-three-five-tick/);
assert.match(view, /data-three-five-preset[^>]*data-answers="3"[^>]*data-seconds="5"/);
assert.match(view, /data-three-five-preset[^>]*data-answers="5"[^>]*data-seconds="10"/);
assert.match(view, /id="three-five-answer-count"[^>]*min="1"[^>]*max="60"/);
assert.match(view, /id="three-five-turn-seconds"[^>]*min="1"[^>]*max="60"/);
assert.match(view, /id="screen-three-five-round-summary"/);
assert.match(view, /onclick="continueThreeFiveRound\(\)"/);
assert.match(view, /onclick="finishThreeFiveGame\(\)"/);
assert.match(view, /id="three-five-round-ranking"/);
assert.match(view, /id="three-five-final-ranking"/);

assert.match(game, /threeFiveState\.turnSeconds/);
assert.match(game, /threeFiveState\.answerCount/);
assert.match(game, /ThreeFiveRules\.formatPrompt/);
assert.match(game, /const elapsed = 1 - progress/);
assert.match(game, /--three-five-elapsed-angle/);
assert.match(game, /const totalMs = turnSeconds \* 1000/);
assert.match(game, /threeFiveRuntime\.endsAt = performance\.now\(\) \+ turnSeconds \* 1000/);
assert.doesNotMatch(game, /renderThreeFiveTimerTicks|data-three-five-tick|--tick-angle|ThreeFiveRules\.TURN_SECONDS/);
assert.match(game, /ThreeFiveRules\.isRoundComplete/);
assert.match(game, /threeFiveState\.awaitingRoundDecision = true/);
assert.match(game, /renderThreeFiveRoundSummary\(\)/);
assert.match(game, /renderThreeFiveFinalResults\(\)/);
assert.doesNotMatch(game, /hasWinner|targetScore/);

assert.match(layout, /from 0deg/);
assert.match(layout, /var\(--three-five-elapsed-angle\)/);
assert.match(layout, /\.three-five-timer-sweep[\s\S]*transform:\s*rotate\(var\(--three-five-elapsed-angle\)\)/);
assert.match(layout, /\.three-five-timer-sweep::before[\s\S]*top:\s*\.3rem/);
assert.match(layout, /\.three-five-timer\.is-running \.three-five-timer-sweep[\s\S]*opacity:\s*1/);
assert.match(layout, /\.three-five-timer\.is-expired \.three-five-timer-sweep[\s\S]*opacity:\s*0/);
assert.doesNotMatch(layout, /three-five-timer-tick|tick-angle|has-many-ticks|has-dense-ticks/);
assert.match(layout, /\.three-five-action-slot[\s\S]*min-height:\s*6\.8rem/);
assert.match(layout, /\.three-five-player-strip,[\s\S]*\.three-five-prompt-card,[\s\S]*\.three-five-action-slot[\s\S]*width:\s*min\(100%, 30rem\)/);
assert.match(layout, /\.three-five-round-ranking/);
assert.match(layout, /\.three-five-round-row/);
assert.match(index, /trzy-w-piec-layout\.css\?v=4/);

console.log('Trzy w Pięć timer, round decision and layout tests: OK');
