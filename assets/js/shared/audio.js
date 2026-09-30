let audioCtx = null;

function getAudioContext() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioCtx = new AudioContextClass();
    }
    return audioCtx;
}

function playSound(type) {
    if (!soundEnabled) return;
    try {
        const context = getAudioContext();
        if (!context) return;
        if (context.state === 'suspended') context.resume();

        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.connect(gain);
        gain.connect(context.destination);
        const now = context.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.08);
            osc.frequency.setValueAtTime(783.99, now + 0.16);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'failure') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(246.94, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.42);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.003, now + 0.48);
            osc.start(now);
            osc.stop(now + 0.48);
        } else if (type === 'reveal') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.setValueAtTime(880, now + 0.12);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'alarm') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.setValueAtTime(554.37, now + 0.12);
            osc.frequency.setValueAtTime(880, now + 0.24);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
            osc.start(now);
            osc.stop(now + 0.45);
        }
    } catch (error) {
        console.warn('Audio error:', error);
    }
}

function toggleAudio() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('audio-icon');
    if (icon) icon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    if (soundEnabled) playSound('click');
    persistSession();
}
