const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const listeners = new Map();
const sandbox = {URL,Promise,fetch:async()=>({ok:true,type:'basic',clone(){return this;}}),caches:{open:async()=>({addAll:async()=>{},put:async()=>{}}),keys:async()=>[],delete:async()=>true,match:async()=>null},self:{location:{origin:'https://partyjniak.test'},addEventListener(type,handler){listeners.set(type,handler);},skipWaiting(){},clients:{claim(){}}}};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(`${source}\n;globalThis.__pwaTest={CACHE_VERSION,STATIC_CACHE,RUNTIME_CACHE,LOCAL_ASSETS:[...LOCAL_ASSETS],EXTERNAL_ASSETS:[...EXTERNAL_ASSETS]};`,sandbox);
const config=sandbox.__pwaTest;assert.equal(config.CACHE_VERSION,'v60');assert.equal(config.STATIC_CACHE,'partyjniak-static-v60');assert.equal(config.RUNTIME_CACHE,'partyjniak-runtime-v60');assert.equal(new Set(config.LOCAL_ASSETS).size,config.LOCAL_ASSETS.length,'precache should not contain duplicates');
[
'./index.html','./manifest.webmanifest','./content/trzy-rundy.pl.json','./views/trzy-rundy.html','./views/trzy-rundy-modals.html','./assets/css/trzy-rundy.css','./assets/js/games/trzy-rundy/rules.js','./assets/js/games/trzy-rundy/game.js','./assets/js/games/trzy-rundy/integration.js?v=1','./assets/js/games/index.js?v=6','./assets/js/games/prototypes/integration.js?v=5','./assets/js/app.js?v=8',
'./content/synchronizacja.pl.json','./assets/js/games/synchronizacja/integration.js?v=1','./assets/js/shared/game-registry.js?v=2','./assets/css/settings.css','./assets/brand/swawole-studio.svg'
].forEach(asset=>assert.equal(config.LOCAL_ASSETS.includes(asset),true,`Brakuje w precache: ${asset}`));
assert.equal(config.EXTERNAL_ASSETS.some(url=>url.includes('tailwindcss')),true);assert.equal(config.EXTERNAL_ASSETS.some(url=>url.includes('phaser')),true);assert.equal(config.EXTERNAL_ASSETS.some(url=>url.includes('font-awesome')),true);assert.equal(listeners.has('install'),true);assert.equal(listeners.has('activate'),true);assert.equal(listeners.has('fetch'),true);console.log('PWA cache configuration tests: OK');
