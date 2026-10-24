const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative));
for (const name of ['crewmates-win.mp3','impostor-win.mp3']) {
    const recording = read('assets/audio/' + name);
    assert.ok(recording.length > 50000, 'Original recording must not be truncated: ' + name);
    assert.ok(recording.subarray(0, 3).toString() === 'ID3' ||
        (recording[0] === 0xff && (recording[1] & 0xe0) === 0xe0),
        'Original sound must be an MP3: ' + name);
}
const source = read('assets/js/shared/outcome-audio.js').toString();
assert.doesNotMatch(source, /synthesiz(?:ed|er)|createPartyjniakApplauseSamples|crewmates-win\.mp3\.b64/i);

let enabled = true;
let htmlStarts = 0;
let webStarts = 0;
let failHtml = false;
let fetchUrls = [];
class FakeAudio {
    constructor(src) { this.src = src; this.preload = ''; this.volume = 1; this.currentTime = 0; this.paused = true; }
    load() {}
    pause() { this.paused = true; }
    play() {
        htmlStarts++;
        this.paused = false;
        return failHtml ? Promise.reject(new Error('HTML media error')) : Promise.resolve();
    }
}
const context = {
    state: 'running', destination: {},
    resume: async () => {},
    decodeAudioData: async () => ({ duration: 1 }),
    createGain: () => ({ gain: {value: 0}, connect() {}, disconnect() {} }),
    createBufferSource: () => ({
        connect() {}, disconnect() {}, stop() {}, start() { webStarts++; }
    })
};
const sandbox = {
    document: { addEventListener() {} },
    Audio: FakeAudio,
    console: { warn() {} },
    getAudioContext: () => context,
    isPartyjniakSoundEnabled: () => enabled,
    fetch: async url => {
        fetchUrls.push(url);
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(5) };
    }
};
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const play = vm.runInContext('playOutcomeSound', sandbox);
(async () => {
    assert.equal(await play('detectives'), true);
    assert.equal(htmlStarts, 1);
    assert.equal(vm.runInContext('outcomeAudioElements.get("detectives").src', sandbox),
        './assets/audio/crewmates-win.mp3');
    assert.equal(webStarts, 0);
    assert.equal(await play('impostor'), true);
    assert.equal(vm.runInContext('outcomeAudioElements.get("impostor").src', sandbox),
        './assets/audio/impostor-win.mp3');
    enabled = false;
    assert.equal(await play('detectives'), false);
    enabled = true;
    sandbox.playPartyjniakNativeOutcome = () => true;
    assert.equal(await play('detectives'), true);
    assert.equal(htmlStarts, 2, 'Native playback should not start WebView audio');
    sandbox.playPartyjniakNativeOutcome = () => false;
    failHtml = true;
    assert.equal(await play('detectives'), true, 'Fallback decodes the same MP3 in Web Audio');
    assert.equal(webStarts, 1);
    assert.deepEqual(fetchUrls, ['./assets/audio/crewmates-win.mp3']);
    console.log('Original MP3 victory sound routing: OK');
})().catch(error => { console.error(error); process.exitCode = 1; });
