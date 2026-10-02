const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  'assets/js/shared/view-loader.js',
  'assets/js/shared/platform.js',
  'assets/js/shared/content-repository.js',
  'assets/js/shared/game-registry.js',
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
  'assets/js/games/impostor/integration.js',
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
  'assets/css/game-color-system.css',
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
assert.match(index, /assets\/css\/game-color-system\.css/);
assert.match(index, /assets\/css\/impostor-reveal-layout\.css/);
assert.match(index, /assets\/css\/ticking-bomb\.css/);
assert.match(index, /assets\/css\/ticking-bomb-mobile\.css/);
assert.match(index, /assets\/css\/ticking-bomb-theme\.css/);
assert.match(index, /assets\/css\/navigation\.css/);
assert.match(index, /assets\/css\/navigation-android\.css/);
assert.match(index, /assets\/js\/shared\/view-loader\.js/);
assert.match(index, /assets\/js\/shared\/game-registry\.js/);
assert.match(index, /assets\/js\/shared\/outcome-audio\.js\?v=6/);
assert.doesNotMatch(index, /outcome-audio-user/);
assert.match(index, /assets\/js\/shared\/native-android\.js/);
assert.match(index, /assets\/js\/shared\/navigation-behavior\.js/);
assert.match(index, /assets\/js\/shared\/game-themes\.js/);
assert.match(index, /assets\/js\/games\/impostor\/reveal-fit\.js/);
assert.match(index, /assets\/js\/games\/impostor\/integration\.js/);
assert.match(index, /assets\/js\/games\/ticking-bomb\/integration\.js/);
assert.match(index, /assets\/js\/games\/ticking-bomb\/game\.js/);
assert.match(index, /theme-color" content="#950f26"/);
assert.match(index, /bomb: \{ 400: '#fbbf24'/);
assert.doesNotMatch(index, /accent: \{ 500:/);
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);
assert.doesNotMatch(index, /id="screen-menu"/);

const impostorSetupView = read('views/impostor-setup.html');
assert.match(impostorSetupView, /GRAJ Z POPRZEDNIĄ EKIPĄ/);
assert.doesNotMatch(impostorSetupView, /Wznów ostatnią sesję/);

const impostorState = read('assets/js/games/impostor/state.js');
assert.match(impostorState, /Poprzednia ekipa/);
assert.match(impostorState, /zapisanej poprzedniej ekipy/);

const platform = read('assets/js/shared/platform.js');
assert.doesNotMatch(platform, /awake-mode-note|Ekran pozostanie włączony/);

const registry = read('assets/js/shared/game-registry.js');
assert.match(registry, /const GAME_MODULES = new Map\(\)/);
assert.match(registry, /GAME_SESSION_METHODS/);
assert.match(registry, /function registerGameModule/);
assert.match(registry, /function getGameModule/);
assert.match(registry, /function getGameSession/);
assert.match(registry, /function getGameIdForScreen/);
assert.match(registry, /function getActiveGameModule/);
assert.match(registry, /function loadGameSessions/);
assert.match(registry, /function syncGameSessionUi/);
assert.match(registry, /function callGameHook/);

const ui = read('assets/js/shared/ui.js');
assert.match(ui, /function navigateBack/);
assert.match(ui, /function setupSystemBackHandling/);
assert.match(ui, /ROUND_GUARDED_SCREENS/);
assert.match(ui, /openNavigationSheet/);
assert.match(ui, /getGameIdForScreen/);
assert.match(ui, /callGameHook/);

const navigation = read('assets/js/shared/navigation-behavior.js');
assert.match(navigation, /bomb-play/);

const nativeAndroid = read('assets/js/shared/native-android.js');
assert.match(nativeAndroid, /function isPartyjniakNative/);
assert.match(nativeAndroid, /backButton/);
assert.match(nativeAndroid, /exitApp/);

const app = read('assets/js/app.js');
assert.match(app, /setupNativeAndroidIntegration/);
assert.match(app, /initializeTickingBombContent/);
assert.match(app, /loadGameSessions\(\)/);
assert.match(app, /syncGameSessionUi\(\)/);
assert.doesNotMatch(app, /loadBombSession\(\)|loadSession\(\)|\bstate\.|\bbombState\./);
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

const impostorIntegration = read('assets/js/games/impostor/integration.js');
assert.match(impostorIntegration, /registerGameModule/);
assert.match(impostorIntegration, /id: 'impostor'/);
assert.match(impostorIntegration, /session:\s*\{/);
assert.match(impostorIntegration, /rulesModalId: 'rules-modal'/);
assert.match(impostorIntegration, /renderScoreboard/);

const bombState = read('assets/js/games/ticking-bomb/state.js');
assert.match(bombState, /hasSavedSession: false/);
assert.match(bombState, /function resetBombSession/);
assert.match(bombState, /removeItem\(BOMB_SESSION_STORAGE_KEY\)/);
assert.match(bombState, /manualLoserId: null/);
assert.doesNotMatch(bombState, /manualWinnerId/);

const bombContentProvider = read('assets/js/games/ticking-bomb/content-provider.js');
assert.match(bombContentProvider, /function formatBombPromptLabel/);
assert.match(bombContentProvider, /wymieniajcie\|mówcie/);
assert.match(bombContentProvider, /toLocaleUpperCase\('pl-PL'\)/);
assert.match(bombContentProvider, /normalizeBombPromptContent/);

const bombSetup = read('assets/js/games/ticking-bomb/setup.js');
assert.match(bombSetup, /resetBombSession\(\)/);
assert.match(bombSetup, /bombState\.hasSavedSession/);

const tickingBombView = read('views/ticking-bomb.html');
assert.match(tickingBombView, /id="bomb-visual"[^>]*bomb-ignite-control/);
assert.match(tickingBombView, /onclick="igniteBomb\(\)"/);
assert.match(tickingBombView, /DOTKNIJ, ABY ODPALIĆ/);
assert.doesNotMatch(tickingBombView, /id="bomb-ignite-btn"/);
assert.match(tickingBombView, /U KOGO WYBUCHŁA BOMBA\?/);
assert.match(tickingBombView, /id="bomb-manual-loser-list"/);
assert.doesNotMatch(tickingBombView, /KTO WYGRYWA TĘ RUNDĘ\?/);

const bombGame = read('assets/js/games/ticking-bomb/game.js');
assert.match(bombGame, /resultTimeoutId/);
assert.match(bombGame, /clearTimeout\(bombRuntime\.resultTimeoutId\)/);
assert.match(bombGame, /now - bombRuntime\.lastPassAt < 250/);
assert.doesNotMatch(bombGame, /setInterval\(updateBombProgress/);
assert.doesNotMatch(bombGame, /setBombTickRate\(/);
assert.match(bombGame, /czas rundy pozostaje całkowicie ukryty/i);
assert.match(bombGame, /BOMB_FUSE_PRESETS\.unstable/);
assert.match(bombGame, /answerBtn\.disabled = true/);
assert.match(bombGame, /answerBtn\.disabled = false/);
assert.match(bombGame, /function applyBombLoss/);
assert.match(bombGame, /manualLoserId/);
assert.match(bombGame, /function commitBombManualLoser/);
assert.doesNotMatch(bombGame, /manualWinnerId|commitBombManualWinner|selectBombManualWinner/);

const bombIntegration = read('assets/js/games/ticking-bomb/integration.js');
assert.match(bombIntegration, /registerGameModule/);
assert.match(bombIntegration, /id: 'ticking-bomb'/);
assert.match(bombIntegration, /session:\s*\{/);
assert.match(bombIntegration, /rulesModalId: 'bomb-rules-modal'/);
assert.match(bombIntegration, /stopAllBombAudio/);
assert.match(bombIntegration, /onAudioChanged/);
assert.match(bombIntegration, /fa-bomb/);
assert.doesNotMatch(bombIntegration, /baseOpenGame|partyjniakOpenGame|bombAwareToggleAudio|updateBombAwareNavigationIcons/);
assert.doesNotMatch(bombIntegration, /openGame\s*=|goToScreen\s*=|setupGameHub\s*=|updateShellContext\s*=|requestLeaveGame\s*=|leaveActiveRound\s*=|toggleAudio\s*=/);
assert.doesNotMatch(bombIntegration, /Object\.assign\(BACKGROUND_MODES/);
assert.doesNotMatch(bombIntegration, /bombAwareThemeMotifs|sparkPositions|shockwave/);

const bombMobileCss = read('assets/css/ticking-bomb-mobile.css');
assert.match(bombMobileCss, /#screen-bomb-play \.bomb-answer-btn/);
assert.match(bombMobileCss, /min-height: 4\.6rem/);
assert.match(bombMobileCss, /body\[data-screen="bomb-play"\] #app-main/);
assert.match(bombMobileCss, /#screen-bomb-result \.bomb-result-player-list/);
assert.match(bombMobileCss, /max-height: min\(42vh, 19rem\)/);
assert.match(bombMobileCss, /@media \(max-height: 760px\)/);
assert.match(bombMobileCss, /\.bomb-ignite-control/);
assert.match(bombMobileCss, /\.bomb-device/);
assert.match(bombMobileCss, /\.bomb-cap/);
assert.match(bombMobileCss, /bomb-spark-live/);

const bombThemeCss = read('assets/css/ticking-bomb-theme.css');
assert.match(bombThemeCss, /body\[data-game="ticking-bomb"\] \.shell-logo\.is-game/);
assert.match(bombThemeCss, /#score-modal \.primary-btn/);
assert.match(bombThemeCss, /#f97316/);
assert.doesNotMatch(bombThemeCss, /#0d9488|#0891b2/);

const colorSystem = read('assets/css/game-color-system.css');
assert.match(colorSystem, /body\[data-game="home"\]/);
assert.match(colorSystem, /body\[data-game="impostor"\]/);
assert.match(colorSystem, /body\[data-game="ticking-bomb"\]/);
assert.match(colorSystem, /--ui-accent: #950f26/);
assert.match(colorSystem, /--ui-accent: #14b8a6/);
assert.match(colorSystem, /--ui-accent: #f97316/);
assert.match(colorSystem, /navigation-sheet-icon/);
assert.match(colorSystem, /body\[data-bg-mode="bomb-alert"\]/);
assert.match(colorSystem, /::-webkit-scrollbar-thumb/);
assert.match(colorSystem, /partyjniak-theme-pulse/);

const bombContent = JSON.parse(read('content/ticking-bomb.pl.json'));
assert.equal(bombContent.game, 'ticking-bomb');
assert.equal(bombContent.categories.length, 8);
assert.equal(bombContent.categories.reduce((sum, category) => sum + category.words.length, 0), 96);

const background = read('assets/js/shared/background.js');
assert.match(background, /if \(!PhaserLib\)/);
assert.doesNotMatch(background, /class BackgroundScene extends Phaser\.Scene/);
assert.match(background, /buildPartyBackdrop/);
assert.match(background, /buildImpostorBackdrop/);
assert.match(background, /buildBombBackdrop/);

const gameThemes = read('assets/js/shared/game-themes.js');
assert.match(gameThemes, /'ticking-bomb': \{/);
assert.match(gameThemes, /motif: 'ticking-bomb'/);
assert.match(gameThemes, /celebrate:[\s\S]*motif: 'impostor'/);
assert.match(gameThemes, /NATIVE_BACKGROUND_MOTIFS/);
assert.match(gameThemes, /name === 'Tykająca Bomba'/);
assert.doesNotMatch(gameThemes, /celebrate:[\s\S]{0,220}0xf59e0b/);
assert.doesNotMatch(gameThemes, /impostor:[\s\S]{0,220}0x8b5cf6/);

const sw = read('sw.js');
assert.match(sw, /CACHE_VERSION = 'v35'/);
assert.match(sw, /assets\/audio\/crewmates-win\.mp3\.b64/);
assert.match(sw, /assets\/audio\/impostor-win\.0\.b64/);
assert.match(sw, /assets\/audio\/impostor-win\.4\.b64/);
assert.match(sw, /assets\/audio\/bomb-tick\.b64/);
assert.match(sw, /assets\/audio\/bomb-explosion\.b64/);
assert.match(sw, /content\/ticking-bomb\.pl\.json/);
assert.match(sw, /assets\/css\/ticking-bomb-mobile\.css/);
assert.match(sw, /assets\/css\/ticking-bomb-theme\.css/);
assert.match(sw, /assets\/css\/game-color-system\.css/);
assert.match(sw, /assets\/js\/shared\/game-registry\.js/);
assert.match(sw, /assets\/js\/games\/impostor\/integration\.js/);
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
assert.match(pkg.scripts.test, /session-interface\.test\.cjs/);

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.short_name, 'Partyjniak');
assert.equal(manifest.theme_color, '#950f26');
assert.equal(manifest.background_color, '#06050a');
assert.equal(manifest.icons.some(icon => icon.purpose === 'maskable'), true);

console.log('Partyjniak structure, game registry, session interface, Android, per-game colors, Impostor and Tykająca Bomba mobile UI tests: OK');
