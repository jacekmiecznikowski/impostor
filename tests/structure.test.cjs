const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  'assets/js/shared/view-loader.js',
  'assets/js/shared/platform.js',
  'assets/js/shared/content-repository.js',
  'assets/js/shared/ui.js',
  'assets/js/shared/hub.js',
  'assets/js/shared/navigation-behavior.js',
  'assets/js/games/impostor/data.js',
  'assets/js/games/impostor/content-provider.js',
  'assets/js/games/impostor/rules.js',
  'assets/js/games/impostor/state.js',
  'assets/js/games/impostor/setup.js',
  'assets/js/games/impostor/game.js',
  'assets/js/games/impostor/presentation.js',
  'assets/js/games/impostor/scoreboard.js',
  'assets/css/partyjniak.css',
  'assets/css/navigation.css',
  'assets/css/navigation-android.css',
  'views/impostor-setup.html',
  'views/impostor-round.html',
  'views/modals.html'
];

requiredFiles.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`));

const index = read('index.html');
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
assert.match(index, /assets\/css\/navigation\.css/);
assert.match(index, /assets\/css\/navigation-android\.css/);
assert.match(index, /assets\/js\/shared\/view-loader\.js/);
assert.match(index, /assets\/js\/shared\/navigation-behavior\.js/);
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);
assert.doesNotMatch(index, /id="screen-menu"/);

const viewLoader = read('assets/js/shared/view-loader.js');
assert.match(viewLoader, /views\/impostor-setup\.html/);
assert.match(viewLoader, /views\/impostor-round\.html/);
assert.match(viewLoader, /views\/modals\.html/);

const setupView = read('views/impostor-setup.html');
const roundView = read('views/impostor-round.html');
const modalsView = read('views/modals.html');
assert.match(setupView, /id="screen-menu"/);
assert.match(setupView, /id="screen-setup-options"/);
assert.match(roundView, /id="screen-reveal"/);
assert.match(roundView, /id="screen-group-voting"/);
assert.match(modalsView, /id="score-modal"/);

const platform = read('assets/js/shared/platform.js');
assert.doesNotMatch(platform, /awake-mode-note|Ekran pozostanie włączony/);

const ui = read('assets/js/shared/ui.js');
assert.match(ui, /function navigateBack/);
assert.match(ui, /function setupSystemBackHandling/);
assert.match(ui, /ROUND_GUARDED_SCREENS/);
assert.match(ui, /openNavigationSheet/);

const navigationBehavior = read('assets/js/shared/navigation-behavior.js');
assert.match(navigationBehavior, /IMMERSIVE_SCREENS\.delete\('results'\)/);
assert.match(navigationBehavior, /fa-pause/);

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
assert.match(sw, /CACHE_VERSION = 'v16'/);
assert.match(sw, /views\/impostor-setup\.html/);
assert.match(sw, /assets\/css\/navigation-android\.css/);
assert.match(sw, /assets\/js\/shared\/navigation-behavior\.js/);

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.short_name, 'Partyjniak');

console.log('Structure, navigation and integration tests: OK');
