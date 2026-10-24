// The recordings in assets/audio are the original MP3 files supplied for Partyjniak.
// No generated applause or Base64 decoding is used for win screens.
const PARTYJNIAK_OUTCOME_AUDIO = Object.freeze({
    impostor: {
        src: './assets/audio/impostor-win.mp3',
        volume: 0.35,
        label: 'impostor win'
    },
    detectives: {
        src: './assets/audio/crewmates-win.mp3',
        volume: 1.0,
        label: 'crewmates win'
    }
});

const outcomeAudioElements = new Map();
const outcomeAudioBuffers = new Map();
let outcomeAudioPrimed = false;
let activeOutcomeSource = null;
let activeOutcomeGain = null;
let activeOutcomeMedia = null;
let outcomePlaybackRequest = 0;

function getRecordedOutcomeMedia(outcome) {
    if (!PARTYJNIAK_OUTCOME_AUDIO[outcome] || typeof Audio !== 'function') return null;
    if (outcomeAudioElements.has(outcome)) return outcomeAudioElements.get(outcome);
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    const media = new Audio(config.src);
    media.preload = 'auto';
    media.volume = config.volume;
    outcomeAudioElements.set(outcome, media);
    media.load?.();
    return media;
}

function stopOutcomeSound() {
    if (activeOutcomeMedia) {
        activeOutcomeMedia.pause();
        try { activeOutcomeMedia.currentTime = 0; } catch (_) {}
        activeOutcomeMedia = null;
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
    for (const outcome of Object.keys(PARTYJNIAK_OUTCOME_AUDIO)) {
        try { getRecordedOutcomeMedia(outcome); }
        catch (error) { console.warn('Nie można przygotować nagrania wyniku.', error); }
    }
}

// If an embedded browser rejects HTML media playback, use Web Audio to decode
// the same original MP3. Never substitute a synthetic sound.
async function playRecordedOutcomeFallback(outcome, requestId) {
    try {
        const context = getAudioContext();
        if (!context) return false;
        if (context.state === 'suspended') await context.resume();
        let buffer = outcomeAudioBuffers.get(outcome);
        if (!buffer) {
            const response = await fetch(PARTYJNIAK_OUTCOME_AUDIO[outcome].src, { cache: 'force-cache' });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            buffer = await context.decodeAudioData(await response.arrayBuffer());
            outcomeAudioBuffers.set(outcome, buffer);
        }
        if (requestId !== outcomePlaybackRequest || !isPartyjniakSoundEnabled()) return false;
        const source = context.createBufferSource();
        const gain = context.createGain();
        source.buffer = buffer;
        gain.gain.value = PARTYJNIAK_OUTCOME_AUDIO[outcome].volume;
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
        console.warn('Nie udało się odtworzyć oryginalnego MP3 przez Web Audio.', error);
        return false;
    }
}

async function playRecordedOutcome(outcome) {
    if (!isPartyjniakSoundEnabled() || !PARTYJNIAK_OUTCOME_AUDIO[outcome]) return false;
    const requestId = outcomePlaybackRequest;
    const media = getRecordedOutcomeMedia(outcome);
    if (media) {
        try {
            if (!media.paused) media.pause();
            media.currentTime = 0;
            activeOutcomeMedia = media;
            // Crucial: play() is invoked inside the vote click's user gesture.
            await media.play();
            if (requestId !== outcomePlaybackRequest) {
                media.pause();
                return false;
            }
            return true;
        } catch (error) {
            console.warn('HTML audio nie odtworzyło nagrania, próbuję Web Audio.', error);
        }
    }
    return playRecordedOutcomeFallback(outcome, requestId);
}

async function playOutcomeSound(outcome) {
    ++outcomePlaybackRequest;
    stopOutcomeSound();
    if (!isPartyjniakSoundEnabled() || !PARTYJNIAK_OUTCOME_AUDIO[outcome]) return false;
    // Native MediaPlayer plays the exact uploaded MP3 packaged in the APK.
    if (typeof playPartyjniakNativeOutcome === 'function' && playPartyjniakNativeOutcome(outcome)) return true;
    return playRecordedOutcome(outcome);
}

// Preload on the first interaction; the listener remains if sound was disabled.
document.addEventListener('pointerdown', primeOutcomeAudio, { passive: true, capture: true });
document.addEventListener('keydown', primeOutcomeAudio, { capture: true });
