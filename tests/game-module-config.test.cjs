const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const ui = read('assets/js/shared/ui.js');
const hub = read('assets/js/shared/hub.js');
const viewLoader = read('assets/js/shared/view-loader.js');
const navigation = read('assets/js/shared/navigation-behavior.js');
const impostor = read('assets/js/games/impostor/integration.js');
const bomb = read('assets/js/games/ticking-bomb/integration.js');
const naokolo = read('assets/js/games/naokolo/integration.js');
const cmm = read('assets/js/games/co-mam-na-mysli/integration.js');
const prototypes = read('assets/js/games/prototypes/integration.js');
const gamesIndex = read('assets/js/games/index.js');

assert.match(viewLoader, /getGameViewFragments/);
assert.match(viewLoader, /querySelectorAll\?\.\('\.screen'\)/);
assert.match(viewLoader, /classList\.add\('hidden'\)/);
assert.match(viewLoader, /classList\.remove\('flex'\)/);
assert.doesNotMatch(viewLoader, /impostor|ticking-bomb|naokolo|co-mam-na-mysli/i);

assert.match(ui, /getGameScreenConfig/);
assert.match(ui, /callGameHook\(gameId, 'onScreenEnter'/);
assert.match(ui, /syncPartyjniakScreenOrientation/);
assert.doesNotMatch(ui, /setup-options|group-voting|bomb-play|naokolo-play|cmm-play|timerInterval/);
assert.doesNotMatch(ui, /IMMERSIVE_SCREENS|ROUND_GUARDED_SCREENS|WAKE_LOCK_SCREENS|SCREEN_BACK_TARGET|SHELL_CONTEXT_BY_SCREEN|BACKGROUND_MODE_BY_SCREEN/);

assert.match(navigation, /getGameScreenConfig/);
assert.match(navigation, /roundGuard/);
assert.doesNotMatch(navigation, /ACTIVE_ROUND_SCREENS|bomb-play|naokolo-play|cmm-play|group-voting|discussion/);

assert.match(hub, /getGameCatalog/);
assert.doesNotMatch(hub, /const GAME_CATALOG/);
assert.doesNotMatch(hub, /heads-up|taboo|Czółko|Tabu/);

for (const source of [impostor, bomb, naokolo, cmm]) {
  assert.match(source, /catalog:\s*\{/);
  assert.match(source, /status:\s*'available'/);
  assert.match(source, /views:\s*\[/);
  assert.match(source, /screens:\s*\{/);
  assert.match(source, /backTarget:/);
  assert.match(source, /shell:\s*\{/);
  assert.match(source, /background:/);
  assert.match(source, /session:\s*\{/);
}

assert.match(impostor, /onScreenEnter\(screenName\)/);
assert.match(impostor, /roundGuard: true/);
assert.match(bomb, /roundGuard: true/);
assert.match(naokolo, /id:\s*'naokolo'/);
assert.match(naokolo, /roundGuard: true/);
assert.match(cmm, /id:\s*'co-mam-na-mysli'/);
assert.match(cmm, /rulesModalId:\s*'cmm-rules-modal'/);
assert.match(cmm, /orientation:\s*'landscape'/);
assert.match(cmm, /initialize:\s*\(\) => initializeCoMamNaMysliContent\(\)/);

for (const [id, name] of [
  ['dzika-karta', 'Dzika Karta'],
  ['trzy-rundy', 'Trzy Rundy'],
  ['trzy-na-piec', 'Trzy na Pięć'],
  ['synchronizacja', 'Synchronizacja']
]) {
  assert.match(prototypes, new RegExp(`id:\\s*'${id}'`));
  assert.match(prototypes, new RegExp(`name:\\s*'${name}'`));
}
assert.doesNotMatch(prototypes, /id:\s*'naokolo'|id:\s*'co-mam-na-mysli'/);
assert.equal((prototypes.match(/status: 'prototype'/g) || []).length, 4);
assert.doesNotMatch(prototypes, /screens:\s*\{|session:\s*\{|\bopen\s*\(/);

assert.match(gamesIndex, /registerImpostorGame\(\)/);
assert.match(gamesIndex, /registerTickingBombGame\(\)/);
assert.match(gamesIndex, /registerNaokoloGame\(\)/);
assert.match(gamesIndex, /registerCoMamNaMysliGame\(\)/);
assert.match(gamesIndex, /registerPrototypeGames\(\)/);

console.log('Module-owned game configuration and prototype catalog tests: OK');
