const naokoloRuntime = {
    active: false,
    deck: [],
    cardIndex: 0,
    timerId: null,
    endsAt: 0,
    guessed: 0,
    skipped: 0,
    forbidden: 0,
    finishing: false
};

function getNaokoloCurrentPlayer() {
    return naokoloState.players[naokoloState.currentPlayerIndex] || null;
}

function renderNaokoloReadyScreen() {
    const player = getNaokoloCurrentPlayer();
    const name = document.getElementById('naokolo-ready-player');
    const time = document.getElementById('naokolo-ready-time');
    const round = document.getElementById('naokolo-ready-round');
    if (name) name.textContent = player?.name || 'Gracz';
    if (time) time.textContent = `${naokoloState.roundTime} s`;
    if (round) round.textContent = `Tura ${naokoloState.roundNumber + 1}`;
}

function resetNaokoloRuntime() {
    if (naokoloRuntime.timerId) clearInterval(naokoloRuntime.timerId);
    naokoloRuntime.active = false;
    naokoloRuntime.deck = [];
    naokoloRuntime.cardIndex = 0;
    naokoloRuntime.timerId = null;
    naokoloRuntime.endsAt = 0;
    naokoloRuntime.guessed = 0;
    naokoloRuntime.skipped = 0;
    naokoloRuntime.forbidden = 0;
    naokoloRuntime.finishing = false;
}

function cancelNaokoloTurn({ silent = false } = {}) {
    const wasActive = naokoloRuntime.active;
    resetNaokoloRuntime();
    setGameAwakeMode?.(false);
    if (wasActive && !silent) showToast('Naokoło', 'Tura została przerwana.');
}

function startNaokoloTurn() {
    if (naokoloRuntime.active) return;
    const player = getNaokoloCurrentPlayer();
    if (!player) {
        showToast('Naokoło', 'Brak aktywnego gracza.');
        return;
    }

    const deck = NaokoloRules.buildDeck(NAOKOLO_CATEGORIES, naokoloState.activeCategories);
    if (!deck.length) {
        showToast('Naokoło', 'Brak kart w wybranych kategoriach.');
        return;
    }

    resetNaokoloRuntime();
    naokoloRuntime.active = true;
    naokoloRuntime.deck = deck;
    naokoloRuntime.endsAt = Date.now() + naokoloState.roundTime * 1000;
    setGameAwakeMode?.(true);
    renderNaokoloTurnHeader();
    renderNaokoloCard();
    updateNaokoloTimer();
    naokoloRuntime.timerId = setInterval(updateNaokoloTimer, 200);
    goToScreen('naokolo-play');
}

function renderNaokoloTurnHeader() {
    const player = getNaokoloCurrentPlayer();
    const name = document.getElementById('naokolo-current-player');
    if (name) name.textContent = player?.name || 'Gracz';
}

function getNaokoloCurrentCard() {
    if (!naokoloRuntime.deck.length) return null;
    return naokoloRuntime.deck[naokoloRuntime.cardIndex % naokoloRuntime.deck.length] || null;
}

function renderNaokoloCard() {
    const card = getNaokoloCurrentCard();
    if (!card) return;
    const category = document.getElementById('naokolo-card-category');
    const word = document.getElementById('naokolo-card-word');
    const forbidden = document.getElementById('naokolo-forbidden-list');
    if (category) category.textContent = card.categoryName;
    if (word) word.textContent = card.word;
    if (forbidden) {
        forbidden.replaceChildren();
        card.forbidden.forEach(term => {
            const item = document.createElement('li');
            item.textContent = term;
            forbidden.appendChild(item);
        });
    }
    renderNaokoloLiveStats();
}

function renderNaokoloLiveStats() {
    const guessed = document.getElementById('naokolo-live-guessed');
    const skipped = document.getElementById('naokolo-live-skipped');
    const forbidden = document.getElementById('naokolo-live-forbidden');
    if (guessed) guessed.textContent = String(naokoloRuntime.guessed);
    if (skipped) skipped.textContent = String(naokoloRuntime.skipped);
    if (forbidden) forbidden.textContent = String(naokoloRuntime.forbidden);
}

function advanceNaokoloCard() {
    if (!naokoloRuntime.deck.length) return;
    naokoloRuntime.cardIndex += 1;
    if (naokoloRuntime.cardIndex >= naokoloRuntime.deck.length) {
        naokoloRuntime.deck = NaokoloRules.shuffle(naokoloRuntime.deck);
        naokoloRuntime.cardIndex = 0;
    }
    renderNaokoloCard();
}

function markNaokoloCard(action) {
    if (!naokoloRuntime.active || naokoloRuntime.finishing) return;
    if (action === 'guessed') {
        naokoloRuntime.guessed += 1;
        playSound?.('click');
    } else if (action === 'forbidden') {
        naokoloRuntime.forbidden += 1;
        playSound?.('failure');
    } else if (action === 'skipped') {
        naokoloRuntime.skipped += 1;
        playSound?.('click');
    } else {
        return;
    }
    advanceNaokoloCard();
}

function updateNaokoloTimer() {
    if (!naokoloRuntime.active) return;
    const remainingMs = Math.max(0, naokoloRuntime.endsAt - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const value = document.getElementById('naokolo-timer-value');
    const ring = document.getElementById('naokolo-timer-ring');
    if (value) value.textContent = String(remainingSeconds);
    if (ring) {
        const total = Math.max(1, naokoloState.roundTime * 1000);
        const progress = Math.min(1, Math.max(0, remainingMs / total));
        ring.style.setProperty('--naokolo-time-progress', String(progress));
        ring.classList.toggle('is-low', remainingSeconds <= 10);
    }
    if (remainingMs <= 0) finishNaokoloTurn();
}

function finishNaokoloTurn() {
    if (!naokoloRuntime.active || naokoloRuntime.finishing) return;
    naokoloRuntime.finishing = true;
    if (naokoloRuntime.timerId) clearInterval(naokoloRuntime.timerId);
    naokoloRuntime.timerId = null;
    naokoloRuntime.active = false;
    setGameAwakeMode?.(false);

    const summary = NaokoloRules.scoreTurn({
        guessed: naokoloRuntime.guessed,
        skipped: naokoloRuntime.skipped,
        forbidden: naokoloRuntime.forbidden
    });
    const player = getNaokoloCurrentPlayer();
    if (player) {
        player.score = (Number(player.score) || 0) + summary.score;
        player.turns = (Number(player.turns) || 0) + 1;
    }
    naokoloState.roundNumber += 1;
    persistNaokoloSession();
    renderNaokoloResult(summary, player);
    playSound?.('success');
    goToScreen('naokolo-result');
    naokoloRuntime.finishing = false;
}

function renderNaokoloResult(summary, player) {
    const playerName = document.getElementById('naokolo-result-player');
    const score = document.getElementById('naokolo-result-score');
    const guessed = document.getElementById('naokolo-result-guessed');
    const skipped = document.getElementById('naokolo-result-skipped');
    const forbidden = document.getElementById('naokolo-result-forbidden');
    if (playerName) playerName.textContent = player?.name || 'Gracz';
    if (score) score.textContent = `${summary.score >= 0 ? '+' : ''}${summary.score} pkt`;
    if (guessed) guessed.textContent = String(summary.guessed);
    if (skipped) skipped.textContent = String(summary.skipped);
    if (forbidden) forbidden.textContent = String(summary.forbidden);
}

function startNextNaokoloTurn() {
    const next = NaokoloRules.nextPlayerIndex(naokoloState.currentPlayerIndex, naokoloState.players.length);
    if (next < 0) return;
    naokoloState.currentPlayerIndex = next;
    persistNaokoloSession();
    resetNaokoloRuntime();
    renderNaokoloReadyScreen();
    goToScreen('naokolo-ready');
}
