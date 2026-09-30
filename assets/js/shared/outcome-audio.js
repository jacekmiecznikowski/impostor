const PARTYJNIAK_OUTCOME_AUDIO = Object.freeze({
    impostor: {
        src: 'https://opengameart.org/sites/default/files/laugh-evil-1_0.ogg',
        volume: 0.78,
        label: 'evil laugh'
    },
    detectives: {
        src: 'https://opengameart.org/sites/default/files/Well%20Done%20CCBY3.ogg',
        volume: 0.66,
        label: 'applause / relief'
    }
});

const outcomeAudioCache = new Map();
let outcomeAudioPrimed = false;

function getOutcomeAudio(outcome) {
    const config = PARTYJNIAK_OUTCOME_AUDIO[outcome];
    if (!config) return null;
    if (outcomeAudioCache.has(outcome)) return outcomeAudioCache.get(outcome);

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = config.src;
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
            const audio = getOutcomeAudio(outcome);
            audio?.load();
        } catch (error) {
            console.warn(`Nie udało się wstępnie załadować dźwięku wyniku (${outcome}).`, error);
        }
    });
}

function playOutcomeFallback(outcome) {
    try {
        const context = getAudioContext?.();
        if (!context) return;
        if (context.state === 'suspended') context.resume();

        const now = context.currentTime;
        const master = context.createGain();
        master.gain.setValueAtTime(0.0001, now);
        master.connect(context.destination);

        if (outcome === 'impostor') {
            // Trzy krótkie, niskie impulsy zamiast dawnego „plum”.
            [0, 0.24, 0.5].forEach((offset, index) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.type = index % 2 ? 'square' : 'sawtooth';
                osc.frequency.setValueAtTime(165 - index * 18, now + offset);
                osc.frequency.exponentialRampToValueAtTime(82, now + offset + 0.2);
                gain.gain.setValueAtTime(0.0001, now + offset);
                gain.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.2);
                osc.connect(gain);
                gain.connect(master);
                osc.start(now + offset);
                osc.stop(now + offset + 0.22);
            });
            master.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
        } else {
            // Ciepły akord ulgi / zwycięstwa.
            [523.25, 659.25, 783.99].forEach((frequency, index) => {
                const osc = context.createOscillator();
                const gain = context.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(frequency, now + index * 0.06);
                gain.gain.setValueAtTime(0.0001, now + index * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08 + index * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85 + index * 0.06);
                osc.connect(gain);
                gain.connect(master);
                osc.start(now + index * 0.06);
                osc.stop(now + 0.95 + index * 0.06);
            });
            master.gain.exponentialRampToValueAtTime(0.8, now + 0.02);
            master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
        }
    } catch (error) {
        console.warn('Nie udało się odtworzyć awaryjnego dźwięku wyniku.', error);
    }
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
        playback?.catch?.(error => {
            console.warn(`Nie udało się odtworzyć sampla „${config.label}”. Używam dedykowanego fallbacku.`, error);
            playOutcomeFallback(outcome);
        });
    } catch (error) {
        console.warn(`Błąd odtwarzania sampla „${config.label}”. Używam dedykowanego fallbacku.`, error);
        playOutcomeFallback(outcome);
    }
}

document.addEventListener('pointerdown', primeOutcomeAudio, { once: true, passive: true, capture: true });
document.addEventListener('keydown', primeOutcomeAudio, { once: true, capture: true });
