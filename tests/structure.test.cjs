const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const requiredFiles = [
  'assets/js/shared/platform.js',
  'assets/js/shared/ui.js',
  'assets/js/shared/hub.js',
  'assets/js/games/impostor/data.js',
  'assets/js/games/impostor/state.js',
  'assets/js/games/impostor/setup.js',
  'assets/js/games/impostor/game.js',
  'assets/js/games/impostor/presentation.js',
  'assets/js/games/impostor/scoreboard.js'
];

requiredFiles.forEach(file => assert.equal(fs.existsSync(path.join(root, file)), true, `Brakuje ${file}`));

const index = read('index.html');
assert.match(index, /assets\/js\/shared\/platform\.js/);
assert.match(index, /assets\/js\/games\/impostor\/game\.js/);
assert.doesNotMatch(index, /src="\.\/assets\/js\/game\.js"/);
assert.doesNotMatch(index, /src="\.\/assets\/js\/state\.js"/);

const css = read('assets/css/styles.css');
assert.match(css, /\.reveal-card/);
assert.match(css, /\.vote-card/);

console.log('Structure and presentation tests: OK');
