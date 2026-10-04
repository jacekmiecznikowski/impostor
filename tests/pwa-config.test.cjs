const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
const listeners = new Map();
const sandbox = {
  URL,
  Promise,
  fetch: async () => ({ ok: true, type: 'basic', clone() { return this; }, json: async () => [] }),
  caches: {
    open: async () => ({ addAll: async () => {}, put: async () => {} }),
    keys: async () => [],
    delete: async () => true,
    match: async () => null
  },
  self: {
    location: { origin: 'https://partyjniak.test' },
    addEventListener(type, handler) { listeners.set(type, handler); },
    skipWaiting() {},
    clients: { claim() {} }
  }
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__pwaTest={CACHE_VERSION,STATIC_CACHE,RUNTIME_CACHE,VENDOR_MANIFEST,LOCAL_ASSETS:[...LOCAL_ASSETS]};`, sandbox);

const config = sandbox.__pwaTest;
assert.equal(config.CACHE_VERSION, 'v64');
assert.equal(config.STATIC_CACHE, 'partyjniak-static-v64');
assert.equal(config.RUNTIME_CACHE, 'partyjniak-runtime-v64');
assert.equal(config.VENDOR_MANIFEST, './assets/vendor/precache.json');
assert.equal(new Set(config.LOCAL_ASSETS).size, config.LOCAL_ASSETS.length, 'precache should not contain duplicates');
[
  './index.html',
  './manifest.webmanifest',
  './assets/vendor/precache.json',
  './content/dzika-karta.pl.json',
  './views/dzika-karta.html',
  './assets/css/dzika-karta.css',
  './assets/js/shared/asset-loader.js',
  './assets/js/games/dzika-karta/rules.js',
  './assets/js/games/dzika-karta/game.js',
  './assets/js/games/dzika-karta/bootstrap.js?v=1',
  './assets/js/games/dzika-karta/integration.js?v=1',
  './assets/js/games/index.js?v=9',
  './assets/js/app.js?v=11',
  './assets/js/shared/game-registry.js?v=2',
  './assets/css/settings.css',
  './assets/brand/swawole-studio.svg'
].forEach(asset => assert.equal(config.LOCAL_ASSETS.includes(asset), true, `Brakuje w precache: ${asset}`));

assert.equal(config.LOCAL_ASSETS.some(x => x.includes('prototypes/integration')), false);
assert.doesNotMatch(source, /cdn\.tailwindcss|cdnjs\.cloudflare|fonts\.googleapis/);
assert.match(source, /precacheVendorAssets/);
assert.equal(listeners.has('install'), true);
assert.equal(listeners.has('activate'), true);
assert.equal(listeners.has('fetch'), true);
console.log('PWA cache configuration tests: OK');
