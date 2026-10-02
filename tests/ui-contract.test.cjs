const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const impostorSetup = read('views/impostor-setup.html');
assert.match(impostorSetup, /GRAJ Z POPRZEDNIĄ EKIPĄ/);
assert.doesNotMatch(impostorSetup, /Wznów ostatnią sesję/);

const bombView = read('views/ticking-bomb.html');
assert.match(bombView, /id="bomb-visual"[^>]*bomb-ignite-control/);
assert.match(bombView, /onclick="igniteBomb\(\)"/);
assert.match(bombView, /DOTKNIJ, ABY ODPALIĆ/);
assert.doesNotMatch(bombView, /id="bomb-ignite-btn"/);
assert.match(bombView, /U KOGO WYBUCHŁA BOMBA\?/);
assert.match(bombView, /id="bomb-manual-loser-list"/);
assert.doesNotMatch(bombView, /KTO WYGRYWA TĘ RUNDĘ\?/);

const bombGame = read('assets/js/games/ticking-bomb/game.js');
assert.doesNotMatch(bombGame, /setInterval\(\s*updateBombProgress/);
assert.doesNotMatch(bombGame, /setBombTickRate\(/);

const colorSystem = read('assets/css/game-color-system.css');
assert.match(colorSystem, /body\[data-game="home"\]/);
assert.match(colorSystem, /body\[data-game="impostor"\]/);
assert.match(colorSystem, /body\[data-game="ticking-bomb"\]/);
assert.match(colorSystem, /--ui-accent: #950f26/);
assert.match(colorSystem, /--ui-accent: #14b8a6/);
assert.match(colorSystem, /--ui-accent: #f97316/);

const bombMobile = read('assets/css/ticking-bomb-mobile.css');
assert.match(bombMobile, /\.bomb-ignite-control/);
assert.match(bombMobile, /#screen-bomb-result \.bomb-result-player-list/);

console.log('Critical Partyjniak UI contracts: OK');
