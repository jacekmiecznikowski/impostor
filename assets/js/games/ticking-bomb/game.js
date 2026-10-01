const bombRuntime = {
    active: false,
    exploded: false,
    timeoutId: null,
    resultTimeoutId: null,
    durationMs: 0,
    passHistory: [],
    lastPassAt: 0
};

function secureRandomBetween(min, max) {
    if (max <= min) return min;
    try {
        const values = new Uint32Array(1);
        crypto.getRandomValues(values);
        return min + (values[0] / 0x100000000) * (max - min);
    } catch (_) {
        return min + Math.random() * (max - min);
    }
}

function chooseBombPrompt() {
    normalizeBombActiveCategories();
    const available = bombState.activeCategories
        .map(getBombCategoryById)
        .filter(category => category && Array.isArray(category.words) && category.words.length > 0);
    if (!available.length) return null;
    const category = available[Math.floor(secureRandomBetween(0, available.length))];
    const entry = category.words[Math.floor(secureRandomBetween(0, category.words.length))];
    return { categoryId: category.id, categoryName: category.name, prompt: entry.word };
}

function prepareBombRound() {
    cancelBombRound({ silent: true });
    const picked = chooseBombPrompt();
    if (!picked) {
        showToast('Kategorie', 'Nie udało się znaleźć pytania. Wybierz inne kategorie.');
        return;
    }
    bombState.currentPrompt = picked.prompt;
    bombState.currentCategoryId = picked.categoryId;
    bombState.lastLoserId = null;
    bombState.manualWinnerId = null;
    bombRuntime.passHistory = [];
    bombRuntime.lastPassAt = 0;
    bombRuntime.exploded = false;

    if (bombState.mode === 'tracked') {
        bombState.currentPlayerIndex = Math.floor(secureRandomBetween(0, bombState.players.length));
    }

    renderBombPlayScreen(picked);
    goToScreen('bomb-play');
}

function renderBombPlayScreen(picked = null) {
    const category = picked?.categoryName || getBombCategoryById(bombState.currentCategoryId)?.name || 'Kategoria';
    const categoryEl = document.getElementById('bomb-play-category');
    const promptEl = document.getElementById('bomb-play-prompt');
    const statusEl = document.getElementById('bomb-play-status');
    const startBtn = document.getElementById('bomb-ignite-btn');
    const changeBtn = document.getElementById('bomb-change-prompt-btn');
    const trackedControls = document.getElementById('bomb-tracked-controls');
    const manualHint = document.getElementById('bomb-manual-hint');
    const bombVisual = document.getElementById('bomb-visual');

    if (categoryEl) categoryEl.textContent = category;
    if (promptEl) promptEl.textContent = bombState.currentPrompt || '—';
    if (statusEl) statusEl.textContent = 'Bomba jest rozbrojona';
    if (startBtn) startBtn.classList.remove('hidden');
    if (changeBtn) changeBtn.classList.remove('hidden');
    trackedControls?.classList.toggle('hidden', bombState.mode !== 'tracked');
    manualHint?.classList.toggle('hidden', bombState.mode !== 'manual');
    bombVisual?.classList.remove('is-live', 'is-hot', 'is-exploded');
    bombVisual?.style.removeProperty('--bomb-progress');
    renderBombCurrentPlayer();
    updateBombUndoButton();
}

function rerollBombPrompt() {
    if (bombRuntime.active) return;
    const picked = chooseBombPrompt();
    if (!picked) return;
    bombState.currentPrompt = picked.prompt;
    bombState.currentCategoryId = picked.categoryId;
    renderBombPlayScreen(picked);
    playSound('click');
}

async function igniteBomb() {
    if (bombRuntime.active || bombRuntime.exploded) return;
    const preset = BOMB_FUSE_PRESETS[bombState.fusePreset] || BOMB_FUSE_PRESETS.normal;
    const seconds = secureRandomBetween(preset.minSeconds, preset.maxSeconds);
    bombRuntime.durationMs = Math.round(seconds * 1000);
    bombRuntime.active = true;
    bombRuntime.passHistory = [];
    bombRuntime.lastPassAt = 0;

    const startBtn = document.getElementById('bomb-ignite-btn');
    const changeBtn = document.getElementById('bomb-change-prompt-btn');
    const statusEl = document.getElementById('bomb-play-status');
    const bombVisual = document.getElementById('bomb-visual');
    if (startBtn) startBtn.classList.add('hidden');
    if (changeBtn) changeBtn.classList.add('hidden');
    if (statusEl) statusEl.textContent = bombState.mode === 'tracked' ? 'Odpowiedz i podaj dalej!' : 'Mówcie po kolei i podawajcie telefon!';
    bombVisual?.classList.add('is-live');

    primeBombAudio();
    await startBombTicking();
    if (!bombRuntime.active) return;

    // Czas rundy pozostaje całkowicie ukryty: bez paska postępu,
    // przyspieszania tykania ani wizualnego sygnału, że wybuch jest blisko.
    bombRuntime.timeoutId = setTimeout(explodeBomb, bombRuntime.durationMs);
}

function bombPass() {
    if (!bombRuntime.active || bombState.mode !== 'tracked' || bombState.players.length < 2) return;
    const now = performance.now();
    if (now - bombRuntime.lastPassAt < 250) return;
    bombRuntime.lastPassAt = now;
    bombRuntime.passHistory.push(bombState.currentPlayerIndex);
    bombState.currentPlayerIndex = (bombState.currentPlayerIndex + 1) % bombState.players.length;
    renderBombCurrentPlayer();
    updateBombUndoButton();
    playSound('click');
}

function bombUndoPass() {
    if (!bombRuntime.active || bombState.mode !== 'tracked' || bombRuntime.passHistory.length === 0) return;
    bombState.currentPlayerIndex = bombRuntime.passHistory.pop();
    bombRuntime.lastPassAt = 0;
    renderBombCurrentPlayer();
    updateBombUndoButton();
    playSound('click');
}

function renderBombCurrentPlayer() {
    const player = bombState.players[bombState.currentPlayerIndex];
    const name = document.getElementById('bomb-current-player');
    if (name) name.textContent = player?.name || '—';
}

function updateBombUndoButton() {
    const button = document.getElementById('bomb-undo-btn');
    if (button) button.disabled = !bombRuntime.active || bombRuntime.passHistory.length === 0;
}

function cancelBombRound({ silent = false } = {}) {
    if (bombRuntime.timeoutId) clearTimeout(bombRuntime.timeoutId);
    if (bombRuntime.resultTimeoutId) clearTimeout(bombRuntime.resultTimeoutId);
    bombRuntime.timeoutId = null;
    bombRuntime.resultTimeoutId = null;
    bombRuntime.active = false;
    bombRuntime.lastPassAt = 0;
    stopBombTicking?.();
    if (!silent) playSound('click');
}

function explodeBomb() {
    if (!bombRuntime.active) return;
    if (bombRuntime.timeoutId) clearTimeout(bombRuntime.timeoutId);
    bombRuntime.timeoutId = null;
    bombRuntime.active = false;
    bombRuntime.exploded = true;
    stopBombTicking();
    playBombExplosion();

    const visual = document.getElementById('bomb-visual');
    visual?.classList.add('is-exploded');

    if (bombState.mode === 'tracked') {
        const loser = bombState.players[bombState.currentPlayerIndex];
        if (loser) {
            bombState.lastLoserId = loser.id;
            loser.losses += 1;
            bombState.players.forEach(player => {
                if (player.id !== loser.id) player.score += 1;
            });
        }
    }
    bombState.roundNumber += 1;
    persistBombSession();
    bombRuntime.resultTimeoutId = setTimeout(showBombResult, 420);
}

function showBombResult() {
    bombRuntime.resultTimeoutId = null;
    renderBombResultScreen();
    goToScreen('bomb-result');
}

function renderBombResultScreen() {
    const title = document.getElementById('bomb-result-title');
    const subtitle = document.getElementById('bomb-result-subtitle');
    const loserCard = document.getElementById('bomb-loser-card');
    const manualBlock = document.getElementById('bomb-manual-winner-block');
    const nextBtn = document.getElementById('bomb-next-round-btn');

    if (bombState.mode === 'tracked') {
        const loser = bombState.players.find(player => player.id === bombState.lastLoserId);
        if (title) title.textContent = 'BOOM!';
        if (subtitle) subtitle.textContent = 'Bomba wybuchła w tej turze:';
        if (loserCard) {
            loserCard.classList.remove('hidden');
            const name = loserCard.querySelector('[data-bomb-loser-name]');
            if (name) name.textContent = loser?.name || 'Nieznany gracz';
        }
        manualBlock?.classList.add('hidden');
        if (nextBtn) nextBtn.disabled = false;
    } else {
        if (title) title.textContent = 'BOOM!';
        if (subtitle) subtitle.textContent = 'Grupa rozstrzyga rundę.';
        loserCard?.classList.add('hidden');
        manualBlock?.classList.remove('hidden');
        renderBombManualWinnerChoices();
        if (nextBtn) nextBtn.disabled = !bombState.manualWinnerId;
    }
}

function renderBombManualWinnerChoices() {
    const list = document.getElementById('bomb-manual-winner-list');
    if (!list) return;
    list.replaceChildren();
    bombState.players.forEach(player => {
        const selected = bombState.manualWinnerId === player.id;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `bomb-result-player${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.onclick = () => selectBombManualWinner(player.id);
        const initial = document.createElement('span');
        initial.className = 'bomb-result-avatar';
        initial.textContent = player.name.charAt(0).toUpperCase();
        const name = document.createElement('strong');
        name.textContent = player.name;
        const marker = document.createElement('span');
        marker.className = 'bomb-result-check';
        marker.innerHTML = selected ? '<i class="fa-solid fa-check"></i>' : '';
        button.append(initial, name, marker);
        list.appendChild(button);
    });
}

function selectBombManualWinner(playerId) {
    if (bombState.manualWinnerId === playerId) return;
    bombState.manualWinnerId = playerId;
    renderBombManualWinnerChoices();
    const button = document.getElementById('bomb-next-round-btn');
    if (button) button.disabled = false;
    playSound('click');
}

function commitBombManualWinner() {
    if (bombState.mode !== 'manual' || !bombState.manualWinnerId) return true;
    const winner = bombState.players.find(player => player.id === bombState.manualWinnerId);
    if (!winner) return false;
    winner.score += 1;
    persistBombSession();
    return true;
}

function startNextBombRound() {
    if (bombState.mode === 'manual' && !commitBombManualWinner()) {
        showToast('Zwycięzca', 'Wybierz zwycięzcę rundy.');
        return;
    }
    prepareBombRound();
}
