const synchronizacjaRuntime = {
    currentScale: null,
    target: 50,
    guess: 50,
    result: null
};

function getSynchronizacjaCurrentPlayer() {
    return synchronizacjaState.players[synchronizacjaState.currentPlayerIndex] || null;
}

function drawSynchronizacjaScale() {
    const deck = SynchronizacjaRules.buildScaleDeck(
        SYNCHRONIZACJA_CATEGORIES,
        synchronizacjaState.activeCategories,
        synchronizacjaState.recentScaleIds
    );
    return deck[0] || null;
}

function setSynchronizacjaSpectrum(element, { target = synchronizacjaRuntime.target, guess = synchronizacjaRuntime.guess } = {}) {
    if (!element) return;
    const safeTarget = SynchronizacjaRules.normalizePosition(target);
    const safeGuess = SynchronizacjaRules.normalizePosition(guess);
    element.style.setProperty('--sync-target', `${safeTarget}%`);
    element.style.setProperty('--sync-guess', `${safeGuess}%`);
    element.style.setProperty('--sync-distance-start', `${Math.min(safeTarget, safeGuess)}%`);
    element.style.setProperty('--sync-distance-width', `${Math.abs(safeTarget - safeGuess)}%`);
}

function fillSynchronizacjaScaleLabels(prefix, scale = synchronizacjaRuntime.currentScale) {
    const left = document.getElementById(`${prefix}-left`);
    const right = document.getElementById(`${prefix}-right`);
    if (left) left.textContent = scale?.left || 'Lewo';
    if (right) right.textContent = scale?.right || 'Prawo';
}

function prepareSynchronizacjaTurn() {
    synchronizacjaRuntime.currentScale = drawSynchronizacjaScale();
    synchronizacjaRuntime.target = SynchronizacjaRules.createTarget();
    synchronizacjaRuntime.guess = 50;
    synchronizacjaRuntime.result = null;
    if (!synchronizacjaRuntime.currentScale) {
        showToast('Synchronizacja', 'Brak skal w wybranych kategoriach.');
        goToScreen('sync-options', { direction: 'back' });
        return;
    }
    renderSynchronizacjaReadyScreen();
    goToScreen('sync-ready');
}

function renderSynchronizacjaReadyScreen() {
    const player = getSynchronizacjaCurrentPlayer();
    const name = document.getElementById('sync-ready-player');
    const score = document.getElementById('sync-ready-score');
    const round = document.getElementById('sync-ready-round');
    if (name) name.textContent = player?.name || 'Gracz';
    if (score) score.textContent = `${player?.score || 0} pkt`;
    if (round) round.textContent = `Runda ${synchronizacjaState.completedRounds + 1}`;
}

function showSynchronizacjaClueScreen() {
    if (!synchronizacjaRuntime.currentScale) synchronizacjaRuntime.currentScale = drawSynchronizacjaScale();
    if (!synchronizacjaRuntime.currentScale) return;
    renderSynchronizacjaClueScreen();
    goToScreen('sync-clue');
}

function renderSynchronizacjaClueScreen() {
    const player = getSynchronizacjaCurrentPlayer();
    const name = document.getElementById('sync-clue-player');
    const category = document.getElementById('sync-clue-category');
    const value = document.getElementById('sync-target-value');
    if (name) name.textContent = player?.name || 'Gracz';
    if (category) category.textContent = synchronizacjaRuntime.currentScale?.categoryName || 'Skala';
    if (value) value.textContent = String(synchronizacjaRuntime.target);
    fillSynchronizacjaScaleLabels('sync-clue');
    setSynchronizacjaSpectrum(document.getElementById('sync-clue-spectrum'));
}

function startSynchronizacjaGuess() {
    synchronizacjaRuntime.guess = 50;
    renderSynchronizacjaGuessScreen();
    playSound?.('reveal');
    navigator.vibrate?.(18);
    goToScreen('sync-guess');
}

function renderSynchronizacjaGuessScreen() {
    const category = document.getElementById('sync-guess-category');
    const slider = document.getElementById('sync-guess-input');
    const value = document.getElementById('sync-guess-value');
    if (category) category.textContent = synchronizacjaRuntime.currentScale?.categoryName || 'Skala';
    if (slider) slider.value = String(synchronizacjaRuntime.guess);
    if (value) value.textContent = String(synchronizacjaRuntime.guess);
    fillSynchronizacjaScaleLabels('sync-guess');
    setSynchronizacjaSpectrum(document.getElementById('sync-guess-spectrum'));
}

function setSynchronizacjaGuess(value) {
    synchronizacjaRuntime.guess = SynchronizacjaRules.normalizePosition(value);
    const output = document.getElementById('sync-guess-value');
    if (output) output.textContent = String(synchronizacjaRuntime.guess);
    setSynchronizacjaSpectrum(document.getElementById('sync-guess-spectrum'));
}

function submitSynchronizacjaGuess() {
    if (!synchronizacjaRuntime.currentScale) return;
    const player = getSynchronizacjaCurrentPlayer();
    if (!player) return;

    const result = SynchronizacjaRules.scoreGuess(synchronizacjaRuntime.target, synchronizacjaRuntime.guess);
    synchronizacjaRuntime.result = result;
    player.score = Math.max(0, Number(player.score) || 0) + result.points;
    player.turns = Math.max(0, Number(player.turns) || 0) + 1;
    synchronizacjaState.turnNumber += 1;
    synchronizacjaState.roundResults[player.id] = result.points;
    synchronizacjaState.recentScaleIds = SynchronizacjaRules.rememberScale(
        synchronizacjaState.recentScaleIds,
        synchronizacjaRuntime.currentScale.id
    );
    persistSynchronizacjaSession();

    if (result.points >= 3) {
        playSound?.('success');
        navigator.vibrate?.([25, 30, 45]);
    } else if (result.points > 0) {
        playSound?.('click');
        navigator.vibrate?.(18);
    } else {
        playSound?.('failure');
    }

    renderSynchronizacjaRevealScreen();
    goToScreen('sync-reveal');
}

function renderSynchronizacjaRevealScreen() {
    const result = synchronizacjaRuntime.result || SynchronizacjaRules.scoreGuess(synchronizacjaRuntime.target, synchronizacjaRuntime.guess);
    const points = document.getElementById('sync-reveal-points');
    const distance = document.getElementById('sync-reveal-distance');
    const target = document.getElementById('sync-reveal-target-value');
    const guess = document.getElementById('sync-reveal-guess-value');
    const message = document.getElementById('sync-reveal-message');
    if (points) points.textContent = `+${result.points} pkt`;
    if (distance) distance.textContent = `Odległość: ${result.distance}`;
    if (target) target.textContent = String(result.target);
    if (guess) guess.textContent = String(result.guess);
    if (message) {
        message.textContent = result.points === 4 ? 'Idealna synchronizacja!' : result.points === 3 ? 'Bardzo blisko!' : result.points === 2 ? 'Dobry kierunek.' : result.points === 1 ? 'Prawie złapaliście falę.' : 'Tym razem częstotliwości się minęły.';
    }
    fillSynchronizacjaScaleLabels('sync-reveal');
    setSynchronizacjaSpectrum(document.getElementById('sync-reveal-spectrum'), result);
}

function advanceSynchronizacjaTurn() {
    const roundComplete = SynchronizacjaRules.isRoundComplete(synchronizacjaState.turnNumber, synchronizacjaState.players.length);
    synchronizacjaRuntime.currentScale = null;
    synchronizacjaRuntime.result = null;

    if (roundComplete) {
        synchronizacjaState.completedRounds += 1;
        synchronizacjaState.awaitingRoundDecision = true;
        synchronizacjaState.currentPlayerIndex = 0;
        persistSynchronizacjaSession();
        renderSynchronizacjaRoundSummary();
        goToScreen('sync-round-summary');
        return;
    }

    const next = SynchronizacjaRules.nextPlayerIndex(synchronizacjaState.currentPlayerIndex, synchronizacjaState.players.length);
    if (next >= 0) synchronizacjaState.currentPlayerIndex = next;
    persistSynchronizacjaSession();
    prepareSynchronizacjaTurn();
}

function renderSynchronizacjaRanking(containerId, { roundOnly = false } = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();
    const sorted = SynchronizacjaRules.sortStandings(synchronizacjaState.players);
    sorted.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'sync-ranking-row';
        const position = document.createElement('span');
        position.className = 'sync-ranking-position';
        position.textContent = String(index + 1);
        const copy = document.createElement('span');
        copy.className = 'sync-ranking-copy';
        const name = document.createElement('strong');
        name.textContent = player.name;
        const meta = document.createElement('small');
        meta.textContent = roundOnly ? `${player.score} pkt łącznie` : `${player.turns || 0} tur`;
        copy.append(name, meta);
        const score = document.createElement('span');
        score.className = 'sync-ranking-score';
        score.textContent = roundOnly ? `+${Number(synchronizacjaState.roundResults[player.id]) || 0}` : `${player.score || 0} pkt`;
        row.append(position, copy, score);
        container.appendChild(row);
    });
}

function renderSynchronizacjaRoundSummary() {
    const round = document.getElementById('sync-summary-round');
    const leader = document.getElementById('sync-summary-leader');
    if (round) round.textContent = `Runda ${synchronizacjaState.completedRounds}`;
    const leaders = SynchronizacjaRules.getLeaders(synchronizacjaState.players);
    if (leader) {
        leader.textContent = leaders.length > 1
            ? `Remis na prowadzeniu: ${leaders.map(player => player.name).join(', ')}`
            : leaders.length === 1 ? `Prowadzi ${leaders[0].name} • ${leaders[0].score} pkt` : 'Pierwsza runda za Wami.';
    }
    renderSynchronizacjaRanking('sync-round-ranking', { roundOnly: true });
}

function continueSynchronizacjaRound() {
    synchronizacjaState.roundResults = {};
    synchronizacjaState.awaitingRoundDecision = false;
    synchronizacjaState.currentPlayerIndex = 0;
    persistSynchronizacjaSession();
    prepareSynchronizacjaTurn();
}

function finishSynchronizacjaGame() {
    synchronizacjaState.gameFinished = true;
    synchronizacjaState.awaitingRoundDecision = false;
    persistSynchronizacjaSession();
    renderSynchronizacjaFinal();
    goToScreen('sync-final');
}

function renderSynchronizacjaFinal() {
    const title = document.getElementById('sync-final-title');
    const copy = document.getElementById('sync-final-copy');
    const leaders = SynchronizacjaRules.getLeaders(synchronizacjaState.players);
    if (title) title.textContent = leaders.length > 1 ? 'Mamy remis!' : leaders.length === 1 ? `${leaders[0].name} wygrywa!` : 'Koniec gry';
    if (copy) {
        copy.textContent = leaders.length > 1
            ? `${leaders.map(player => player.name).join(', ')} kończą z wynikiem ${leaders[0]?.score || 0} pkt.`
            : leaders.length === 1 ? `${leaders[0].score} pkt po ${synchronizacjaState.completedRounds} rundach.` : 'Dzięki za grę!';
    }
    renderSynchronizacjaRanking('sync-final-ranking');
}

function restartSynchronizacjaMatch() {
    synchronizacjaRuntime.currentScale = null;
    synchronizacjaRuntime.result = null;
    resetSynchronizacjaMatchScores();
    persistSynchronizacjaSession();
    prepareSynchronizacjaTurn();
}
