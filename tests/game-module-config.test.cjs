const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const ui = read('assets/js/shared/ui.js');
const hub = read('assets/js/shared/hub.js');
const viewLoader = read('assets/js/shared/view-loader.js');
const assetLoader = read('assets/js/shared/asset-loader.js');
const navigation = read('assets/js/shared/navigation-behavior.js');
const gamesIndex = read('assets/js/games/index.js');
const ids = ['impostor', 'ticking-bomb', 'naokolo', 'co-mam-na-mysli', 'trzy-w-piec', 'synchronizacja', 'trzy-rundy', 'dzika-karta'];
const integrations = Object.fromEntries(ids.map(id => [id, read(`assets/js/games/${id}/integration.js`)]));
const bootstraps = Object.fromEntries(ids.map(id => [id, read(`assets/js/games/${id}/bootstrap.js`)]));

assert.match(viewLoader, /async function loadGameViews/);
assert.match(viewLoader, /gameModule\.views/);
assert.match(viewLoader, /Promise\.all/);
assert.match(viewLoader, /classList\.add\('hidden'\)/);
assert.doesNotMatch(viewLoader, /impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy|dzika-karta/i);
assert.match(assetLoader, /async function loadGameAssets/);
assert.match(assetLoader, /gameModule\.assets/);
assert.match(assetLoader, /for \(const script of scripts\) await loadGameScript/);
assert.doesNotMatch(assetLoader, /impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy|dzika-karta/i);
assert.match(ui, /getGameScreenConfig/);
assert.match(navigation, /roundGuard/);
assert.match(hub, /getGameCatalog/);
assert.doesNotMatch(hub, /const GAME_CATALOG|heads-up|taboo|Czółko|Tabu/);

for (const [id, source] of Object.entries(integrations)) {
  for (const pattern of [/catalog:\s*\{/, /status:\s*'available'/, /views:\s*\[/, /screens:\s*\{/, /shell:\s*\{/, /background:/, /session:\s*\{/]) {
    assert.match(source, pattern, `${id} missing module contract`);
  }

  const bootstrap = bootstraps[id];
  assert.match(bootstrap, /gameModule\.assets\s*=\s*\{/);
  assert.match(bootstrap, /styles:\s*\[/);
  assert.match(bootstrap, /scripts:\s*\[/);
}

assert.match(integrations['co-mam-na-mysli'], /orientation:\s*'landscape'/);
assert.match(integrations['trzy-w-piec'], /name:\s*'Trzy w Pięć'/);
assert.match(integrations.synchronizacja, /id:\s*'synchronizacja'/);
assert.match(integrations['trzy-rundy'], /name:\s*'Trzy Rundy'/);
assert.match(integrations['dzika-karta'], /name:\s*'Dzika Karta'/);
assert.match(integrations['dzika-karta'], /rulesModalId:\s*'dk-rules-modal'/);
assert.match(integrations['dzika-karta'], /initialize:\s*\(\)\s*=>\s*initializeDzikaKartaContent\(\)/);

for (const fn of ['registerImpostorGame', 'registerTickingBombGame', 'registerNaokoloGame', 'registerCoMamNaMysliGame', 'registerThreeFiveGame', 'registerSynchronizacjaGame', 'registerTrzyRundyGame', 'registerDzikaKartaGame']) {
  assert.match(gamesIndex, new RegExp(`${fn}\\(\\)`));
}
assert.doesNotMatch(gamesIndex, /LEGACY_INITIALIZERS|attachLegacyInitializer/);
assert.doesNotMatch(gamesIndex, /registerPrototypeGames|prototypes\/integration/);

console.log('Module-owned lazy game configuration tests: OK');
