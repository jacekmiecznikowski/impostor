const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  'index.html','manifest.webmanifest','sw.js','capacitor.config.json','assets/js/app.js','docs/adding-a-game.md',
  'assets/js/shared/view-loader.js','assets/js/shared/audio.js','assets/js/shared/player-setup.js','assets/js/shared/outcome-audio.js','assets/js/shared/background.js','assets/js/shared/platform.js','assets/js/shared/content-repository.js','assets/js/shared/game-registry.js','assets/js/shared/ui.js','assets/js/shared/hub.js','assets/js/shared/navigation-behavior.js','assets/js/shared/game-themes.js','assets/js/shared/native-android.js','assets/js/games/index.js',
  'assets/js/games/impostor/data.js','assets/js/games/impostor/content-provider.js','assets/js/games/impostor/rules.js','assets/js/games/impostor/state.js','assets/js/games/impostor/setup.js','assets/js/games/impostor/game.js','assets/js/games/impostor/presentation.js','assets/js/games/impostor/reveal-fit.js','assets/js/games/impostor/scoreboard.js','assets/js/games/impostor/integration.js',
  'assets/js/games/ticking-bomb/content-provider.js','assets/js/games/ticking-bomb/rules.js','assets/js/games/ticking-bomb/state.js','assets/js/games/ticking-bomb/audio.js','assets/js/games/ticking-bomb/setup.js','assets/js/games/ticking-bomb/game.js','assets/js/games/ticking-bomb/scoreboard.js','assets/js/games/ticking-bomb/integration.js',
  'assets/js/games/naokolo/content-provider.js','assets/js/games/naokolo/rules.js','assets/js/games/naokolo/state.js','assets/js/games/naokolo/setup.js','assets/js/games/naokolo/game.js','assets/js/games/naokolo/scoreboard.js','assets/js/games/naokolo/integration.js',
  'assets/js/games/co-mam-na-mysli/content-provider.js','assets/js/games/co-mam-na-mysli/rules.js','assets/js/games/co-mam-na-mysli/motion.js','assets/js/games/co-mam-na-mysli/state.js','assets/js/games/co-mam-na-mysli/setup.js','assets/js/games/co-mam-na-mysli/game.js','assets/js/games/co-mam-na-mysli/scoreboard.js','assets/js/games/co-mam-na-mysli/integration.js',
  'assets/js/games/trzy-w-piec/content-provider.js','assets/js/games/trzy-w-piec/rules.js','assets/js/games/trzy-w-piec/state.js','assets/js/games/trzy-w-piec/setup.js','assets/js/games/trzy-w-piec/game.js','assets/js/games/trzy-w-piec/scoreboard.js','assets/js/games/trzy-w-piec/integration.js',
  'assets/js/games/synchronizacja/content-provider.js','assets/js/games/synchronizacja/rules.js','assets/js/games/synchronizacja/state.js','assets/js/games/synchronizacja/setup.js','assets/js/games/synchronizacja/game.js','assets/js/games/synchronizacja/scoreboard.js','assets/js/games/synchronizacja/integration.js',
  'assets/js/games/trzy-rundy/content-provider.js','assets/js/games/trzy-rundy/rules.js','assets/js/games/trzy-rundy/state.js','assets/js/games/trzy-rundy/setup.js','assets/js/games/trzy-rundy/game.js','assets/js/games/trzy-rundy/scoreboard.js','assets/js/games/trzy-rundy/integration.js',
  'assets/js/games/dzika-karta/content-provider.js','assets/js/games/dzika-karta/rules.js','assets/js/games/dzika-karta/state.js','assets/js/games/dzika-karta/setup.js','assets/js/games/dzika-karta/game.js','assets/js/games/dzika-karta/scoreboard.js','assets/js/games/dzika-karta/integration.js',
  'content/ticking-bomb.pl.json','content/naokolo.pl.json','content/co-mam-na-mysli.pl.json','content/trzy-w-piec.pl.json','content/synchronizacja.pl.json','content/trzy-rundy.pl.json','content/dzika-karta.pl.json',
  'views/impostor-setup.html','views/impostor-round.html','views/ticking-bomb.html','views/ticking-bomb-modals.html','views/naokolo.html','views/naokolo-modals.html','views/co-mam-na-mysli.html','views/co-mam-na-mysli-modals.html','views/trzy-w-piec.html','views/trzy-w-piec-modals.html','views/synchronizacja.html','views/synchronizacja-modals.html','views/trzy-rundy.html','views/trzy-rundy-modals.html','views/dzika-karta.html','views/dzika-karta-modals.html','views/modals.html',
  'assets/css/styles.css','assets/css/player-setup.css','assets/css/naokolo.css','assets/css/co-mam-na-mysli.css','assets/css/trzy-w-piec.css','assets/css/synchronizacja.css','assets/css/trzy-rundy.css','assets/css/dzika-karta.css','assets/css/partyjniak.css','assets/css/navigation.css','assets/css/navigation-android.css','assets/css/brand-theme.css','assets/css/game-color-system.css','assets/css/impostor-reveal-layout.css','assets/css/ticking-bomb.css','assets/css/ticking-bomb-mobile.css','assets/css/ticking-bomb-visual.css','assets/css/screen-layout-system.css',
  'assets/icons/icon.svg','assets/icons/icon-32.png','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-512.png','scripts/prepare-web.mjs','scripts/patch-android.mjs'
];

for (const file of requiredFiles) assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`);
assert.equal(fs.existsSync(path.join(root, 'assets/js/games/prototypes/integration.js')), false, 'Martwy katalog prototypów nie powinien wrócić');

const index = read('index.html');
assert.match(index, /<html lang="pl"/);
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
for (const asset of ['player-setup.css','co-mam-na-mysli.css','trzy-w-piec.css','synchronizacja.css','trzy-rundy.css','dzika-karta.css']) assert.match(index, new RegExp(`assets\\/css\\/${asset.replace('.', '\\.')}`));
for (const game of ['co-mam-na-mysli','trzy-w-piec','synchronizacja','trzy-rundy','dzika-karta']) assert.match(index, new RegExp(`assets\\/js\\/games\\/${game}\\/game\\.js`));
assert.doesNotMatch(index, /DÅ|WrÃ|â€“/);

const prepareWeb = read('scripts/prepare-web.mjs');
assert.match(prepareWeb, /\['assets', 'views', 'content'\]/, 'Android web bundle must include game content JSON files');

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

const pkg = JSON.parse(read('package.json'));
assert.equal(pkg.private, true);
assert.equal(pkg.dependencies['@capacitor/core'], '8.5.2');
assert.match(pkg.scripts['build:web'], /prepare-web/);
for (const game of ['co-mam-na-mysli','trzy-w-piec','synchronizacja','trzy-rundy','dzika-karta']) {
  assert.match(pkg.scripts.test, new RegExp(`${game}-content\\.test\\.cjs`));
  assert.match(pkg.scripts.test, new RegExp(`${game}-rules\\.test\\.cjs`));
  assert.match(pkg.scripts.test, new RegExp(`${game}-state\\.test\\.cjs`));
}

console.log('Partyjniak packaging and configuration smoke tests: OK');
