const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const listeners = new Map();
const sandbox = {
  URL, Promise,
  fetch: async () => ({ ok: true, type: 'basic', clone() { return this; } }),
  caches: { open: async () => ({ addAll: async () => {}, put: async () => {} }), keys: async () => [], delete: async () => true, match: async () => null },
  self: { location: { origin: 'https://partyjniak.test' }, addEventListener(type, handler) { listeners.set(type, handler); }, skipWaiting() {}, clients: { claim() {} } }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__pwaTest = { CACHE_VERSION, STATIC_CACHE, RUNTIME_CACHE, LOCAL_ASSETS: [...LOCAL_ASSETS], EXTERNAL_ASSETS: [...EXTERNAL_ASSETS] };`, sandbox);

const config = sandbox.__pwaTest;
assert.equal(config.CACHE_VERSION, 'v54');
assert.equal(config.STATIC_CACHE, 'partyjniak-static-v54');
assert.equal(config.RUNTIME_CACHE, 'partyjniak-runtime-v54');
assert.equal(new Set(config.LOCAL_ASSETS).size, config.LOCAL_ASSETS.length, 'precache should not contain duplicates');

[
  './index.html','./manifest.webmanifest','./content/ticking-bomb.pl.json','./content/naokolo.pl.json','./content/co-mam-na-mysli.pl.json','./content/trzy-w-piec.pl.json',
  './assets/css/game-color-system.css','./assets/css/player-setup.css','./assets/css/settings.css','./assets/css/naokolo.css','./assets/css/co-mam-na-mysli.css','./assets/css/trzy-w-piec.css','./assets/css/trzy-w-piec-layout.css?v=1','./assets/css/brand-theme.css',
  './assets/brand/swawole-studio.svg','./assets/js/shared/app-settings.js','./assets/js/shared/player-setup.js','./assets/js/shared/background.js','./assets/js/shared/game-themes.js','./assets/js/shared/game-registry.js?v=2','./assets/js/shared/native-android.js',
  './assets/js/games/index.js?v=4','./assets/js/games/impostor/integration.js?v=2','./assets/js/games/ticking-bomb/integration.js?v=2','./assets/js/games/naokolo/integration.js?v=1',
  './assets/js/games/co-mam-na-mysli/rules.js','./assets/js/games/co-mam-na-mysli/motion.js','./assets/js/games/co-mam-na-mysli/integration.js?v=1',
  './assets/js/games/trzy-w-piec/rules.js','./assets/js/games/trzy-w-piec/game.js','./assets/js/games/trzy-w-piec/integration.js?v=1',
  './assets/js/games/prototypes/integration.js?v=3','./assets/js/app.js?v=6','./views/co-mam-na-mysli.html','./views/co-mam-na-mysli-modals.html','./views/trzy-w-piec.html','./views/trzy-w-piec-modals.html'
].forEach(asset => assert.equal(config.LOCAL_ASSETS.includes(asset), true, `Brakuje w precache: ${asset}`));

assert.equal(config.EXTERNAL_ASSETS.some(url => url.includes('tailwindcss')), true);
assert.equal(config.EXTERNAL_ASSETS.some(url => url.includes('phaser')), true);
assert.equal(config.EXTERNAL_ASSETS.some(url => url.includes('font-awesome')), true);
assert.equal(listeners.has('install'), true);
assert.equal(listeners.has('activate'), true);
assert.equal(listeners.has('fetch'), true);
console.log('PWA cache configuration tests: OK');
