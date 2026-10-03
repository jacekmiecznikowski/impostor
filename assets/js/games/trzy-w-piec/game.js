const threeFiveRuntime = {
    currentPrompt: null,
    timerId: null,
    endsAt: 0,
    timerRunning: false,
    judging: false,
    lastWholeSecond: null
};

function getThreeFiveCurrentPlayer() {
    return threeFiveState.players[threeFiveState.currentPlayerIndex] || null;
}

function clearThreeFiveTimer() {
    if (threeFiveRuntime.timerId) clearInterval(threeFiveRuntime.timerId);
    threeFiveRuntime.timerId = null;
    threeFiveRuntime.timerRunning = false;
    threeFiveRuntime.endsAt = 0;
    threeFiveRuntime.lastWholeSecond = null;
}

function cancelThreeFiveTurn({ silent = false } = {}) {
    const wasRunning = threeFiveRuntime.timerRunning;
    clearThreeFiveTimer();
    threeFiveRuntime.currentPrompt = null;
    threeFiveRuntime.judging = false;
    setGameAwakeMode?.(false);
    if (wasRunning && !silent) showToast('Trzy w Pięć', 'Odliczanie zostało przerwane.');
}

function drawThreeFivePrompt() {
    const deck = ThreeFiveRules.buildPromptDeck(
        THREE_FIVE_CATEGORIES,
        threeFiveState.activeCategories,
        threeFiveState.recentPromptIds
    );
    return deck[0] || null;
}

function prepareThreeFiveTurn() {
    clearThreeFiveTimer();
    threeFiveRuntime.judging = false;
    threeFiveRuntime.currentPrompt = drawThreeFivePrompt();
    if (!threeFiveRuntime.currentPrompt) {
        showToast('Trzy w Pięć', 'Brak wyzwań w wybranych kategoriach.');
        goToScreen('three-five-options', { direction: 'back' });
        return;
    }
    renderThreeFiveReadyScreen();
    goToScreen('three-five-ready');
}

function renderThreeFiveReadyScreen() {
    const player = getThreeFiveCurrentPlayer();
    const name = document.getElementById('three-five-ready-player');
    const score = document.getElementById('three-five-ready-score');
    const turn = document.getElementById('three-five-ready-turn');
    const target = document.getElementById('three-five-ready-target');
    if (name) name.textContent = player?.name || 'Gracz';
    if (score) score.textContent = `${player?.score || 0} pkt`;
    if (turn) turn.textContent = `Tura ${threeFiveState.turnNumber + 1}`;
    if (target) target.textContent = `${threeFiveState.answerCount} w ${threeFiveState.turnSeconds} • do ${threeFiveState.targetScore} pkt`;
}

function showThreeFivePrompt() {
    if (!threeFiveRuntime.currentPrompt) threeFiveRuntime.currentPrompt = drawThreeFivePrompt();
    if (!threeFiveRuntime.currentPrompt) return;
    renderThreeFivePlayScreen();
    goToScreen('three-five-play');
}

function getThreeFiveSecondUnit(seconds) {
    const value = Number(seconds);
    if (value === 1) return 'sekunda';
    if ([2, 3, 4].includes(value)) return 'sekundy';
    return 'sekund';
}

function updateThreeFiveTimerUnit(seconds) {
    const unit = document.getElementById('three-five-timer-unit');
    if (unit) unit.textContent = getThreeFiveSecondUnit(seconds);
}

function renderThreeFiveTimerTicks() {
    const timer = document.getElementById('three-five-timer');
    const container = document.getElementById('three-five-timer-ticks');
    if (!container || !timer) return;
    const total = ThreeFiveRules.normalizeChallengeValue(threeFiveState.turnSeconds, ThreeFiveRules.DEFAULT_TURN_SECONDS);
    container.replaceChildren();
    timer.classList.toggle('has-many-ticks', total > 10);
    timer.classList.toggle('has-dense-ticks', total > 20);

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < total; index += 1) {
        const tick = document.createElement('span');
        tick.className = 'three-five-timer-tick';
        tick.dataset.threeFiveTick = String(total - index);
        tick.style.setProperty('--tick-angle', `${(index * 360) / total}deg`);
        tick.setAttribute('aria-hidden', 'true');
        fragment.appendChild(tick);
    }
    container.appendChild(fragment);
}

function renderThreeFivePlayScreen() {
    const player = getThreeFiveCurrentPlayer();
    const prompt = threeFiveRuntime.currentPrompt;
    const answerCount = ThreeFiveRules.normalizeChallengeValue(threeFiveState.answerCount, ThreeFiveRules.DEFAULT_ANSWER_COUNT);
    const turnSeconds = ThreeFiveRules.normalizeChallengeValue(threeFiveState.turnSeconds, ThreeFiveRules.DEFAULT_TURN_SECONDS);
    const name = document.getElementById('three-five-current-player');
    const category = document.getElementById('three-five-prompt-category');
    const text = document.getElementById('three-five-prompt-text');
    const rule = document.getElementById('three-five-prompt-rule-text');
    const startCopy = document.getElementById('three-five-start-copy');
    const stopCopy = document.getElementById('three-five-stop-copy');
    if (name) name.textContent = player?.name || 'Gracz';
    if (category) category.textContent = prompt?.categoryName || 'Wyzwanie';
    if (text) text.textContent = ThreeFiveRules.formatPrompt(prompt?.text, answerCount);
    if (rule) rule.textContent = `Podaj dokładnie ${answerCount} ${ThreeFiveRules.getAnswerUnit(answerCount)}`;
    if (startCopy) startCopy.textContent = `Od tej chwili masz ${turnSeconds} ${getThreeFiveSecondUnit(turnSeconds)}`;
    if (stopCopy) stopCopy.textContent = `CZAS! Czy udało się podać ${answerCount} ${ThreeFiveRules.getAnswerUnit(answerCount)}?`;

    const timer = document.getElementById('three-five-timer');
    timer?.style.setProperty('--three-five-progress', '1');
    timer?.style.setProperty('--three-five-elapsed-angle', '0turn');
    timer?.classList.remove('is-running', 'is-critical', 'is-expired', 'is-pulsing');
    const value = document.getElementById('three-five-timer-value');
    if (value) value.textContent = String(turnSeconds);
    updateThreeFiveTimerUnit(turnSeconds);
    renderThreeFiveTimerTicks();

    const start = document.getElementById('three-five-start-btn');
    const judge = document.getElementById('three-five-judge');
    start?.classList.remove('hidden');
    judge?.classList.add('hidden');
    threeFiveRuntime.judging = false;
}

function pulseThreeFiveTimer() {
    const timer = document.getElementById('three-five-timer');
    if (!timer) return;
    timer.classList.remove('is-pulsing');
    void timer.offsetWidth;
    timer.classList.add('is-pulsing');
}

function updateThreeFiveTimerVisual(remainingMs) {
    const turnSeconds = ThreeFiveRules.normalizeChallengeValue(threeFiveState.turnSeconds, ThreeFiveRules.DEFAULT_TURN_SECONDS);
    const totalMs = turnSeconds * 1000;
    const progress = Math.max(0, Math.min(1, remainingMs / totalMs));
    const elapsed = 1 - progress;
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const timer = document.getElementById('three-five-timer');
    const value = document.getElementById('three-five-timer-value');
    timer?.style.setProperty('--three-five-progress', String(progress));
    timer?.style.setProperty('--three-five-elapsed-angle', `${elapsed}turn`);
    timer?.classList.toggle('is-critical', seconds <= 2 && remainingMs > 0);
    if (value) value.textContent = String(seconds);
    updateThreeFiveTimerUnit(seconds);

    document.querySelectorAll('[data-three-five-tick]').forEach(tick => {
        const tickValue = Number(tick.dataset.threeFiveTick);
        tick.classList.toggle('is-spent', tickValue > seconds);
    });

    if (seconds !== threeFiveRuntime.lastWholeSecond) {
        if (threeFiveRuntime.lastWholeSecond !== null && seconds > 0) {
            playSound?.('click');
            navigator.vibrate?.(seconds <= 2 ? 22 : 12);
            pulseThreeFiveTimer();
        }
        threeFiveRuntime.lastWholeSecond = seconds;
    }
}

function startThreeFiveCountdown() {
    if (threeFiveRuntime.timerRunning || threeFiveRuntime.judging || !threeFiveRuntime.currentPrompt) return;
    const start = document.getElementById('three-five-start-btn');
    start?.classList.add('hidden');
    const timer = document.getElementById('three-five-timer');
    timer?.classList.add('is-running');

    const turnSeconds = ThreeFiveRules.normalizeChallengeValue(threeFiveState.turnSeconds, ThreeFiveRules.DEFAULT_TURN_SECONDS);
    threeFiveRuntime.timerRunning = true;
    threeFiveRuntime.lastWholeSecond = turnSeconds;
    threeFiveRuntime.endsAt = performance.now() + turnSeconds * 1000;
    setGameAwakeMode?.(true);
    playSound?.('reveal');
    navigator.vibrate?.(18);
    updateThreeFiveCountdown();
    threeFiveRuntime.timerId = setInterval(updateThreeFiveCountdown, 40);
}

function updateThreeFiveCountdown() {
    if (!threeFiveRuntime.timerRunning) return;
    const remainingMs = Math.max(0, threeFiveRuntime.endsAt - performance.now());
    updateThreeFiveTimerVisual(remainingMs);
    if (remainingMs <= 0) expireThreeFiveCountdown();
}

function expireThreeFiveCountdown() {
    if (!threeFiveRuntime.timerRunning) return;
    clearThreeFiveTimer();
    threeFiveRuntime.judging = true;
    setGameAwakeMode?.(false);

    const timer = document.getElementById('three-five-timer');
    timer?.style.setProperty('--three-five-progress', '0');
    timer?.style.setProperty('--three-five-elapsed-angle', '1turn');
    timer?.classList.add('is-expired');
    timer?.classList.remove('is-running', 'is-critical');
    const value = document.getElementById('three-five-timer-value');
    if (value) value.textContent = '0';
    updateThreeFiveTimerUnit(0);
    document.querySelectorAll('[data-three-five-tick]').forEach(tick => tick.classList.add('is-spent'));

    const judge = document.getElementById('three-five-judge');
    judge?.classList.remove('hidden');
    playSound?.('alarm');
    navigator.vibrate?.([50, 35, 90]);
}

function judgeThreeFiveTurn(success) {
    if (!threeFiveRuntime.judging || !threeFiveRuntime.currentPrompt) return;
    const player = getThreeFiveCurrentPlayer();
    if (!player) return;

    const gained = ThreeFiveRules.scoreVerdict(Boolean(success));
    player.score = Math.max(0, Number(player.score) || 0) + gained;
    player.turns = Math.max(0, Number(player.turns) || 0) + 1;
    threeFiveState.turnNumber += 1;
    threeFiveState.recentPromptIds = ThreeFiveRules.rememberPrompt(
        threeFiveState.recentPromptIds,
        threeFiveRuntime.currentPrompt.id
    );

    if (success) {
        playSound?.('success');
        navigator.vibrate?.(28);
    } else {
        playSound?.('failure');
    }

    const won = ThreeFiveRules.hasWinner(player.score, threeFiveState.targetScore);
    threeFiveRuntime.judging = false;
    threeFiveRuntime.currentPrompt = null;

    if (won) {
        persistThreeFiveSession();
        renderThreeFiveWinner(player);
        goToScreen('three-five-winner');
        return;
    }

    const next = ThreeFiveRules.nextPlayerIndex(threeFiveState.currentPlayerIndex, threeFiveState.players.length);
    if (next >= 0) threeFiveState.currentPlayerIndex = next;
    persistThreeFiveSession();
    prepareThreeFiveTurn();
}

function renderThreeFiveWinner(player) {
    const name = document.getElementById('three-five-winner-name');
    const score = document.getElementById('three-five-winner-score');
    const turns = document.getElementById('three-five-winner-turns');
    if (name) name.textContent = player?.name || 'Gracz';
    if (score) score.textContent = `${player?.score || 0} pkt`;
    if (turns) turns.textContent = `${player?.turns || 0} tur`;
}

function restartThreeFiveMatch() {
    clearThreeFiveTimer();
    threeFiveRuntime.currentPrompt = null;
    threeFiveRuntime.judging = false;
    resetThreeFiveMatchScores();
    persistThreeFiveSession();
    prepareThreeFiveTurn();
}
