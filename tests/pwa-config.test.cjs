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
assert.equal(config.CACHE_VERSION, 'v41');
assert.equal(config.STATIC_CACHE, 'partyjniak-static-v41');
assert.equal(config.RUNTIME_CACHE, 'partyjniak-runtime-v41');
assert.equal(new Set(config.LOCAL_ASSETS).size, config.LOCAL_ASSETS.length, 'precache should not contain duplicates');

[
  './index.html', './manifest.webmanifest', './content/ticking-bomb.pl.json', './content/naokolo.pl.json',
  './assets/audio/bomb-tick.b64', './assets/audio/bomb-explosion.b64', './assets/audio/crewmates-win.mp3.b64',
  './assets/css/game-color-system.css', './assets/css/player-setup.css', './assets/css/naokolo.css', './assets/css/brand-theme.css',
  './assets/js/shared/player-setup.js', './assets/js/shared/game-themes.js', './assets/js/shared/game-registry.js?v=2',
  './assets/js/games/index.js?v=2', './assets/js/games/impostor/integration.js?v=2',
  './assets/js/games/ticking-bomb/rules.js', './assets/js/games/ticking-bomb/integration.js?v=2',
  './assets/js/games/naokolo/rules.js', './assets/js/games/naokolo/integration.js?v=1',
  './assets/js/games/prototypes/integration.js?v=1', './assets/js/app.js?v=3',
  './views/naokolo.html', './views/naokolo-modals.html'
].forEach(asset => assert.equal(config.LOCAL_ASSETS.includes(asset), true, `Brakuje w precache: ${asset}`));

assert.equal(config.LOCAL_ASSETS.includes('./assets/css/ticking-bomb-theme.css'), false);
assert.equal(config.EXTERNAL_ASSETS.some(url => url.includes('tailwindcss')), true);
assert.equal(config.EXTERNAL_ASSETS.some(url => url.includes('phaser')), true);
assert.equal(config.EXTERNAL_ASSETS.some(url => url.includes('font-awesome')), true);
assert.equal(listeners.has('install'), true);
assert.equal(listeners.has('activate'), true);
assert.equal(listeners.has('fetch'), true);
console.log('PWA cache configuration tests: OK');
