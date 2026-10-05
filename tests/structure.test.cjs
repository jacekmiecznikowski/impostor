const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = relative => fs.existsSync(path.join(root, relative));

const gameIds = [
  'impostor', 'ticking-bomb', 'naokolo', 'co-mam-na-mysli',
  'trzy-w-piec', 'synchronizacja', 'trzy-rundy', 'dzika-karta'
];

const requiredFiles = [
  'index.html', 'manifest.webmanifest', 'sw.js', 'capacitor.config.json', 'package.json', 'package-lock.json',
  'tailwind.config.cjs', 'playwright.config.mjs', 'docs/adding-a-game.md',
  'scripts/build-assets.mjs', 'scripts/prepare-web.mjs', 'scripts/verify-web-bundle.mjs', 'scripts/patch-android.mjs',
  'assets/css/tailwind-input.css', 'assets/css/game-menu.css',
  'assets/js/app.js', 'assets/js/shared/view-loader.js', 'assets/js/shared/asset-loader.js',
  'assets/js/shared/app-settings.js', 'assets/js/shared/audio.js', 'assets/js/shared/player-setup.js',
  'assets/js/shared/outcome-audio.js', 'assets/js/shared/background.js', 'assets/js/shared/platform.js',
  'assets/js/shared/content-repository.js', 'assets/js/shared/game-registry.js', 'assets/js/shared/ui.js',
  'assets/js/shared/hub.js', 'assets/js/shared/game-menu.js', 'assets/js/shared/navigation-behavior.js', 'assets/js/shared/game-themes.js',
  'assets/js/shared/native-android.js', 'assets/js/games/index.js',
  'views/modals.html', 'assets/icons/icon.svg', 'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'assets/icons/icon-maskable-512.png', 'assets/brand/swawole-studio.svg', 'tests/e2e/smoke.spec.mjs'
];

for (const id of gameIds) {
  requiredFiles.push(`assets/js/games/${id}/bootstrap.js`);
  requiredFiles.push(`assets/js/games/${id}/integration.js`);
}

for (const file of requiredFiles) assert.equal(exists(file), true, `Brakuje ${file}`);
assert.equal(exists('assets/js/games/prototypes/integration.js'), false, 'Martwy katalog prototypów nie powinien wrócić');

const index = read('index.html');
assert.match(index, /<html lang="pl"/);
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
assert.match(index, /assets\/css\/runtime\.css/);
assert.match(index, /assets\/js\/phaser\.min\.js/);
assert.doesNotMatch(index, /assets\/vendor\//);
assert.match(index, /assets\/js\/shared\/asset-loader\.js/);
assert.match(index, /assets\/js\/shared\/game-menu\.js/);
assert.match(index, /assets\/css\/game-menu\.css/);
assert.match(index, /partyjniak-runtime-missing/);
assert.match(index, /--partyjniak-runtime-bundle/);
assert.match(index, /Brakuje wygenerowanych assetów Partyjniaka/);
assert.match(index, /npm run serve/);
assert.doesNotMatch(index, /https:\/\/(?:cdn\.tailwindcss|cdnjs\.cloudflare|fonts\.googleapis)/);
assert.doesNotMatch(index, /assets\/js\/games\/[^"']+\/(?:game|state|rules|setup|scoreboard)\.js/);
assert.doesNotMatch(index, /assets\/css\/(?:impostor|ticking-bomb|naokolo|co-mam-na-mysli|trzy-w-piec|synchronizacja|trzy-rundy|dzika-karta)[^"']*\.css/);
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);

const gameMenu = read('assets/js/shared/game-menu.js');
assert.match(gameMenu, /standardizeGameMenu/);
assert.match(gameMenu, /resumeInterruptedGame/);
assert.match(gameMenu, /partyjniak\.interrupted-game\.v1/);
assert.match(gameMenu, /6 \* 60 \* 60 \* 1000/);
assert.match(gameMenu, /<span>Nowa gra<\/span>/);
assert.match(gameMenu, /<span>Zasady<\/span>/);
assert.doesNotMatch(gameMenu, /Wyniki|Graj z poprzednią ekipą|Wznów grę/i);

const buildAssets = read('scripts/build-assets.mjs');
assert.match(buildAssets, /node_modules/);
assert.match(buildAssets, /tailwindcss\/lib\/cli\.js/);
assert.match(buildAssets, /runtime\.css/);
assert.match(buildAssets, /data:.*base64/s);
assert.match(buildAssets, /assets.*vendor/s);
assert.match(buildAssets, /precache\.json/);

const prepareWeb = read('scripts/prepare-web.mjs');
assert.match(prepareWeb, /data-partyjniak-runtime/);
assert.match(prepareWeb, /runtime\.css/);
assert.match(prepareWeb, /\['assets', 'views', 'content'\]/, 'Android web bundle must include game content JSON files');

const verifyWebBundle = read('scripts/verify-web-bundle.mjs');
assert.match(verifyWebBundle, /data-partyjniak-runtime/);
assert.match(verifyWebBundle, /Font Awesome 6 Free/);
assert.match(verifyWebBundle, /data:font\/woff2;base64/);
assert.match(verifyWebBundle, /max-w-lg/);
assert.match(verifyWebBundle, /assets\/vendor/);

const androidPatch = read('scripts/patch-android.mjs');
assert.match(androidPatch, /PartyjniakOrientationPlugin/);
assert.match(androidPatch, /registerPlugin\(PartyjniakOrientationPlugin\.class\)/);
assert.match(androidPatch, /SCREEN_ORIENTATION_SENSOR_LANDSCAPE/);
assert.match(androidPatch, /SCREEN_ORIENTATION_SENSOR_PORTRAIT/);

const capacitor = JSON.parse(read('capacitor.config.json'));
assert.equal(capacitor.appId, 'pl.partyjniak.app');
assert.equal(capacitor.appName, 'Partyjniak');
assert.equal(capacitor.webDir, 'dist');

const manifest = JSON.parse(read('manifest.webmanifest'));
assert.equal(manifest.name, 'Partyjniak – gry imprezowe');
assert.equal(manifest.short_name, 'Partyjniak');
assert.equal(manifest.icons.some(icon => icon.purpose === 'maskable'), true);
assert.equal(manifest.shortcuts.length, gameIds.length);
for (const gameId of gameIds) {
  assert.equal(manifest.shortcuts.some(shortcut => shortcut.url === `./?game=${gameId}`), true, `Brakuje skrótu PWA dla ${gameId}`);
}

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.private, true);
assert.equal(pkg.dependencies['@capacitor/core'], '8.5.2');
assert.equal(pkg.dependencies.phaser, '3.60.0');
assert.equal(pkg.dependencies['@fortawesome/fontawesome-free'], '6.4.0');
assert.equal(pkg.devDependencies.tailwindcss, '3.4.17');
assert.equal(pkg.devDependencies['@playwright/test'], '1.55.0');
assert.match(pkg.scripts['build:web'], /build:assets/);
assert.match(pkg.scripts['build:web'], /prepare-web/);
assert.match(pkg.scripts['build:web'], /verify:web/);
assert.match(pkg.scripts['android:prepare'], /verify-web-bundle/);
assert.match(pkg.scripts['test:e2e'], /playwright test/);

const readme = read('README.md');
assert.match(readme, /npm run serve/);
assert.match(readme, /Nie uruchamiaj świeżego checkoutu samym `python -m http\.server 8080`/);
assert.match(readme, /npm run build:assets/);

for (const game of ['co-mam-na-mysli', 'trzy-w-piec', 'synchronizacja', 'trzy-rundy', 'dzika-karta']) {
  assert.match(pkg.scripts.test, new RegExp(`${game}-content\\.test\\.cjs`));
  assert.match(pkg.scripts.test, new RegExp(`${game}-rules\\.test\\.cjs`));
  assert.match(pkg.scripts.test, new RegExp(`${game}-state\\.test\\.cjs`));
}

console.log('Partyjniak packaging and configuration smoke tests: OK');