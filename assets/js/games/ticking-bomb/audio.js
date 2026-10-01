const BOMB_AUDIO_ASSETS = Object.freeze({
    tick: './assets/audio/bomb-tick.mp3',
    explosion: './assets/audio/bomb-explosion.mp3'
});

const bombAudioBuffers = new Map();
let bombTickSource = null;
let bombTickGain = null;
let bombExplosionSource = null;

async function loadBombAudioBuffer(name) {
    if (bombAudioBuffers.has(name)) return bombAudioBuffers.get(name);
    const context = getAudioContext();
    if (!context) return null;
    const response = await fetch(BOMB_AUDIO_ASSETS[name], { cache: 'force-cache' });
    if (!response.ok) throw new Error(`Nie udało się pobrać audio ${name}: HTTP ${response.status}`);
    const bytes = await response.arrayBuffer();
    const buffer = await context.decodeAudioData(bytes.slice(0));
    bombAudioBuffers.set(name, buffer);
    return buffer;
}

function primeBombAudio() {
    if (!soundEnabled) return;
    const context = getAudioContext();
    context?.resume?.().catch?.(() => {});
    Promise.allSettled(['tick', 'explosion'].map(loadBombAudioBuffer));
}

function stopBombTicking() {
    if (bombTickSource) {
        try { bombTickSource.stop(0); } catch (_) {}
        try { bombTickSource.disconnect(); } catch (_) {}
    }
    if (bombTickGain) {
        try { bombTickGain.disconnect(); } catch (_) {}
    }
    bombTickSource = null;
    bombTickGain = null;
}

async function startBombTicking() {
    stopBombTicking();
    if (!soundEnabled) return false;
    try {
        const context = getAudioContext();
        if (!context) return false;
        if (context.state === 'suspended') await context.resume();
        const buffer = await loadBombAudioBuffer('tick');
        if (!buffer) return false;
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        source.loop = true;
        source.playbackRate.value = 1;
        gain.gain.value = 0.88;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        bombTickSource = source;
        bombTickGain = gain;
        return true;
    } catch (error) {
        console.warn('Nie udało się uruchomić tykania bomby.', error);
        return false;
    }
}

function setBombTickRate(rate) {
    if (!bombTickSource) return;
    const context = getAudioContext();
    const safeRate = Math.min(1.85, Math.max(0.85, Number(rate) || 1));
    try {
        bombTickSource.playbackRate.cancelScheduledValues(context.currentTime);
        bombTickSource.playbackRate.linearRampToValueAtTime(safeRate, context.currentTime + 0.14);
    } catch (_) {
        bombTickSource.playbackRate.value = safeRate;
    }
}

async function playBombExplosion() {
    stopBombTicking();
    if (!soundEnabled) return false;
    try {
        const context = getAudioContext();
        if (!context) return false;
        if (context.state === 'suspended') await context.resume();
        const buffer = await loadBombAudioBuffer('explosion');
        if (!buffer) return false;
        if (bombExplosionSource) {
            try { bombExplosionSource.stop(0); } catch (_) {}
        }
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = 0.78;
        source.connect(gain);
        gain.connect(context.destination);
        bombExplosionSource = source;
        source.onended = () => {
            if (bombExplosionSource === source) bombExplosionSource = null;
            try { source.disconnect(); } catch (_) {}
            try { gain.disconnect(); } catch (_) {}
        };
        source.start(0);
        return true;
    } catch (error) {
        console.warn('Nie udało się odtworzyć wybuchu.', error);
        return false;
    }
}

function stopAllBombAudio() {
    stopBombTicking();
    if (bombExplosionSource) {
        try { bombExplosionSource.stop(0); } catch (_) {}
        try { bombExplosionSource.disconnect(); } catch (_) {}
        bombExplosionSource = null;
    }
}

function syncBombAudioWithSoundSetting() {
    if (!soundEnabled) stopBombTicking();
}

document.addEventListener('pointerdown', primeBombAudio, { once: true, passive: true, capture: true });
