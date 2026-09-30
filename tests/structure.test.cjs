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
  'assets/js/shared/game-themes.js',
  'assets/js/shared/outcome-audio-user.js',
  'assets/js/shared/outcome-audio.js',
  'assets/js/games/impostor/data.js',
  'assets/js/games/impostor/content-provider.js',
  'assets/js/games/impostor/rules.js',
  'assets/js/games/impostor/state.js',
  'assets/js/games/impostor/setup.js',
  'assets/js/games/impostor/game.js',
  'assets/js/games/impostor/presentation.js',
  'assets/js/games/impostor/reveal-fit.js',
  'assets/js/games/impostor/scoreboard.js',
  'assets/css/partyjniak.css',
  'assets/css/navigation.css',
  'assets/css/navigation-android.css',
  'assets/css/brand-theme.css',
  'assets/css/impostor-reveal-layout.css',
  'assets/icons/icon.svg',
  'assets/icons/icon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'views/impostor-setup.html',
  'views/impostor-round.html',
  'views/modals.html'
];

requiredFiles.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`));

const index = read('index.html');
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
assert.match(index, /assets\/icons\/icon\.svg/);
assert.match(index, /assets\/icons\/icon-32\.png/);
assert.match(index, /assets\/css\/brand-theme\.css/);
assert.match(index, /assets\/css\/impostor-reveal-layout\.css/);
assert.match(index, /assets\/css\/navigation\.css/);
assert.match(index, /assets\/css\/navigation-android\.css/);
assert.match(index, /assets\/js\/shared\/view-loader\.js/);
assert.match(index, /assets\/js\/shared\/outcome-audio-user\.js\?v=1/);
assert.match(index, /assets\/js\/shared\/outcome-audio\.js\?v=4/);
assert.match(index, /assets\/js\/shared\/navigation-behavior\.js/);
assert.match(index, /assets\/js\/shared\/game-themes\.js/);
assert.match(index, /assets\/js\/games\/impostor\/reveal-fit\.js/);
assert.match(index, /theme-color" content="#950f26"/);
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);
assert.doesNotMatch(index, /id="screen-menu"/);

const viewLoader = read('assets/js/shared/view-loader.js');
assert.match(viewLoader, /views\/impostor-setup\.html/);
assert.match(viewLoader, /views\/impostor-round\.html/);
assert.match(viewLoader, /views\/modals\.html/);

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

const themes = read('assets/js/shared/game-themes.js');
assert.match(themes, /PARTYJNIAK_GAME_THEMES/);
assert.match(themes, /accent: '#950f26'/);
assert.match(themes, /accent: '#14b8a6'/);
assert.match(themes, /'heads-up'/);
assert.match(themes, /taboo/);
assert.match(themes, /renderPartyjniakThemeMotifs/);

const revealFit = read('assets/js/games/impostor/reveal-fit.js');
assert.match(revealFit, /function fitRevealSecretWord/);
assert.match(revealFit, /ResizeObserver/);
assert.match(revealFit, /font-size/);

const outcomeAudioData = read('assets/js/shared/outcome-audio-user.js');
assert.match(outcomeAudioData, /data:audio\/mpeg;base64/);
assert.match(outcomeAudioData, /detectives:/);
assert.match(outcomeAudioData, /impostor:/);

const outcomeAudio = read('assets/js/shared/outcome-audio.js');
assert.match(outcomeAudio, /PARTYJNIAK_USER_OUTCOME_AUDIO\.impostor/);
assert.match(outcomeAudio, /PARTYJNIAK_USER_OUTCOME_AUDIO\.detectives/);
assert.match(outcomeAudio, /function playOutcomeSound/);
assert.doesNotMatch(outcomeAudio, /opengameart\.org/);
assert.doesNotMatch(outcomeAudio, /playOutcomeFallback|playSound\(/);

const hub = read('assets/js/shared/hub.js');
assert.match(hub, /navigation-sheet/);
assert.match(hub, /onclick="navigateBack\(\)"/);
assert.match(hub, /requestLeaveGame\('home'\)/);

const game = read('assets/js/games/impostor/game.js');
assert.doesNotMatch(game, /function renderGroupVotingScreen/);
assert.match(game, /ImpostorRules\.assignRoles/);
assert.match(game, /ImpostorRules\.scoreVote/);
assert.match(game, /playOutcomeSound/);
assert.match(game, /scheduleRevealWordFit/);
assert.doesNotMatch(game, /playSound\(caughtImpostor/);

const background = read('assets/js/shared/background.js');
assert.match(background, /if \(!PhaserLib\)/);
assert.doesNotMatch(background, /class BackgroundScene extends Phaser\.Scene/);

const sw = read('sw.js');
assert.match(sw, /CACHE_VERSION = 'v20'/);
assert.match(sw, /assets\/icons\/icon-32\.png/);
assert.match(sw, /assets\/css\/brand-theme\.css/);
assert.match(sw, /assets\/css\/impostor-reveal-layout\.css/);
assert.match(sw, /assets\/js\/shared\/game-themes\.js/);
assert.match(sw, /assets\/js\/shared\/outcome-audio-user\.js\?v=1/);
assert.match(sw, /assets\/js\/shared\/outcome-audio\.js\?v=4/);
assert.match(sw, /assets\/js\/games\/impostor\/reveal-fit\.js/);
assert.doesNotMatch(sw, /opengameart\.org/);

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.short_name, 'Partyjniak');
assert.equal(manifest.theme_color, '#950f26');
assert.equal(manifest.background_color, '#06050a');
assert.equal(manifest.icons.some(icon => icon.purpose === 'maskable'), true);

console.log('Structure, branding, reveal UX, embedded audio, navigation and integration tests: OK');
