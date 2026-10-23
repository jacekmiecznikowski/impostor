const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const synth = require('../assets/js/shared/applause-synth.js');

const samples = synth(16000);
assert.equal(samples.sampleRate, 16000);
assert.equal(samples.left.length, samples.right.length);
assert.ok(samples.left.length > 50000);
assert.ok(samples.left.some(value => Math.abs(value) > .18), 'Applause should contain audible transients');
assert.ok(samples.right.some(value => Math.abs(value) > .18));

let enabled = true;
let starts = 0;
const ctx = {
 state: 'running', sampleRate: 16000, destination: {},
 resume: () => Promise.resolve(),
 createBuffer(channels, length, rate) {
  assert.equal(channels, 2); assert.equal(rate, 16000);
  const channelsData = [new Float32Array(length), new Float32Array(length)];
  return { getChannelData(i) { return channelsData[i]; } };
 },
 createBufferSource() {
  return { connect(){}, disconnect(){}, stop(){}, start(){starts += 1;} };
 },
 createGain() { return { gain: {value: 0}, connect(){}, disconnect(){} }; },
 decodeAudioData:async() => ({ duration: 1 })
};
const sandbox = {
 document: { addEventListener(){} }, console,
 getAudioContext: () => ctx,
 isPartyjniakSoundEnabled: () => enabled,
 createPartyjniakApplauseSamples: synth,
 Uint8Array,
 fetch: async () => ({ok:true, text:async()=>''}),
 atob: x => Buffer.from(x,'base64').toString('binary')
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/shared/outcome-audio.js'),'utf8'), sandbox);
const play = vm.runInContext('playOutcomeSound', sandbox);
(async () => {
  assert.equal(await play('detectives'), true);
  assert.equal(starts, 1, 'Web Audio applause is audible without the old broken MP3');
  enabled = false;
  assert.equal(await play('detectives'), false);
  assert.equal(starts, 1, 'Sound setting mutes applause');
  enabled = true;
  sandbox.playPartyjniakNativeApplause = () => true;
  assert.equal(await play('detectives'), true);
  assert.equal(starts, 1, 'Android native playback takes priority');
  sandbox.playPartyjniakNativeApplause = () => false;
  assert.equal(await play('detectives'), true);
  assert.equal(starts, 2, 'Native failure falls back to Web Audio');
  console.log('Offline applause synthesis and native playback tests: OK');
})().catch(error => {console.error(error); process.exitCode = 1;});
