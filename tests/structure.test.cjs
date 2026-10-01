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
  'assets/js/shared/native-android.js',
  'assets/js/shared/outcome-audio.js',
  'assets/audio/crewmates-win.mp3.b64',
  'assets/audio/impostor-win.0.b64',
  'assets/audio/impostor-win.1.b64',
  'assets/audio/impostor-win.2.b64',
  'assets/audio/impostor-win.3.b64',
  'assets/audio/impostor-win.4.b64',
  'assets/audio/bomb-tick.b64',
  'assets/audio/bomb-explosion.b64',
  'assets/js/games/impostor/data.js',
  'assets/js/games/impostor/content-provider.js',
  'assets/js/games/impostor/rules.js',
  'assets/js/games/impostor/state.js',
  'assets/js/games/impostor/setup.js',
  'assets/js/games/impostor/game.js',
  'assets/js/games/impostor/presentation.js',
  'assets/js/games/impostor/reveal-fit.js',
  'assets/js/games/impostor/scoreboard.js',
  'assets/js/games/ticking-bomb/content-provider.js',
  'assets/js/games/ticking-bomb/state.js',
  'assets/js/games/ticking-bomb/audio.js',
  'assets/js/games/ticking-bomb/setup.js',
  'assets/js/games/ticking-bomb/game.js',
  'assets/js/games/ticking-bomb/scoreboard.js',
  'assets/js/games/ticking-bomb/integration.js',
  'content/ticking-bomb.pl.json',
  'assets/css/partyjniak.css',
  'assets/css/navigation.css',
  'assets/css/navigation-android.css',
  'assets/css/brand-theme.css',
  'assets/css/impostor-reveal-layout.css',
  'assets/css/ticking-bomb.css',
  'assets/css/ticking-bomb-mobile.css',
  'assets/css/ticking-bomb-theme.css',
  'assets/icons/icon.svg',
  'assets/icons/icon-32.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png',
  'views/impostor-setup.html',
  'views/impostor-round.html',
  'views/ticking-bomb.html',
  'views/ticking-bomb-modals.html',
  'views/modals.html',
  'capacitor.config.json',
  'scripts/prepare-web.mjs',
  'scripts/patch-android.mjs'
];

requiredFiles.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`));

const index = read('index.html');
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
assert.match(index, /assets\/icons\/icon\.svg/);
assert.match(index, /assets\/icons\/icon-32\.png/);
assert.match(index, /assets\/css\/brand-theme\.css/);
assert.match(index, /assets\/css\/impostor-reveal-layout\.css/);
assert.match(index, /assets\/css\/ticking-bomb\.css/);
assert.match(index, /assets\/css\/ticking-bomb-mobile\.css/);
assert.match(index, /assets\/css\/ticking-bomb-theme\.css/);
assert.match(index, /assets\/css\/navigation\.css/);
assert.match(index, /assets\/css\/navigation-android\.css/);
assert.match(index, /assets\/js\/shared\/view-loader\.js/);
assert.match(index, /assets\/js\/shared\/outcome-audio\.js\?v=6/);
assert.doesNotMatch(index, /outcome-audio-user/);
assert.match(index, /assets\/js\/shared\/native-android\.js/);
assert.match(index, /assets\/js\/shared\/navigation-behavior\.js/);
assert.match(index, /assets\/js\/shared\/game-themes\.js/);
assert.match(index, /assets\/js\/games\/impostor\/reveal-fit\.js/);
assert.match(index, /assets\/js\/games\/ticking-bomb\/integration\.js/);
assert.match(index, /assets\/js\/games\/ticking-bomb\/game\.js/);
assert.match(index, /theme-color" content="#950f26"/);
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);
assert.doesNotMatch(index, /id="screen-menu"/);

const platform = read('assets/js/shared/platform.js');
assert.doesNotMatch(platform, /awake-mode-note|Ekran pozostanie włączony/);

const ui = read('assets/js/shared/ui.js');
assert.match(ui, /function navigateBack/);
assert.match(ui, /function setupSystemBackHandling/);
assert.match(ui, /ROUND_GUARDED_SCREENS/);
assert.match(ui, /openNavigationSheet/);

const navigation = read('assets/js/shared/navigation-behavior.js');
assert.match(navigation, /bomb-play/);

const nativeAndroid = read('assets/js/shared/native-android.js');
assert.match(nativeAndroid, /function isPartyjniakNative/);
assert.match(nativeAndroid, /backButton/);
assert.match(nativeAndroid, /exitApp/);

const app = read('assets/js/app.js');
assert.match(app, /setupNativeAndroidIntegration/);
assert.match(app, /initializeTickingBombContent/);
assert.match(app, /loadBombSession/);
assert.match(app, /!nativeApp && 'serviceWorker' in navigator/);

const revealFit = read('assets/js/games/impostor/reveal-fit.js');
assert.match(revealFit, /function fitRevealSecretWord/);
assert.match(revealFit, /ResizeObserver/);

const outcomeAudio = read('assets/js/shared/outcome-audio.js');
assert.match(outcomeAudio, /crewmates-win\.mp3\.b64/);
assert.match(outcomeAudio, /impostor-win\.0\.b64/);
assert.match(outcomeAudio, /impostor-win\.4\.b64/);
assert.match(outcomeAudio, /function playOutcomeSound/);
assert.match(outcomeAudio, /function stopOutcomeSound/);
assert.match(outcomeAudio, /outcomePlaybackRequest/);
assert.match(outcomeAudio, /requestId !== outcomePlaybackRequest/);
assert.match(outcomeAudio, /decodeBase64Bytes/);
assert.doesNotMatch(outcomeAudio, /PARTYJNIAK_USER_OUTCOME_AUDIO|playSound\(/);

const game = read('assets/js/games/impostor/game.js');
assert.doesNotMatch(game, /function renderGroupVotingScreen/);
assert.match(game, /ImpostorRules\.assignRoles/);
assert.match(game, /ImpostorRules\.scoreVote/);
assert.match(game, /playOutcomeSound\(caughtImpostor \? 'detectives' : 'impostor'\)/);
assert.doesNotMatch(game, /playSound\(caughtImpostor \? 'success' : 'failure'\)/);

const bombState = read('assets/js/games/ticking-bomb/state.js');
assert.match(bombState, /hasSavedSession: false/);
assert.match(bombState, /function resetBombSession/);
assert.match(bombState, /removeItem\(BOMB_SESSION_STORAGE_KEY\)/);

const bombSetup = read('assets/js/games/ticking-bomb/setup.js');
assert.match(bombSetup, /resetBombSession\(\)/);
assert.match(bombSetup, /bombState\.hasSavedSession/);

const bombGame = read('assets/js/games/ticking-bomb/game.js');
assert.match(bombGame, /resultTimeoutId/);
assert.match(bombGame, /clearTimeout\(bombRuntime\.resultTimeoutId\)/);
assert.match(bombGame, /now - bombRuntime\.lastPassAt < 250/);
assert.doesNotMatch(bombGame, /setInterval\(updateBombProgress/);
assert.doesNotMatch(bombGame, /setBombTickRate\(/);
assert.match(bombGame, /czas rundy pozostaje całkowicie ukryty/i);

const bombIntegration = read('assets/js/games/ticking-bomb/integration.js');
assert.match(bombIntegration, /Zasady Impostora/);
assert.match(bombIntegration, /Menu Impostora/);
assert.match(bombIntegration, /stopAllBombAudio/);
assert.match(bombIntegration, /bombAwareToggleAudio/);
assert.match(bombIntegration, /scene\.add\.star/);
assert.match(bombIntegration, /shockwave/);
assert.match(bombIntegration, /sparkPositions/);

const bombMobileCss = read('assets/css/ticking-bomb-mobile.css');
assert.match(bombMobileCss, /#screen-bomb-play \.bomb-answer-btn/);
assert.match(bombMobileCss, /min-height: 4\.6rem/);
assert.match(bombMobileCss, /body\[data-screen="bomb-play"\] #app-main/);
assert.match(bombMobileCss, /#screen-bomb-result \.bomb-result-player-list/);
assert.match(bombMobileCss, /max-height: min\(42vh, 19rem\)/);
assert.match(bombMobileCss, /@media \(max-height: 760px\)/);

const bombThemeCss = read('assets/css/ticking-bomb-theme.css');
assert.match(bombThemeCss, /body\[data-game="ticking-bomb"\] \.shell-logo\.is-game/);
assert.match(bombThemeCss, /#score-modal \.primary-btn/);
assert.match(bombThemeCss, /#f97316/);
assert.doesNotMatch(bombThemeCss, /#0d9488|#0891b2/);

const bombContent = JSON.parse(read('content/ticking-bomb.pl.json'));
assert.equal(bombContent.game, 'ticking-bomb');
assert.equal(bombContent.categories.length, 8);
assert.equal(bombContent.categories.reduce((sum, category) => sum + category.words.length, 0), 96);

const background = read('assets/js/shared/background.js');
assert.match(background, /if \(!PhaserLib\)/);
assert.doesNotMatch(background, /class BackgroundScene extends Phaser\.Scene/);

const sw = read('sw.js');
assert.match(sw, /CACHE_VERSION = 'v28'/);
assert.match(sw, /assets\/audio\/crewmates-win\.mp3\.b64/);
assert.match(sw, /assets\/audio\/impostor-win\.0\.b64/);
assert.match(sw, /assets\/audio\/impostor-win\.4\.b64/);
assert.match(sw, /assets\/audio\/bomb-tick\.b64/);
assert.match(sw, /assets\/audio\/bomb-explosion\.b64/);
assert.match(sw, /content\/ticking-bomb\.pl\.json/);
assert.match(sw, /assets\/css\/ticking-bomb-mobile\.css/);
assert.match(sw, /assets\/css\/ticking-bomb-theme\.css/);
assert.match(sw, /assets\/js\/games\/ticking-bomb\/integration\.js/);
assert.match(sw, /assets\/js\/shared\/outcome-audio\.js\?v=6/);
assert.doesNotMatch(sw, /outcome-audio-user/);

const capacitor = JSON.parse(read('capacitor.config.json'));
assert.equal(capacitor.appId, 'pl.partyjniak.app');
assert.equal(capacitor.appName, 'Partyjniak');
assert.equal(capacitor.webDir, 'dist');

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.dependencies['@capacitor/core'], '8.5.2');
assert.equal(pkg.dependencies['@capacitor/android'], '8.5.2');
assert.equal(pkg.dependencies['@capacitor/app'], '8.1.1');
assert.match(pkg.scripts['build:web'], /prepare-web/);

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.short_name, 'Partyjniak');
assert.equal(manifest.theme_color, '#950f26');
assert.equal(manifest.background_color, '#06050a');
assert.equal(manifest.icons.some(icon => icon.purpose === 'maskable'), true);

console.log('Partyjniak structure, Android, Impostor and Tykająca Bomba mobile UI tests: OK');