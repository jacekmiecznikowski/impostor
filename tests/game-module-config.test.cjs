const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const ui=read('assets/js/shared/ui.js'),hub=read('assets/js/shared/hub.js'),viewLoader=read('assets/js/shared/view-loader.js'),navigation=read('assets/js/shared/navigation-behavior.js');
const impostor=read('assets/js/games/impostor/integration.js'),bomb=read('assets/js/games/ticking-bomb/integration.js'),naokolo=read('assets/js/games/naokolo/integration.js'),cmm=read('assets/js/games/co-mam-na-mysli/integration.js'),threeFive=read('assets/js/games/trzy-w-piec/integration.js'),sync=read('assets/js/games/synchronizacja/integration.js'),tr=read('assets/js/games/trzy-rundy/integration.js');
const threeFiveGame=read('assets/js/games/trzy-w-piec/game.js'),syncGame=read('assets/js/games/synchronizacja/game.js'),trGame=read('assets/js/games/trzy-rundy/game.js'),prototypes=read('assets/js/games/prototypes/integration.js'),gamesIndex=read('assets/js/games/index.js');
assert.match(viewLoader,/getGameViewFragments/);assert.match(viewLoader,/classList\.add\('hidden'\)/);assert.doesNotMatch(viewLoader,/impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy/i);
assert.match(ui,/getGameScreenConfig/);assert.doesNotMatch(ui,/bomb-play|naokolo-play|cmm-play|three-five-play|sync-clue|tr-play|timerInterval/);assert.match(navigation,/roundGuard/);assert.doesNotMatch(navigation,/bomb-play|naokolo-play|cmm-play|three-five-play|sync-clue|tr-play/);
assert.match(hub,/getGameCatalog/);assert.doesNotMatch(hub,/const GAME_CATALOG|heads-up|taboo|Czółko|Tabu/);
for(const source of [impostor,bomb,naokolo,cmm,threeFive,sync,tr]){for(const pattern of [/catalog:\s*\{/,/status:\s*'available'/,/views:\s*\[/,/screens:\s*\{/,/shell:\s*\{/,/background:/,/session:\s*\{/])assert.match(source,pattern);}
assert.match(cmm,/orientation:\s*'landscape'/);assert.match(threeFive,/name:\s*'Trzy w Pięć'/);assert.match(threeFiveGame,/turnSeconds \* 1000/);assert.match(sync,/id:\s*'synchronizacja'/);assert.match(syncGame,/scoreGuess\(/);
assert.match(tr,/id:\s*'trzy-rundy'/);assert.match(tr,/name:\s*'Trzy Rundy'/);assert.match(tr,/rulesModalId:\s*'tr-rules-modal'/);assert.match(tr,/initialize:\s*\(\) => initializeTrzyRundyContent\(\)/);assert.match(tr,/roundGuard: true/);assert.match(trGame,/finishTrzyRundyRound/);assert.match(trGame,/restartTrzyRundyMatch/);
assert.match(prototypes,/id:\s*'dzika-karta'/);assert.equal((prototypes.match(/status: 'prototype'/g)||[]).length,1);assert.doesNotMatch(prototypes,/id:\s*'trzy-rundy'|id:\s*'synchronizacja'|screens:\s*\{|session:\s*\{/);
for(const fn of ['registerImpostorGame','registerTickingBombGame','registerNaokoloGame','registerCoMamNaMysliGame','registerThreeFiveGame','registerSynchronizacjaGame','registerTrzyRundyGame','registerPrototypeGames'])assert.match(gamesIndex,new RegExp(`${fn}\\(\\)`));
console.log('Module-owned game configuration and prototype catalog tests: OK');
