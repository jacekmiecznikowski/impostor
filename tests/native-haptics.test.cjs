const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname, '../assets/js/shared/native-android.js'), 'utf8');
let starts = 0;
let stops = 0;
let native = true;
let fallbackBrowserVibrations = 0;
const motor = {
  startHold() { starts += 1; return Promise.resolve(); },
  stopHold() { stops += 1; return Promise.resolve(); }
};
const sandbox = {
  window: { Capacitor: { isNativePlatform: () => native, Plugins: { PartyjniakHaptics: motor } } },
  document: { documentElement: { classList: { add() {} } } },
  console,
  navigator: { vibrate() { fallbackBrowserVibrations += 1; } }
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const start = vm.runInContext('startPartyjniakRevealHaptics', sandbox);
const stop = vm.runInContext('stopPartyjniakRevealHaptics', sandbox);

assert.equal(start(), true, 'A native Android press must use the hardware motor');
assert.equal(starts, 1);
assert.equal(fallbackBrowserVibrations, 0, 'Do not rely on navigator.vibrate inside Android WebView');
stop();
assert.equal(stops, 1, 'Releasing the card must cancel hardware vibrations');
native = false;
assert.equal(start(), false, 'Browser should use its fallback API');
stop();
assert.equal(stops, 1, 'Browser should not call Android plugin');
native = true;
sandbox.window.Capacitor.Plugins.PartyjniakHaptics = undefined;
assert.equal(start(), false, 'Missing plugin must gracefully fall back');
console.log('Native Android reveal haptics routing tests: OK');
