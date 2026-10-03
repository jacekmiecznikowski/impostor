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

function getThreeFiveRoundUnit(rounds) {
    const value = Math.abs(Number(rounds) || 0);
    if (value === 1) return 'runda';
    const lastTwo = value % 100;
    const last = value % 10;
    if (lastTwo >= 12 && lastTwo <= 14) return 'rund';
    if (last >= 2 && last <= 4) return 'rundy';
    return 'rund';
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
    const roundNumber = threeFiveState.completedRounds + 1;
    if (name) name.textContent = player?.name || 'Gracz';
    if (score) score.textContent = `${player?.score || 0} pkt`;
    if (turn) turn.textContent = `Runda ${roundNumber} • gracz ${threeFiveState.currentPlayerIndex + 1}/${threeFiveState.players.length}`;
    if (target) target.textContent = `${threeFiveState.answerCount} w ${threeFiveState.turnSeconds}`;
}

function showThreeFivePrompt() {
    if (!threeFiveRuntime.currentPrompt) threeFiveRuntime.currentPrompt = drawThreeFivePrompt();
    if (!threeFiveRuntime.currentPrompt) return;
    renderThreeFivePlayScreen();
    goToScreen('three-five-play');
}

function getThreeFiveSecondUnit(seconds) {
    const value = Math.abs(Number(seconds) || 0);
    if (value === 1) return 'sekunda';
    const lastTwo = value % 100;
    const last = value % 10;
    if (lastTwo >= 12 && lastTwo <= 14) return 'sekund';
    if (last >= 2 && last <= 4) return 'sekundy';
    return 'sekund';
}

function updateThreeFiveTimerUnit(seconds) {
    const unit = document.getElementById('three-five-timer-unit');
    if (unit) unit.textContent = getThreeFiveSecondUnit(seconds);
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

    const judge = document.getElementById('three-five-judge');
    judge?.classList.remove('hidden');
    playSound?.('alarm');
    navigator.vibrate?.([50, 35, 90]);
}

function createThreeFiveStandingRow(player, index, { showRoundResult = false } = {}) {
    const row = document.createElement('div');
    row.className = 'three-five-round-row';

    const position = document.createElement('span');
    position.className = 'three-five-round-position';
    position.textContent = String(index + 1);

    const copy = document.createElement('span');
    copy.className = 'three-five-round-copy';
    const name = document.createElement('strong');
    name.textContent = player?.name || 'Gracz';
    const meta = document.createElement('small');
    meta.textContent = `${player?.score || 0} pkt łącznie`;
    copy.append(name, meta);

    const result = document.createElement('span');
    result.className = 'three-five-round-points';
    if (showRoundResult) {
        const gained = Math.max(0, Number(threeFiveState.roundResults?.[player?.id]) || 0);
        result.textContent = gained ? '+1' : '0';
        result.classList.toggle('is-success', gained > 0);
    } else {
        result.textContent = `${player?.score || 0} pkt`;
    }

    row.append(position, copy, result);
    return row;
}

function getThreeFiveLeaderCopy() {
    const leaders = ThreeFiveRules.getLeaders(threeFiveState.players);
    if (!leaders.length) return 'Brak wyników.';
    if (leaders.length === 1) return `Prowadzi ${leaders[0].name} z wynikiem ${leaders[0].score || 0} pkt.`;
    return `Na prowadzeniu remis: ${leaders.map(player => player.name).join(', ')} • ${leaders[0].score || 0} pkt.`;
}

function renderThreeFiveRoundSummary() {
    const round = document.getElementById('three-five-round-number');
    const leader = document.getElementById('three-five-round-leader');
    const list = document.getElementById('three-five-round-ranking');
    if (round) round.textContent = `RUNDA ${threeFiveState.completedRounds}`;
    if (leader) leader.textContent = getThreeFiveLeaderCopy();
    if (!list) return;
    list.replaceChildren();
    ThreeFiveRules.sortStandings(threeFiveState.players).forEach((player, index) => {
        list.appendChild(createThreeFiveStandingRow(player, index, { showRoundResult: true }));
    });
}

function continueThreeFiveRound() {
    if (!threeFiveState.awaitingRoundDecision || threeFiveState.gameFinished) return;
    threeFiveState.awaitingRoundDecision = false;
    threeFiveState.roundResults = {};
    persistThreeFiveSession();
    playSound?.('click');
    prepareThreeFiveTurn();
}

function renderThreeFiveFinalResults() {
    const title = document.getElementById('three-five-final-title');
    const score = document.getElementById('three-five-final-score');
    const rounds = document.getElementById('three-five-final-rounds');
    const list = document.getElementById('three-five-final-ranking');
    const leaders = ThreeFiveRules.getLeaders(threeFiveState.players);
    const topScore = leaders.length ? Math.max(0, Number(leaders[0].score) || 0) : 0;

    if (title) {
        title.textContent = leaders.length === 1
            ? `${leaders[0].name} wygrywa!`
            : leaders.length > 1
                ? 'Remis!'
                : 'Koniec gry';
    }
    if (score) score.textContent = leaders.length > 1 ? `${leaders.length} liderów • ${topScore} pkt` : `${topScore} pkt`;
    if (rounds) rounds.textContent = `${threeFiveState.completedRounds} ${getThreeFiveRoundUnit(threeFiveState.completedRounds)}`;
    if (!list) return;
    list.replaceChildren();
    ThreeFiveRules.sortStandings(threeFiveState.players).forEach((player, index) => {
        list.appendChild(createThreeFiveStandingRow(player, index));
    });
}

function finishThreeFiveGame() {
    if (!threeFiveState.awaitingRoundDecision) return;
    threeFiveState.awaitingRoundDecision = false;
    threeFiveState.gameFinished = true;
    persistThreeFiveSession();
    renderThreeFiveFinalResults();
    playSound?.('success');
    navigator.vibrate?.(32);
    goToScreen('three-five-winner');
}

function judgeThreeFiveTurn(success) {
    if (!threeFiveRuntime.judging || !threeFiveRuntime.currentPrompt) return;
    const player = getThreeFiveCurrentPlayer();
    if (!player) return;

    const gained = ThreeFiveRules.scoreVerdict(Boolean(success));
    player.score = Math.max(0, Number(player.score) || 0) + gained;
    player.turns = Math.max(0, Number(player.turns) || 0) + 1;
    threeFiveState.roundResults[player.id] = gained;
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

    threeFiveRuntime.judging = false;
    threeFiveRuntime.currentPrompt = null;

    const next = ThreeFiveRules.nextPlayerIndex(threeFiveState.currentPlayerIndex, threeFiveState.players.length);
    if (next >= 0) threeFiveState.currentPlayerIndex = next;

    if (ThreeFiveRules.isRoundComplete(threeFiveState.turnNumber, threeFiveState.players.length)) {
        threeFiveState.completedRounds += 1;
        threeFiveState.awaitingRoundDecision = true;
        threeFiveState.gameFinished = false;
        persistThreeFiveSession();
        renderThreeFiveRoundSummary();
        goToScreen('three-five-round-summary');
        return;
    }

    persistThreeFiveSession();
    prepareThreeFiveTurn();
}

function restartThreeFiveMatch() {
    clearThreeFiveTimer();
    threeFiveRuntime.currentPrompt = null;
    threeFiveRuntime.judging = false;
    resetThreeFiveMatchScores();
    persistThreeFiveSession();
    prepareThreeFiveTurn();
}
