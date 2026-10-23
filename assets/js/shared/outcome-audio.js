const PARTYJNIAK_OUTCOME_AUDIO = Object.freeze({
    impostor: {
        src: [
            './assets/audio/impostor-win.0.b64',
            './assets/audio/impostor-win.1.b64',
            './assets/audio/impostor-win.2.b64',
            './assets/audio/impostor-win.3.b64',
            './assets/audio/impostor-win.4.b64'
        ],
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
let activeOutcomeSource = null;
let activeOutcomeGain = null;
let outcomePlaybackRequest = 0;
let crewmateApplauseMedia = null;
let crewmateApplauseLoad = null;

function decodeBase64Bytes(base64) {
    const normalized = base64.replace(/\s+/g, '');
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes.buffer;
}

async function fetchBase64Source(source) {
    const sources = Array.isArray(source) ? source : [source];
    const parts = await Promise.all(sources.map(async url => {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status} dla ${url}`);
        return response.text();
    }));
    return parts.join('');
}

async function decodeOutcomeAudio(context, source) {
    const base64 = await fetchBase64Source(source);
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

// The crewmate clip is actual recorded applause. On Android WebView, playing
// a prepared HTMLAudioElement directly in the vote click handler is more
// reliable than waiting for a Web Audio fetch/decode before starting playback.
function preloadCrewmateApplause() {
    if (crewmateApplauseMedia) return Promise.resolve(crewmateApplauseMedia);
    if (crewmateApplauseLoad) return crewmateApplauseLoad;
    if (typeof Audio !== 'function') return Promise.resolve(null);

    crewmateApplauseLoad = (async () => {
        const encoded = await fetchBase64Source(PARTYJNIAK_OUTCOME_AUDIO.detectives.src);
        const media = new Audio(`data:audio/mpeg;base64,${encoded.replace(/\s+/g, '')}`);
        media.preload = 'auto';
        media.volume = PARTYJNIAK_OUTCOME_AUDIO.detectives.volume;
        media.load?.();
        crewmateApplauseMedia = media;
        return media;
    })().catch(error => {
        console.warn('Nie udało się przygotować oklasków crewmate’ów.', error);
        return null;
    }).finally(() => {
        crewmateApplauseLoad = null;
    });
    return crewmateApplauseLoad;
}

function stopOutcomeSound() {
    if (crewmateApplauseMedia) {
        crewmateApplauseMedia.pause();
        try { crewmateApplauseMedia.currentTime = 0; } catch (_) {}
    }
    const source = activeOutcomeSource;
    const gain = activeOutcomeGain;
    activeOutcomeSource = null;
    activeOutcomeGain = null;
    if (source) {
        source.onended = null;
        try { source.stop(0); } catch (_) {}
        try { source.disconnect(); } catch (_) {}
    }
    if (gain) try { gain.disconnect(); } catch (_) {}
}

function primeOutcomeAudio() {
    if (outcomeAudioPrimed || !isPartyjniakSoundEnabled()) return;
    outcomeAudioPrimed = true;
    try {
        const context = getAudioContext();
        context?.resume?.().catch?.(() => {});
        preloadCrewmateApplause().catch(error => console.warn('Nie udało się przygotować oklasków.', error));
        Object.keys(PARTYJNIAK_OUTCOME_AUDIO).forEach(outcome => {
            loadOutcomeAudioBuffer(outcome).catch(error => console.warn(`Nie udało się przygotować dźwięku wyniku (${outcome}).`, error));
        });
    } catch (error) {
        console.warn('Nie udało się przygotować dźwięków wyników.', error);
    }
}

async function playOutcomeSound(outcome) {
    const requestId = ++outcomePlaybackRequest;
    stopOutcomeSound();
    if (!isPartyjniakSoundEnabled()) return false;
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    if (!config) return false;

    // Start the prepared applause synchronously with the user's tap.
    // Keep the existing Web Audio decoder as a fallback.
    if (outcome === 'detectives') {
        const media = crewmateApplauseMedia;
        if (media) {
            try {
                media.currentTime = 0;
                await media.play();
                if (requestId !== outcomePlaybackRequest) {
                    media.pause();
                    return false;
                }
                return true;
            } catch (error) {
                console.warn('Odtwarzanie oklasków przez HTML audio nie powiodło się; używam Web Audio.', error);
            }
        } else {
            // A missing preload must not silently skip the crewmate victory.
            preloadCrewmateApplause().catch(() => {});
        }
    }

    try {
        const context = getAudioContext();
        if (!context) return false;
        if (context.state === 'suspended') await context.resume();
        const buffer = await loadOutcomeAudioBuffer(outcome);
        if (!buffer || requestId !== outcomePlaybackRequest) return false;

        const source = context.createBufferSource();
        const gain = context.createGain();
        gain.gain.value = config.volume;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(context.destination);
        activeOutcomeSource = source;
        activeOutcomeGain = gain;
        source.onended = () => {
            if (activeOutcomeSource !== source) return;
            activeOutcomeSource = null;
            activeOutcomeGain = null;
            try { source.disconnect(); } catch (_) {}
            try { gain.disconnect(); } catch (_) {}
        };
        source.start(0);
        return true;
    } catch (error) {
        if (requestId === outcomePlaybackRequest) stopOutcomeSound();
        console.warn(`Nie udało się odtworzyć sampla „${config.label}”.`, error);
        return false;
    }
}

document.addEventListener('pointerdown', primeOutcomeAudio, { once: true, passive: true, capture: true });
document.addEventListener('keydown', primeOutcomeAudio, { once: true, capture: true });
