const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  'assets/js/shared/platform.js',
  'assets/js/shared/content-repository.js',
  'assets/js/shared/ui.js',
  'assets/js/shared/hub.js',
  'assets/js/games/impostor/data.js',
  'assets/js/games/impostor/content-provider.js',
  'assets/js/games/impostor/rules.js',
  'assets/js/games/impostor/state.js',
  'assets/js/games/impostor/setup.js',
  'assets/js/games/impostor/game.js',
  'assets/js/games/impostor/presentation.js',
  'assets/js/games/impostor/scoreboard.js',
  'assets/css/partyjniak.css',
  'assets/css/navigation.css'
];

requiredFiles.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`));

const index = read('index.html');
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
assert.match(index, /assets\/css\/partyjniak\.css/);
assert.match(index, /assets\/css\/navigation\.css/);
assert.match(index, /assets\/js\/shared\/content-repository\.js/);
assert.match(index, /assets\/js\/games\/impostor\/content-provider\.js/);
assert.match(index, /assets\/js\/games\/impostor\/rules\.js/);
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);

const platform = read('assets/js/shared/platform.js');
assert.doesNotMatch(platform, /awake-mode-note|Ekran pozostanie włączony/);

const ui = read('assets/js/shared/ui.js');
assert.match(ui, /function navigateBack/);
assert.match(ui, /function setupSystemBackHandling/);
assert.match(ui, /ROUND_GUARDED_SCREENS/);
assert.match(ui, /openNavigationSheet/);

const hub = read('assets/js/shared/hub.js');
assert.match(hub, /navigation-sheet/);
assert.match(hub, /onclick="navigateBack\(\)"/);
assert.match(hub, /requestLeaveGame\('home'\)/);

const setup = read('assets/js/games/impostor/setup.js');
assert.doesNotMatch(setup, /button\.innerHTML\s*=/);
assert.match(setup, /textContent = category\.name/);

const game = read('assets/js/games/impostor/game.js');
assert.doesNotMatch(game, /function renderGroupVotingScreen/);
assert.match(game, /ImpostorRules\.assignRoles/);
assert.match(game, /ImpostorRules\.scoreVote/);

const background = read('assets/js/shared/background.js');
assert.match(background, /if \(!PhaserLib\)/);
assert.doesNotMatch(background, /class BackgroundScene extends Phaser\.Scene/);

const sw = read('sw.js');
assert.match(sw, /CACHE_VERSION = 'v14'/);
assert.match(sw, /assets\/css\/navigation\.css/);

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.short_name, 'Partyjniak');

console.log('Structure, navigation and integration tests: OK');
