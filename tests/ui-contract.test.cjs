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

const playerSetupSources = [
  read('assets/js/games/impostor/setup.js'),
  read('assets/js/games/ticking-bomb/setup.js'),
  read('assets/js/games/naokolo/setup.js'),
  read('assets/js/games/co-mam-na-mysli/setup.js'),
  read('assets/js/games/trzy-w-piec/setup.js'),
  read('assets/js/games/synchronizacja/setup.js')
];
for (const source of playerSetupSources) {
  assert.match(source, /renderPlayerSetupNames\(/);
  assert.match(source, /syncPlayerSetupCount\(/);
  assert.match(source, /playPlayerSetupCountFeedback\(\)/);
}

const sharedPlayerSetup = read('assets/css/player-setup.css');
assert.match(sharedPlayerSetup, /--ui-accent/);
assert.match(sharedPlayerSetup, /\.player-setup-name-row/);

const sharedPlayerSelectorViews = [
  read('views/dzika-karta.html'),
  read('views/trzy-rundy.html')
];
for (const view of sharedPlayerSelectorViews) {
  assert.match(view, /player-setup-heading/);
  assert.match(view, /player-setup-count-row/);
  assert.match(view, /player-setup-count-copy/);
  assert.match(view, /player-setup-range-label/);
  assert.match(view, /class="player-setup-range"/);
  assert.match(view, /player-setup-name-list/);
  assert.match(view, /player-setup-action/);
  assert.doesNotMatch(view, /player-setup-count-card|player-setup-count-head|player-setup-slider|player-setup-names/);
}

const bombView = read('views/ticking-bomb.html');
assert.match(bombView, /id="bomb-visual"[^>]*bomb-ignite-control/);
assert.match(bombView, /onclick="igniteBomb\(\)"/);
assert.match(bombView, /DOTKNIJ, ABY ODPALIĆ/);
assert.match(bombView, /U KOGO WYBUCHŁA BOMBA\?/);
assert.match(bombView, /bomb-art-cap" transform="translate\(145 80\) rotate\(45\)"/);
assert.match(bombView, /M151 74 C160 62 166 52 178 46 C187 42 192 35 194 26/);

const naokoloView = read('views/naokolo.html');
assert.match(naokoloView, /id="screen-naokolo-players"[^>]*player-setup-screen/);
assert.match(naokoloView, /markNaokoloCard\('guessed'\)/);
assert.match(naokoloView, /markNaokoloCard\('skipped'\)/);
assert.match(naokoloView, /markNaokoloCard\('forbidden'\)/);
assert.match(naokoloView, /id="naokolo-timer-value"/);

const cmmView = read('views/co-mam-na-mysli.html');
assert.match(cmmView, /id="screen-cmm-players"[^>]*player-setup-screen/);
assert.match(cmmView, /id="cmm-player-slider"[^>]*min="2"[^>]*max="12"/);
assert.match(cmmView, /id="screen-cmm-play"[^>]*cmm-play-screen/);
assert.match(cmmView, /id="cmm-card-word"/);
assert.match(cmmView, /id="cmm-countdown"/);
assert.match(cmmView, /id="cmm-gesture-feedback"/);
assert.match(cmmView, /id="cmm-fallback-controls"[^>]*hidden/);
assert.match(cmmView, /Przechyl w dół: dobrze/);

const cmmGame = read('assets/js/games/co-mam-na-mysli/game.js');
assert.match(cmmGame, /DeviceMotionEvent/);
assert.match(cmmGame, /addEventListener\('devicemotion'/);
assert.match(cmmGame, /getGravityTiltValue/);
assert.match(cmmGame, /DeviceOrientationEvent/);
assert.match(cmmGame, /setPartyjniakOrientation\?\.\('landscape'\)/);
assert.match(cmmGame, /setPartyjniakOrientation\?\.\('portrait'\)/);
assert.match(cmmGame, /gestureLocked/);

const cmmCss = read('assets/css/co-mam-na-mysli.css');
assert.match(cmmCss, /body\[data-screen="cmm-play"\] #app-main/);
assert.match(cmmCss, /height:100dvh/);
assert.match(cmmCss, /@media \(orientation:portrait\)/);
assert.match(cmmCss, /\.cmm-gesture-feedback\.is-correct/);
assert.match(cmmCss, /\.cmm-gesture-feedback\.is-passed/);

const threeFiveView = read('views/trzy-w-piec.html');
const threeFiveGame = read('assets/js/games/trzy-w-piec/game.js');
const threeFiveCss = read('assets/css/trzy-w-piec.css');
const threeFiveLayout = read('assets/css/trzy-w-piec-layout.css');
assert.match(threeFiveView, /id="screen-three-five-players"[^>]*player-setup-screen/);
assert.match(threeFiveView, /id="three-five-timer"/);
assert.match(threeFiveView, /class="three-five-timer-sweep"/);
assert.doesNotMatch(threeFiveView, /three-five-timer-ticks|data-three-five-tick/);
assert.match(threeFiveView, /id="three-five-turn-seconds"[^>]*max="60"/);
assert.match(threeFiveView, /onclick="startThreeFiveCountdown\(\)"/);
assert.match(threeFiveView, /judgeThreeFiveTurn\(false\)/);
assert.match(threeFiveView, /judgeThreeFiveTurn\(true\)/);
assert.match(threeFiveView, /id="screen-three-five-round-summary"/);
assert.match(threeFiveView, /Jeszcze jedna runda/);
assert.match(threeFiveView, /Zakończ grę/);
assert.match(threeFiveView, /id="three-five-final-ranking"/);
assert.match(threeFiveGame, /setInterval\(updateThreeFiveCountdown, 40\)/);
assert.match(threeFiveGame, /threeFiveState\.turnSeconds/);
assert.match(threeFiveGame, /turnSeconds \* 1000/);
assert.match(threeFiveGame, /--three-five-elapsed-angle/);
assert.match(threeFiveGame, /ThreeFiveRules\.isRoundComplete/);
assert.match(threeFiveGame, /continueThreeFiveRound\(\)/);
assert.match(threeFiveGame, /finishThreeFiveGame\(\)/);
assert.doesNotMatch(threeFiveGame, /renderThreeFiveTimerTicks|data-three-five-tick|ThreeFiveRules\.TURN_SECONDS|targetScore|hasWinner/);
assert.match(threeFiveCss, /conic-gradient/);
assert.match(threeFiveCss, /\.three-five-timer\.is-critical/);
assert.match(threeFiveCss, /\.three-five-timer\.is-expired/);
assert.match(threeFiveLayout, /from 0deg/);
assert.match(threeFiveLayout, /\.three-five-timer-sweep/);
assert.match(threeFiveLayout, /\.three-five-round-ranking/);

const syncView = read('views/synchronizacja.html');
const syncGame = read('assets/js/games/synchronizacja/game.js');
const syncCss = read('assets/css/synchronizacja.css');
assert.match(syncView, /id="screen-sync-players"[^>]*player-setup-screen/);
assert.match(syncView, /id="screen-sync-clue"/);
assert.match(syncView, /id="screen-sync-guess"/);
assert.match(syncView, /id="screen-sync-reveal"/);
assert.match(syncView, /id="sync-guess-input"[^>]*min="0"[^>]*max="100"/);
assert.match(syncView, /Ukryj cel i przekaż telefon/);
assert.match(syncView, /Jeszcze jedna runda/);
assert.match(syncView, /Zakończ grę/);
assert.match(syncGame, /SynchronizacjaRules\.scoreGuess/);
assert.match(syncGame, /SynchronizacjaRules\.isRoundComplete/);
assert.match(syncGame, /continueSynchronizacjaRound/);
assert.match(syncGame, /finishSynchronizacjaGame/);
assert.match(syncCss, /--sync-target/);
assert.match(syncCss, /--sync-guess/);
assert.match(syncCss, /\.sync-target-zone/);
assert.match(syncCss, /\.sync-guess-marker/);
assert.match(syncCss, /\.sync-distance-line/);

const nativeAndroid = read('assets/js/shared/native-android.js');
assert.match(nativeAndroid, /PartyjniakOrientation/);
assert.match(nativeAndroid, /lockLandscape/);
assert.match(nativeAndroid, /lockPortrait/);
assert.match(nativeAndroid, /syncPartyjniakScreenOrientation/);

const colorSystem = read('assets/css/game-color-system.css');
assert.match(colorSystem, /--ui-accent:/);
assert.match(colorSystem, /var\(--ui-accent\)/);
assert.doesNotMatch(colorSystem, /body\[data-game=/);

console.log('Critical Partyjniak UI contracts: OK');
