const PARTYJNIAK_OUTCOME_AUDIO = Object.freeze({
    impostor: {
        src: './assets/audio/impostor-win.mp3.b64',
        volume: 0.35,
        label: 'impostor win'
    },
    detectives: {
        src: './assets/audio/crewmates-win.mp3.b64',
        volume: 1.0,
        label: 'crewmates win'
    }
});

const outcomeAudioBuffers = new Map();
const outcomeAudioLoads = new Map();
let outcomeAudioPrimed = false;

function decodeBase64Bytes(base64) {
    const normalized = base64.replace(/\s+/g, '');
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return bytes.buffer;
}

async function decodeOutcomeAudio(context, source) {
    const response = await fetch(source, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status} dla ${source}`);
    const base64 = await response.text();
    const bytes = decodeBase64Bytes(base64);
    return context.decodeAudioData(bytes.slice(0));
}

async function loadOutcomeAudioBuffer(outcome) {
    if (outcomeAudioBuffers.has(outcome)) return outcomeAudioBuffers.get(outcome);
    if (outcomeAudioLoads.has(outcome)) return outcomeAudioLoads.get(outcome);

    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    if (!config) return null;

    const load = (async () => {
        try {
            const context = getAudioContext();
            if (!context) return null;
            const buffer = await decodeOutcomeAudio(context, config.src);
            outcomeAudioBuffers.set(outcome, buffer);
            return buffer;
        } finally {
            outcomeAudioLoads.delete(outcome);
        }
    })();

    outcomeAudioLoads.set(outcome, load);
    return load;
}

function primeOutcomeAudio() {
    if (outcomeAudioPrimed || !soundEnabled) return;
    outcomeAudioPrimed = true;

    try {
        const context = getAudioContext();
        context?.resume?.().catch?.(() => {});
        Object.keys(PARTYJNIAK_OUTCOME_AUDIO).forEach(outcome => {
            loadOutcomeAudioBuffer(outcome).catch(error => {
                console.warn(`Nie udało się przygotować dźwięku wyniku (${outcome}).`, error);
            });
        });
    } catch (error) {
        console.warn('Nie udało się przygotować dźwięków wyników.', error);
    }
}

async function playOutcomeSound(outcome) {
    if (!soundEnabled) return false;
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    if (!config) return false;

    try {
        const context = getAudioContext();
        if (!context) return false;
        if (context.state === 'suspended') await context.resume();

        const buffer = await loadOutcomeAudioBuffer(outcome);
        if (!buffer) return false;

        const source = context.createBufferSource();
        const gain = context.createGain();
        gain.gain.value = config.volume;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(context.destination);
        source.start(0);
        return true;
    } catch (error) {
        console.warn(`Nie udało się odtworzyć sampla „${config.label}”.`, error);
        return false;
    }
}

document.addEventListener('pointerdown', primeOutcomeAudio, { once: true, passive: true, capture: true });
document.addEventListener('keydown', primeOutcomeAudio, { once: true, capture: true });
