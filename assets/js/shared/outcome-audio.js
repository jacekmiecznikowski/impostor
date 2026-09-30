const PARTYJNIAK_OUTCOME_AUDIO = Object.freeze({
    impostor: {
        src: PARTYJNIAK_USER_OUTCOME_AUDIO.impostor,
        volume: 0.72,
        label: 'evil laugh'
    },
    detectives: {
        src: PARTYJNIAK_USER_OUTCOME_AUDIO.detectives,
        volume: 1.0,
        label: 'applause'
    }
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
    audio.playsInline = true;
    outcomeAudioCache.set(outcome, audio);
    return audio;
}

function primeOutcomeAudio() {
    if (outcomeAudioPrimed) return;
    outcomeAudioPrimed = true;

    Object.keys(PARTYJNIAK_OUTCOME_AUDIO).forEach(outcome => {
        try {
            getOutcomeAudio(outcome)?.load();
        } catch (error) {
            console.warn(`Nie udało się przygotować dźwięku wyniku (${outcome}).`, error);
        }
    });
}

async function playOutcomeSound(outcome) {
    if (!soundEnabled) return false;
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    const audio = getOutcomeAudio(outcome);
    if (!config || !audio) return false;

    try {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = config.volume;
        await audio.play();
        return true;
    } catch (error) {
        console.warn(`Nie udało się odtworzyć sampla „${config.label}”.`, error);
        return false;
    }
}

document.addEventListener('pointerdown', primeOutcomeAudio, { once: true, passive: true, capture: true });
document.addEventListener('keydown', primeOutcomeAudio, { once: true, capture: true });
