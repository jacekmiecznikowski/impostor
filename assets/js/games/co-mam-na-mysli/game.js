const coMamNaMysliRuntime = {
    active: false,
    countingDown: false,
    deck: [],
    cardIndex: 0,
    timerId: null,
    countdownId: null,
    endsAt: 0,
    correct: 0,
    passed: 0,
    sensorEnabled: false,
    sensorBaseline: null,
    sensorSamples: 0,
    gestureLocked: false,
    finishing: false
};

function getCoMamNaMysliCurrentPlayer() {
    return coMamNaMysliState.players[coMamNaMysliState.currentPlayerIndex] || null;
}

function getCoMamNaMysliOrientationAngle() {
    const value = screen.orientation?.angle ?? window.orientation ?? 0;
    return CoMamNaMysliMotion.normalizeOrientationAngle(value);
}

function renderCoMamNaMysliReadyScreen() {
    const player = getCoMamNaMysliCurrentPlayer();
    const name = document.getElementById('cmm-ready-player');
    const time = document.getElementById('cmm-ready-time');
    const round = document.getElementById('cmm-ready-round');
    if (name) name.textContent = player?.name || 'Gracz';
    if (time) time.textContent = `${coMamNaMysliState.roundTime} s`;
    if (round) round.textContent = `Tura ${coMamNaMysliState.roundNumber + 1}`;
}

function resetCoMamNaMysliRuntime() {
    if (coMamNaMysliRuntime.timerId) clearInterval(coMamNaMysliRuntime.timerId);
    if (coMamNaMysliRuntime.countdownId) clearTimeout(coMamNaMysliRuntime.countdownId);
    window.removeEventListener('deviceorientation', handleCoMamNaMysliOrientation);
    Object.assign(coMamNaMysliRuntime, {
        active: false,
        countingDown: false,
        deck: [],
        cardIndex: 0,
        timerId: null,
        countdownId: null,
        endsAt: 0,
        correct: 0,
        passed: 0,
        sensorEnabled: false,
        sensorBaseline: null,
        sensorSamples: 0,
        gestureLocked: false,
        finishing: false
    });
}

async function requestCoMamNaMysliMotionPermission() {
    if (typeof window.DeviceOrientationEvent === 'undefined') return false;
    try {
        if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
            const status = await window.DeviceOrientationEvent.requestPermission();
            return status === 'granted';
        }
        return true;
    } catch (error) {
        console.warn('Nie udało się uzyskać dostępu do czujnika przechyłu.', error);
        return false;
    }
}

function handleCoMamNaMysliOrientation(event) {
    if (!coMamNaMysliRuntime.countingDown && !coMamNaMysliRuntime.active) return;
    const value = CoMamNaMysliMotion.getTiltValue(event, getCoMamNaMysliOrientationAngle());

    if (coMamNaMysliRuntime.sensorBaseline == null) {
        coMamNaMysliRuntime.sensorBaseline = value;
        coMamNaMysliRuntime.sensorSamples = 1;
        return;
    }

    if (coMamNaMysliRuntime.countingDown) {
        const samples = Math.min(20, coMamNaMysliRuntime.sensorSamples + 1);
        coMamNaMysliRuntime.sensorBaseline = ((coMamNaMysliRuntime.sensorBaseline * (samples - 1)) + value) / samples;
        coMamNaMysliRuntime.sensorSamples = samples;
        return;
    }

    if (!coMamNaMysliRuntime.active || coMamNaMysliRuntime.finishing) return;
    if (coMamNaMysliRuntime.gestureLocked) {
        if (CoMamNaMysliMotion.isNeutral(value, coMamNaMysliRuntime.sensorBaseline, 12)) {
            coMamNaMysliRuntime.gestureLocked = false;
        }
        return;
    }

    const action = CoMamNaMysliMotion.classifyTilt(value, coMamNaMysliRuntime.sensorBaseline, 28);
    if (action) markCoMamNaMysliCard(action, { fromSensor: true });
}

async function startCoMamNaMysliRound() {
    if (coMamNaMysliRuntime.active || coMamNaMysliRuntime.countingDown) return;
    const player = getCoMamNaMysliCurrentPlayer();
    if (!player) {
        showToast('Co mam na myśli?', 'Brak aktywnego gracza.');
        return;
    }

    normalizeCoMamNaMysliActiveCategories();
    const deck = CoMamNaMysliRules.buildDeck(CO_MAM_NA_MYSLI_CATEGORIES, coMamNaMysliState.activeCategories);
    if (!deck.length) {
        showToast('Co mam na myśli?', 'Brak haseł w wybranych kategoriach.');
        return;
    }

    const sensorEnabled = await requestCoMamNaMysliMotionPermission();
    resetCoMamNaMysliRuntime();
    coMamNaMysliRuntime.deck = deck;
    coMamNaMysliRuntime.sensorEnabled = sensorEnabled;
    coMamNaMysliRuntime.countingDown = true;

    await setPartyjniakOrientation?.('landscape');
    goToScreen('cmm-play');
    setGameAwakeMode?.(true);
    renderCoMamNaMysliPlayHeader();
    renderCoMamNaMysliCard();
    renderCoMamNaMysliLiveStats();
    updateCoMamNaMysliFallbackControls();

    if (sensorEnabled) window.addEventListener('deviceorientation', handleCoMamNaMysliOrientation, { passive: true });
    runCoMamNaMysliCountdown(3);
}

function runCoMamNaMysliCountdown(value) {
    if (!coMamNaMysliRuntime.countingDown) return;
    const overlay = document.getElementById('cmm-countdown');
    const number = document.getElementById('cmm-countdown-value');
    if (overlay) overlay.classList.remove('hidden');
    if (number) number.textContent = value > 0 ? String(value) : 'START';

    if (value > 0) {
        playSound?.('click');
        coMamNaMysliRuntime.countdownId = setTimeout(() => runCoMamNaMysliCountdown(value - 1), 700);
        return;
    }

    coMamNaMysliRuntime.countdownId = setTimeout(() => {
        if (overlay) overlay.classList.add('hidden');
        coMamNaMysliRuntime.countingDown = false;
        coMamNaMysliRuntime.active = true;
        coMamNaMysliRuntime.endsAt = Date.now() + coMamNaMysliState.roundTime * 1000;
        coMamNaMysliRuntime.timerId = setInterval(updateCoMamNaMysliTimer, 150);
        updateCoMamNaMysliTimer();
    }, 450);
}

function renderCoMamNaMysliPlayHeader() {
    const player = getCoMamNaMysliCurrentPlayer();
    const name = document.getElementById('cmm-play-player');
    if (name) name.textContent = player?.name || 'Gracz';
}

function getCoMamNaMysliCurrentCard() {
    if (!coMamNaMysliRuntime.deck.length) return null;
    return coMamNaMysliRuntime.deck[coMamNaMysliRuntime.cardIndex % coMamNaMysliRuntime.deck.length] || null;
}

function renderCoMamNaMysliCard() {
    const card = getCoMamNaMysliCurrentCard();
    if (!card) return;
    const word = document.getElementById('cmm-card-word');
    const category = document.getElementById('cmm-card-category');
    if (word) word.textContent = card.word;
    if (category) category.textContent = card.categoryName;
}

function renderCoMamNaMysliLiveStats() {
    const correct = document.getElementById('cmm-live-correct');
    const passed = document.getElementById('cmm-live-passed');
    if (correct) correct.textContent = String(coMamNaMysliRuntime.correct);
    if (passed) passed.textContent = String(coMamNaMysliRuntime.passed);
}

function updateCoMamNaMysliFallbackControls() {
    const controls = document.getElementById('cmm-fallback-controls');
    const status = document.getElementById('cmm-sensor-status');
    if (controls) controls.classList.toggle('hidden', coMamNaMysliRuntime.sensorEnabled);
    if (status) status.textContent = coMamNaMysliRuntime.sensorEnabled
        ? 'Przechyl w dół: dobrze • w górę: pomiń'
        : 'Czujnik niedostępny — użyj przycisków awaryjnych';
}

function advanceCoMamNaMysliCard() {
    if (!coMamNaMysliRuntime.deck.length) return;
    coMamNaMysliRuntime.cardIndex += 1;
    if (coMamNaMysliRuntime.cardIndex >= coMamNaMysliRuntime.deck.length) {
        coMamNaMysliRuntime.deck = CoMamNaMysliRules.shuffle(coMamNaMysliRuntime.deck);
        coMamNaMysliRuntime.cardIndex = 0;
    }
    renderCoMamNaMysliCard();
}

function showCoMamNaMysliGestureFeedback(action) {
    const overlay = document.getElementById('cmm-gesture-feedback');
    const label = document.getElementById('cmm-gesture-feedback-label');
    if (!overlay || !label) return;
    overlay.classList.remove('hidden', 'is-correct', 'is-passed');
    overlay.classList.add(action === 'correct' ? 'is-correct' : 'is-passed');
    label.textContent = action === 'correct' ? 'DOBRZE!' : 'POMIŃ';
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

function markCoMamNaMysliCard(action, { fromSensor = false } = {}) {
    if (!coMamNaMysliRuntime.active || coMamNaMysliRuntime.finishing) return;
    if (!['correct', 'passed'].includes(action)) return;

    if (fromSensor) coMamNaMysliRuntime.gestureLocked = true;
    if (action === 'correct') {
        coMamNaMysliRuntime.correct += 1;
        playSound?.('success');
        navigator.vibrate?.(35);
    } else {
        coMamNaMysliRuntime.passed += 1;
        playSound?.('click');
        navigator.vibrate?.(18);
    }
    showCoMamNaMysliGestureFeedback(action);
    renderCoMamNaMysliLiveStats();
    advanceCoMamNaMysliCard();
}

function updateCoMamNaMysliTimer() {
    if (!coMamNaMysliRuntime.active) return;
    const remainingMs = Math.max(0, coMamNaMysliRuntime.endsAt - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const value = document.getElementById('cmm-timer-value');
    const bar = document.getElementById('cmm-timer-bar');
    if (value) value.textContent = String(remainingSeconds);
    if (bar) {
        const progress = Math.min(1, remainingMs / Math.max(1, coMamNaMysliState.roundTime * 1000));
        bar.style.setProperty('--cmm-time-progress', String(progress));
        bar.classList.toggle('is-low', remainingSeconds <= 10);
    }
    if (remainingMs <= 0) finishCoMamNaMysliRound();
}

function finishCoMamNaMysliRound() {
    if ((!coMamNaMysliRuntime.active && !coMamNaMysliRuntime.countingDown) || coMamNaMysliRuntime.finishing) return;
    coMamNaMysliRuntime.finishing = true;
    if (coMamNaMysliRuntime.timerId) clearInterval(coMamNaMysliRuntime.timerId);
    if (coMamNaMysliRuntime.countdownId) clearTimeout(coMamNaMysliRuntime.countdownId);
    window.removeEventListener('deviceorientation', handleCoMamNaMysliOrientation);
    coMamNaMysliRuntime.timerId = null;
    coMamNaMysliRuntime.countdownId = null;
    coMamNaMysliRuntime.active = false;
    coMamNaMysliRuntime.countingDown = false;
    setGameAwakeMode?.(false);

    const summary = CoMamNaMysliRules.scoreRound(coMamNaMysliRuntime.correct, coMamNaMysliRuntime.passed);
    const player = getCoMamNaMysliCurrentPlayer();
    if (player) {
        player.score = (Number(player.score) || 0) + summary.score;
        player.turns = (Number(player.turns) || 0) + 1;
    }
    coMamNaMysliState.roundNumber += 1;
    const next = CoMamNaMysliRules.nextPlayerIndex(coMamNaMysliState.currentPlayerIndex, coMamNaMysliState.players.length);
    if (next >= 0) coMamNaMysliState.currentPlayerIndex = next;
    persistCoMamNaMysliSession();
    renderCoMamNaMysliResult(summary, player);
    playSound?.('alarm');
    navigator.vibrate?.([70, 40, 70]);
    setPartyjniakOrientation?.('portrait');
    goToScreen('cmm-result');
    coMamNaMysliRuntime.finishing = false;
}

function renderCoMamNaMysliResult(summary, player) {
    const playerName = document.getElementById('cmm-result-player');
    const score = document.getElementById('cmm-result-score');
    const correct = document.getElementById('cmm-result-correct');
    const passed = document.getElementById('cmm-result-passed');
    if (playerName) playerName.textContent = player?.name || 'Gracz';
    if (score) score.textContent = `+${summary.score} pkt`;
    if (correct) correct.textContent = String(summary.correct);
    if (passed) passed.textContent = String(summary.passed);
}

function startNextCoMamNaMysliRound() {
    resetCoMamNaMysliRuntime();
    renderCoMamNaMysliReadyScreen();
    goToScreen('cmm-ready');
}

function cancelCoMamNaMysliRound({ silent = false } = {}) {
    const wasRunning = coMamNaMysliRuntime.active || coMamNaMysliRuntime.countingDown;
    resetCoMamNaMysliRuntime();
    setGameAwakeMode?.(false);
    setPartyjniakOrientation?.('portrait');
    if (wasRunning && !silent) showToast('Co mam na myśli?', 'Tura została przerwana.');
}
