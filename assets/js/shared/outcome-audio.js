const PARTYJNIAK_OUTCOME_AUDIO = Object.freeze({
    impostor: { src: './assets/audio/impostor-win-evil-laugh.ogg', volume: 0.72, fallback: 'failure' },
    detectives: { src: './assets/audio/detectives-win-relief.ogg', volume: 0.68, fallback: 'success' }
});

const outcomeAudioCache = new Map();
let outcomeAudioPrimed = false;

function getOutcomeAudio(outcome) {
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    if (!config) return null;
    if (outcomeAudioCache.has(outcome)) return outcomeAudioCache.get(outcome);

    const audio = new Audio(config.src);
    audio.preload = 'auto';
    audio.volume = config.volume;
    outcomeAudioCache.set(outcome, audio);
    return audio;
}

function primeOutcomeAudio() {
    if (outcomeAudioPrimed) return;
    outcomeAudioPrimed = true;
    Object.keys(PARTYJNIAK_OUTCOME_AUDIO).forEach(outcome => {
        try { getOutcomeAudio(outcome)?.load(); } catch (_) { /* browser may defer loading */ }
    });
}

function playOutcomeSound(outcome) {
    if (!soundEnabled) return;
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    const audio = getOutcomeAudio(outcome);
    if (!config || !audio) return;

    try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = config.volume;
        const playback = audio.play();
        playback?.catch?.(() => playSound(config.fallback));
    } catch (_) {
        playSound(config.fallback);
    }
}

document.addEventListener('pointerdown', primeOutcomeAudio, { once: true, passive: true, capture: true });
document.addEventListener('keydown', primeOutcomeAudio, { once: true, capture: true });
