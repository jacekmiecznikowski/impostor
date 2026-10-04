const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root=path.join(__dirname,'..');const read=r=>fs.readFileSync(path.join(root,r),'utf8');
const index=read('index.html'),app=read('assets/js/app.js'),gamesIndex=read('assets/js/games/index.js'),registry=read('assets/js/shared/game-registry.js'),sw=read('sw.js');
const modules=[['impostor','registerImpostorGame'],['ticking-bomb','registerTickingBombGame'],['naokolo','registerNaokoloGame'],['co-mam-na-mysli','registerCoMamNaMysliGame'],['trzy-w-piec','registerThreeFiveGame'],['synchronizacja','registerSynchronizacjaGame'],['trzy-rundy','registerTrzyRundyGame']];
const sources=modules.map(([id,fn])=>[id,fn,read(`assets/js/games/${id}/integration.js`)]);const prototypes=read('assets/js/games/prototypes/integration.js');
for(const [name,source] of [['app.js',app],['games/index.js',gamesIndex],['game-registry.js',registry],...sources.map(([id,,s])=>[`${id}/integration.js`,s]),['prototypes/integration.js',prototypes]]){const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:source,encoding:'utf8'});assert.equal(result.status,0,`${name} syntax:\n${result.stderr}`);}
assert.match(index,/app\.js\?v=8/);assert.match(index,/games\/index\.js\?v=6/);assert.match(app,/from '\.\/games\/index\.js\?v=6'/);assert.match(app,/initializeTrzyRundyContent/);assert.doesNotMatch(app,/games\/(?:impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy)\/integration/);
for(const [id,fn,source] of sources){assert.match(source,/from '\.\.\/\.\.\/shared\/game-registry\.js\?v=2'/);assert.match(source,new RegExp(`export function ${fn}`));assert.match(gamesIndex,new RegExp(`${fn}`));}
assert.match(gamesIndex,/trzy-rundy\/integration\.js\?v=1/);assert.match(gamesIndex,/prototypes\/integration\.js\?v=5/);assert.match(prototypes,/export function registerPrototypeGames/);
assert.match(registry,/export function registerGameModule/);assert.match(registry,/Object\.assign\(window, legacyBridge\)/);
assert.match(sw,/assets\/js\/games\/index\.js\?v=6/);assert.match(sw,/assets\/js\/games\/trzy-rundy\/integration\.js\?v=1/);assert.match(sw,/assets\/js\/games\/prototypes\/integration\.js\?v=5/);assert.match(sw,/assets\/js\/app\.js\?v=8/);
console.log('ES module boundary and PWA module revision tests: OK');
