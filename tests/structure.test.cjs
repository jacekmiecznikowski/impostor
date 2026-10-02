const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  'index.html','manifest.webmanifest','sw.js','capacitor.config.json','assets/js/app.js',
  'assets/js/shared/view-loader.js','assets/js/shared/audio.js','assets/js/shared/player-setup.js','assets/js/shared/outcome-audio.js','assets/js/shared/background.js','assets/js/shared/platform.js','assets/js/shared/content-repository.js','assets/js/shared/game-registry.js','assets/js/shared/ui.js','assets/js/shared/hub.js','assets/js/shared/navigation-behavior.js','assets/js/shared/game-themes.js','assets/js/shared/native-android.js','assets/js/games/index.js','assets/js/games/prototypes/integration.js',
  'assets/js/games/impostor/data.js','assets/js/games/impostor/content-provider.js','assets/js/games/impostor/rules.js','assets/js/games/impostor/state.js','assets/js/games/impostor/setup.js','assets/js/games/impostor/game.js','assets/js/games/impostor/presentation.js','assets/js/games/impostor/reveal-fit.js','assets/js/games/impostor/scoreboard.js','assets/js/games/impostor/integration.js',
  'assets/js/games/ticking-bomb/content-provider.js','assets/js/games/ticking-bomb/rules.js','assets/js/games/ticking-bomb/state.js','assets/js/games/ticking-bomb/audio.js','assets/js/games/ticking-bomb/setup.js','assets/js/games/ticking-bomb/game.js','assets/js/games/ticking-bomb/scoreboard.js','assets/js/games/ticking-bomb/integration.js',
  'assets/js/games/naokolo/content-provider.js','assets/js/games/naokolo/rules.js','assets/js/games/naokolo/state.js','assets/js/games/naokolo/setup.js','assets/js/games/naokolo/game.js','assets/js/games/naokolo/scoreboard.js','assets/js/games/naokolo/integration.js',
  'assets/js/games/co-mam-na-mysli/content-provider.js','assets/js/games/co-mam-na-mysli/rules.js','assets/js/games/co-mam-na-mysli/motion.js','assets/js/games/co-mam-na-mysli/state.js','assets/js/games/co-mam-na-mysli/setup.js','assets/js/games/co-mam-na-mysli/game.js','assets/js/games/co-mam-na-mysli/scoreboard.js','assets/js/games/co-mam-na-mysli/integration.js',
  'content/ticking-bomb.pl.json','content/naokolo.pl.json','content/co-mam-na-mysli.pl.json','views/impostor-setup.html','views/impostor-round.html','views/ticking-bomb.html','views/ticking-bomb-modals.html','views/naokolo.html','views/naokolo-modals.html','views/co-mam-na-mysli.html','views/co-mam-na-mysli-modals.html','views/modals.html',
  'assets/css/styles.css','assets/css/player-setup.css','assets/css/naokolo.css','assets/css/co-mam-na-mysli.css','assets/css/partyjniak.css','assets/css/navigation.css','assets/css/navigation-android.css','assets/css/brand-theme.css','assets/css/game-color-system.css','assets/css/impostor-reveal-layout.css','assets/css/ticking-bomb.css','assets/css/ticking-bomb-mobile.css','assets/css/ticking-bomb-visual.css','assets/css/screen-layout-system.css',
  'assets/icons/icon.svg','assets/icons/icon-32.png','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-512.png','scripts/prepare-web.mjs','scripts/patch-android.mjs'
];

for (const file of requiredFiles) assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`);

const index = read('index.html');
assert.match(index, /<html lang="pl"/);
assert.match(index, /<title>Partyjniak – gry imprezowe<\/title>/);
assert.match(index, /assets\/css\/player-setup\.css/);
assert.match(index, /assets\/css\/co-mam-na-mysli\.css/);
assert.match(index, /assets\/js\/games\/co-mam-na-mysli\/motion\.js/);
assert.match(index, /assets\/js\/games\/co-mam-na-mysli\/game\.js/);
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
assert.match(pkg.scripts.test, /co-mam-na-mysli-content\.test\.cjs/);
assert.match(pkg.scripts.test, /co-mam-na-mysli-motion\.test\.cjs/);
assert.match(pkg.scripts.test, /co-mam-na-mysli-rules\.test\.cjs/);
assert.match(pkg.scripts.test, /co-mam-na-mysli-state\.test\.cjs/);

console.log('Partyjniak packaging and configuration smoke tests: OK');
