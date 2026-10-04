const trzyRundyRuntime = {
    currentWord: null,
    timerId: null,
    endsAt: 0,
    running: false,
    turnPoints: 0,
    lastSecond: null
};

function getTrzyRundyTeams() { return TrzyRundyRules.assignTeams(trzyRundyState.players); }
function getTrzyRundyCurrentTeamPlayers() { return getTrzyRundyTeams()[trzyRundyState.activeTeam] || []; }
function getTrzyRundyClueGiver() {
    const team = getTrzyRundyCurrentTeamPlayers();
    if (!team.length) return null;
    const offset = trzyRundyState.clueOffsets[trzyRundyState.activeTeam] % team.length;
    return team[offset];
}
function getTrzyRundyWordById(id) { return trzyRundyState.pool.find(word => word.id === id) || null; }
function drawTrzyRundyWord() {
    if (!trzyRundyState.remainingIds.length) return null;
    const id = trzyRundyState.remainingIds[Math.floor(Math.random() * trzyRundyState.remainingIds.length)];
    return getTrzyRundyWordById(id);
}

function clearTrzyRundyTimer() {
    if (trzyRundyRuntime.timerId) clearInterval(trzyRundyRuntime.timerId);
    trzyRundyRuntime.timerId = null;
    trzyRundyRuntime.endsAt = 0;
    trzyRundyRuntime.running = false;
    trzyRundyRuntime.lastSecond = null;
    setGameAwakeMode?.(false);
}

function cancelTrzyRundyTurn({ silent = false } = {}) {
    const wasRunning = trzyRundyRuntime.running;
    clearTrzyRundyTimer();
    trzyRundyRuntime.currentWord = null;
    trzyRundyRuntime.turnPoints = 0;
    if (wasRunning && !silent) showToast('Trzy Rundy', 'Tura została przerwana.');
}

function prepareTrzyRundyTurn() {
    clearTrzyRundyTimer();
    if (!trzyRundyState.remainingIds.length) return finishTrzyRundyRound();
    trzyRundyRuntime.currentWord = null;
    trzyRundyRuntime.turnPoints = 0;
    renderTrzyRundyReady();
    goToScreen('tr-ready');
}

function renderTrzyRundyReady() {
    const mode = TrzyRundyRules.getRoundMode(trzyRundyState.currentRound);
    const clue = getTrzyRundyClueGiver();
    const team = trzyRundyState.activeTeam === 0 ? 'Drużyna A' : 'Drużyna B';
    const round = document.getElementById('tr-ready-round');
    const modeName = document.getElementById('tr-ready-mode');
    const player = document.getElementById('tr-ready-player');
    const teamEl = document.getElementById('tr-ready-team');
    const instruction = document.getElementById('tr-ready-instruction');
    const remaining = document.getElementById('tr-ready-remaining');
    if (round) round.textContent = `Runda ${trzyRundyState.currentRound} z 3`;
    if (modeName) modeName.textContent = mode.name;
    if (player) player.textContent = clue?.name || 'Gracz';
    if (teamEl) teamEl.textContent = team;
    if (instruction) instruction.textContent = mode.instruction;
    if (remaining) remaining.textContent = `${trzyRundyState.remainingIds.length} haseł zostało`;
}

function startTrzyRundyTurn() {
    trzyRundyRuntime.currentWord = drawTrzyRundyWord();
    if (!trzyRundyRuntime.currentWord) return finishTrzyRundyRound();
    renderTrzyRundyPlay();
    goToScreen('tr-play');
    const seconds = TrzyRundyRules.normalizeTurnSeconds(trzyRundyState.turnSeconds);
    trzyRundyRuntime.running = true;
    trzyRundyRuntime.endsAt = performance.now() + seconds * 1000;
    trzyRundyRuntime.lastSecond = seconds;
    setGameAwakeMode?.(true);
    playSound?.('reveal');
    navigator.vibrate?.(18);
    updateTrzyRundyCountdown();
    trzyRundyRuntime.timerId = setInterval(updateTrzyRundyCountdown, 80);
}

function renderTrzyRundyPlay() {
    const mode = TrzyRundyRules.getRoundMode(trzyRundyState.currentRound);
    const word = document.getElementById('tr-word');
    const modeName = document.getElementById('tr-play-mode');
    const instruction = document.getElementById('tr-play-instruction');
    const team = document.getElementById('tr-play-team');
    const points = document.getElementById('tr-turn-points');
    const timer = document.getElementById('tr-timer');
    if (word) word.textContent = trzyRundyRuntime.currentWord?.text || 'Hasło';
    if (modeName) modeName.textContent = `${mode.name} • Runda ${trzyRundyState.currentRound}`;
    if (instruction) instruction.textContent = mode.instruction;
    if (team) team.textContent = trzyRundyState.activeTeam === 0 ? 'Drużyna A' : 'Drużyna B';
    if (points) points.textContent = `${trzyRundyRuntime.turnPoints} pkt w tej turze`;
    if (timer) timer.textContent = String(trzyRundyState.turnSeconds);
}

function updateTrzyRundyCountdown() {
    if (!trzyRundyRuntime.running) return;
    const remainingMs = Math.max(0, trzyRundyRuntime.endsAt - performance.now());
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    const timer = document.getElementById('tr-timer');
    const ring = document.getElementById('tr-timer-ring');
    if (timer) timer.textContent = String(seconds);
    if (ring) {
        const total = TrzyRundyRules.normalizeTurnSeconds(trzyRundyState.turnSeconds) * 1000;
        ring.style.setProperty('--tr-progress', String(Math.max(0, Math.min(1, remainingMs / total))));
        ring.classList.toggle('is-critical', seconds <= 5 && seconds > 0);
    }
    if (seconds !== trzyRundyRuntime.lastSecond) {
        if (trzyRundyRuntime.lastSecond !== null && seconds > 0 && seconds <= 5) {
            playSound?.('click');
            navigator.vibrate?.(12);
        }
        trzyRundyRuntime.lastSecond = seconds;
    }
    if (remainingMs <= 0) finishTrzyRundyTurn();
}

function markTrzyRundyWordGuessed() {
    if (!trzyRundyRuntime.running || !trzyRundyRuntime.currentWord) return;
    const id = trzyRundyRuntime.currentWord.id;
    trzyRundyState.remainingIds = trzyRundyState.remainingIds.filter(item => item !== id);
    trzyRundyState.teamScores[trzyRundyState.activeTeam] += 1;
    trzyRundyRuntime.turnPoints += 1;
    playSound?.('success');
    navigator.vibrate?.(16);
    if (!trzyRundyState.remainingIds.length) {
        clearTrzyRundyTimer();
        finishTrzyRundyRound();
        return;
    }
    trzyRundyRuntime.currentWord = drawTrzyRundyWord();
    renderTrzyRundyPlay();
}

function skipTrzyRundyWord() {
    if (!trzyRundyRuntime.running || !trzyRundyRuntime.currentWord || trzyRundyState.remainingIds.length <= 1) return;
    const previous = trzyRundyRuntime.currentWord.id;
    const alternatives = trzyRundyState.remainingIds.filter(id => id !== previous);
    const id = alternatives[Math.floor(Math.random() * alternatives.length)] || previous;
    trzyRundyRuntime.currentWord = getTrzyRundyWordById(id);
    playSound?.('click');
    renderTrzyRundyPlay();
}

function finishTrzyRundyTurn() {
    if (!trzyRundyRuntime.running) return;
    clearTrzyRundyTimer();
    trzyRundyState.turnNumber += 1;
    const team = getTrzyRundyCurrentTeamPlayers();
    trzyRundyState.clueOffsets[trzyRundyState.activeTeam] = TrzyRundyRules.nextClueOffset(trzyRundyState.clueOffsets[trzyRundyState.activeTeam], team.length);
    trzyRundyState.activeTeam = TrzyRundyRules.nextTeam(trzyRundyState.activeTeam);
    persistTrzyRundySession();
    renderTrzyRundyTurnSummary();
    goToScreen('tr-turn-summary');
    playSound?.('alarm');
    navigator.vibrate?.([35, 30, 55]);
}

function renderTrzyRundyTurnSummary() {
    const points = document.getElementById('tr-summary-points');
    const scores = document.getElementById('tr-summary-scores');
    const remaining = document.getElementById('tr-summary-remaining');
    if (points) points.textContent = `+${trzyRundyRuntime.turnPoints}`;
    if (scores) scores.textContent = `A ${trzyRundyState.teamScores[0]} : ${trzyRundyState.teamScores[1]} B`;
    if (remaining) remaining.textContent = `${trzyRundyState.remainingIds.length} haseł zostało w tej rundzie`;
}

function continueTrzyRundyAfterTurn() {
    trzyRundyRuntime.currentWord = null;
    trzyRundyRuntime.turnPoints = 0;
    prepareTrzyRundyTurn();
}

function finishTrzyRundyRound() {
    clearTrzyRundyTimer();
    trzyRundyRuntime.currentWord = null;
    const completedRound = trzyRundyState.currentRound;
    trzyRundyState.currentRound += 1;
    if (TrzyRundyRules.isGameComplete(trzyRundyState.currentRound)) {
        trzyRundyState.gameFinished = true;
        persistTrzyRundySession();
        renderTrzyRundyFinal();
        goToScreen('tr-final');
        playSound?.('success');
        return;
    }
    trzyRundyState.remainingIds = trzyRundyState.pool.map(word => word.id);
    trzyRundyState.activeTeam = completedRound % 2 === 1 ? 1 : 0;
    persistTrzyRundySession();
    renderTrzyRundyRoundBreak(completedRound);
    goToScreen('tr-round-break');
}

function renderTrzyRundyRoundBreak(completedRound = trzyRundyState.currentRound - 1) {
    const next = TrzyRundyRules.getRoundMode(trzyRundyState.currentRound);
    const title = document.getElementById('tr-round-break-title');
    const scores = document.getElementById('tr-round-break-scores');
    const nextMode = document.getElementById('tr-round-break-next');
    const instruction = document.getElementById('tr-round-break-instruction');
    if (title) title.textContent = `Runda ${completedRound} zakończona`;
    if (scores) scores.textContent = `Drużyna A ${trzyRundyState.teamScores[0]} : ${trzyRundyState.teamScores[1]} Drużyna B`;
    if (nextMode) nextMode.textContent = `Runda ${trzyRundyState.currentRound}: ${next.name}`;
    if (instruction) instruction.textContent = next.instruction;
}

function startNextTrzyRundyRound() { prepareTrzyRundyTurn(); }

function renderTrzyRundyFinal() {
    const winner = TrzyRundyRules.teamWinner(trzyRundyState.teamScores);
    const title = document.getElementById('tr-final-title');
    const score = document.getElementById('tr-final-score');
    const copy = document.getElementById('tr-final-copy');
    if (title) title.textContent = winner < 0 ? 'Idealny remis!' : `Drużyna ${winner === 0 ? 'A' : 'B'} wygrywa!`;
    if (score) score.textContent = `${trzyRundyState.teamScores[0]} : ${trzyRundyState.teamScores[1]}`;
    if (copy) copy.textContent = 'Te same hasła przeszły przez opis, pantomimę i jedno słowo.';
    renderTrzyRundyTeams('tr-final-teams');
}

function renderTrzyRundyTeams(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const teams = getTrzyRundyTeams();
    container.replaceChildren();
    teams.forEach((team, index) => {
        const card = document.createElement('div');
        card.className = 'tr-team-result';
        const name = document.createElement('strong');
        name.textContent = `Drużyna ${index === 0 ? 'A' : 'B'}`;
        const members = document.createElement('span');
        members.textContent = team.map(player => player.name).join(' • ');
        const points = document.createElement('b');
        points.textContent = `${trzyRundyState.teamScores[index]} pkt`;
        card.append(name, members, points);
        container.appendChild(card);
    });
}

function restartTrzyRundyMatch() {
    resetTrzyRundyMatch();
    const pool = TrzyRundyRules.createPool(TRZY_RUNDY_CATEGORIES, trzyRundyState.activeCategories, trzyRundyState.poolSize);
    trzyRundyState.pool = pool;
    trzyRundyState.remainingIds = pool.map(word => word.id);
    persistTrzyRundySession();
    prepareTrzyRundyTurn();
}
