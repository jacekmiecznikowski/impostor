const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const settings = read('assets/js/shared/app-settings.js');
const audio = read('assets/js/shared/audio.js');
const navigation = read('assets/js/shared/navigation-behavior.js');
const css = read('assets/css/settings.css');
const index = read('index.html');

assert.match(settings, /partyjniak\.settings\.v1/);
assert.match(settings, /sound:\s*true/);
assert.match(settings, /backgroundEffects:\s*true/);
assert.match(settings, /haptics:\s*true/);
assert.match(settings, /impostor\.session\.v2/);
assert.match(settings, /phaserGame\.loop\.sleep/);
assert.match(settings, /phaserGame\.loop\.wake/);
assert.match(settings, /partyjniakVibrate/);
assert.match(settings, /settings-modal/);
assert.match(settings, /https:\/\/swawole\.studio/);
assert.match(settings, /assets\/brand\/swawole-studio\.svg/);
assert.match(settings, /shell-settings-action/);
assert.match(settings, /ensurePartyjniakHomeSettingsButton/);
assert.match(settings, /id = 'home-settings-btn'/);
assert.match(settings, /home\.prepend\(button\)/);

assert.match(audio, /togglePartyjniakSetting\('sound'\)/);
assert.doesNotMatch(audio, /persistSession\(\)/);
assert.match(navigation, /screenName === 'home'/);
assert.match(navigation, /fa-gear/);
assert.match(navigation, /openPartyjniakSettings/);
assert.match(css, /background-effects-disabled/);
assert.match(css, /settings-switch/);
assert.match(css, /\.app-shell\.is-home\s*\{[\s\S]*display:\s*none/);
assert.match(css, /\.home-settings-button/);
assert.match(css, /position:\s*absolute/);

const settingsIndex = index.indexOf('./assets/js/shared/app-settings.js');
const audioIndex = index.indexOf('./assets/js/shared/audio.js');
assert.ok(settingsIndex >= 0 && audioIndex > settingsIndex, 'app settings must load before audio');
assert.match(index, /assets\/css\/settings\.css/);

assert.equal(fs.existsSync(path.join(root, 'assets/brand/swawole-studio.svg')), true);
new Function(settings);
new Function(audio);
new Function(navigation);
console.log('Partyjniak app settings tests: OK');
