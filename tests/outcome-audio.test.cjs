const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/shared/outcome-audio.js'), 'utf8');
let enabled = true;
let htmlPlays = 0;
let htmlPauses = 0;
let failMedia = false;
let webStarts = 0;
let fetchCalls = 0;
class FakeAudio {
  constructor(src) { this.src = src; this.preload = ''; this.volume = 0; this.currentTime = 0; }
  load() {}
  pause() { htmlPauses += 1; }
  play() { htmlPlays += 1; return failMedia ? Promise.reject(new Error('media unavailable')) : Promise.resolve(); }
}
const ctx = {
  state: 'running', destination: {}, resume: async () => {},
  decodeAudioData: async () => ({ duration: 1 }),
  createBufferSource() { return { connect() {}, disconnect() {}, stop() {}, start() { webStarts += 1; } }; },
  createGain() { return { gain: { value: 0 }, connect() {}, disconnect() {} }; }
};
const listeners = new Map();
const sandbox = {
  console: { warn() {} }, Audio: FakeAudio, Uint8Array,
  atob: str => Buffer.from(str, 'base64').toString('binary'),
  fetch: async () => { fetchCalls += 1; return { ok: true, text: async () => 'U1VDSCBNT0NLIERBVEE=' }; },
  document: { addEventListener(name, cb) { listeners.set(name, cb); } },
  getAudioContext: () => ctx,
  isPartyjniakSoundEnabled: () => enabled
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const prepare = vm.runInContext('preloadCrewmateApplause', sandbox);
const play = vm.runInContext('playOutcomeSound', sandbox);
const stop = vm.runInContext('stopOutcomeSound', sandbox);

(async () => {
  assert.equal(listeners.has('pointerdown'), true);
  await prepare();
  const media = vm.runInContext('crewmateApplauseMedia', sandbox);
  assert.ok(media.src.startsWith('data:audio/mpeg;base64,'));
  assert.equal(media.preload, 'auto');
  assert.equal(await play('detectives'), true);
  assert.equal(htmlPlays, 1);
  assert.equal(webStarts, 0, 'Use recorded applause as preferred audio');
  stop();
  assert.ok(htmlPauses > 0);
  enabled = false;
  assert.equal(await play('detectives'), false);
  assert.equal(htmlPlays, 1, 'Sound settings must mute applause');
  enabled = true;
  failMedia = true;
  assert.equal(await play('detectives'), true, 'Fallback Web Audio if media element fails');
  assert.equal(webStarts, 1);
  failMedia = false;
  assert.equal(await play('impostor'), true, 'Impostor outcome must still play');
  assert.equal(webStarts, 2);
  assert.ok(fetchCalls >= 2);
  console.log('Outcome applause playback and fallback tests: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
