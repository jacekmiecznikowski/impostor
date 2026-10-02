const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const impostorSetup = read('views/impostor-setup.html');
assert.match(impostorSetup, /GRAJ Z POPRZEDNIĄ EKIPĄ/);
assert.doesNotMatch(impostorSetup, /Wznów ostatnią sesję/);
assert.match(impostorSetup, /player-setup-screen/);
assert.match(impostorSetup, /id="name-inputs-container"/);
assert.doesNotMatch(impostorSetup, /id="screen-setup-names"/);
assert.match(impostorSetup, /Krok 2 z 2/);

const impostorPlayerSetup = read('assets/js/games/impostor/setup.js');
const bombPlayerSetup = read('assets/js/games/ticking-bomb/setup.js');
const naokoloPlayerSetup = read('assets/js/games/naokolo/setup.js');
for (const source of [impostorPlayerSetup, bombPlayerSetup, naokoloPlayerSetup]) {
  assert.match(source, /renderPlayerSetupNames\(/);
  assert.match(source, /syncPlayerSetupCount\(/);
  assert.match(source, /playPlayerSetupCountFeedback\(\)/);
}

const sharedPlayerSetup = read('assets/css/player-setup.css');
assert.match(sharedPlayerSetup, /--ui-accent/);
assert.match(sharedPlayerSetup, /\.player-setup-name-row/);
assert.match(sharedPlayerSetup, /#screen-bomb-players \.bomb-setup-card/);

const bombView = read('views/ticking-bomb.html');
assert.match(bombView, /id="bomb-visual"[^>]*bomb-ignite-control/);
assert.match(bombView, /onclick="igniteBomb\(\)"/);
assert.match(bombView, /DOTKNIJ, ABY ODPALIĆ/);
assert.doesNotMatch(bombView, /id="bomb-ignite-btn"/);
assert.match(bombView, /U KOGO WYBUCHŁA BOMBA\?/);
assert.match(bombView, /id="bomb-manual-loser-list"/);
assert.doesNotMatch(bombView, /KTO WYGRYWA TĘ RUNDĘ\?/);
assert.match(bombView, /bomb-art-cap" transform="translate\(145 80\) rotate\(45\)"/);
assert.match(bombView, /M151 74 C160 62 166 52 178 46 C187 42 192 35 194 26/);

const bombGame = read('assets/js/games/ticking-bomb/game.js');
assert.doesNotMatch(bombGame, /setInterval\(\s*updateBombProgress/);
assert.doesNotMatch(bombGame, /setBombTickRate\(/);

const naokoloView = read('views/naokolo.html');
assert.match(naokoloView, /id="screen-naokolo-players"[^>]*player-setup-screen/);
assert.match(naokoloView, /id="naokolo-player-count"[^>]*min="2"[^>]*max="12"/);
assert.match(naokoloView, /markNaokoloCard\('guessed'\)/);
assert.match(naokoloView, /markNaokoloCard\('skipped'\)/);
assert.match(naokoloView, /markNaokoloCard\('forbidden'\)/);
assert.match(naokoloView, /id="naokolo-timer-value"/);
assert.match(naokoloView, /id="naokolo-forbidden-list"/);
const naokoloGame = read('assets/js/games/naokolo/game.js');
assert.match(naokoloGame, /setInterval\(updateNaokoloTimer, 200\)/);
assert.match(naokoloGame, /NaokoloRules\.scoreTurn/);

const colorSystem = read('assets/css/game-color-system.css');
assert.match(colorSystem, /--ui-accent:/);
assert.match(colorSystem, /--ui-accent-strong:/);
assert.match(colorSystem, /--ui-accent-alt:/);
assert.match(colorSystem, /--ui-accent-rgb:/);
assert.match(colorSystem, /--page-glow-rgb:/);
assert.match(colorSystem, /var\(--ui-accent\)/);
assert.doesNotMatch(colorSystem, /body\[data-game=/);

const bombMobile = read('assets/css/ticking-bomb-mobile.css');
assert.match(bombMobile, /\.bomb-ignite-control/);
assert.match(bombMobile, /#screen-bomb-result \.bomb-result-player-list/);

console.log('Critical Partyjniak UI contracts: OK');
