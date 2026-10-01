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
    bombState.manualLoserId = null;
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
    const changeBtn = document.getElementById('bomb-change-prompt-btn');
    const answerBtn = document.querySelector('#bomb-tracked-controls .bomb-answer-btn');
    const trackedControls = document.getElementById('bomb-tracked-controls');
    const manualHint = document.getElementById('bomb-manual-hint');
    const bombVisual = document.getElementById('bomb-visual');

    if (categoryEl) categoryEl.textContent = category;
    if (promptEl) promptEl.textContent = bombState.currentPrompt || '—';
    if (statusEl) statusEl.textContent = 'Dotknij bomby, kiedy wszyscy są gotowi';
    if (changeBtn) changeBtn.classList.remove('hidden');
    if (answerBtn) answerBtn.disabled = true;
    trackedControls?.classList.toggle('hidden', bombState.mode !== 'tracked');
    manualHint?.classList.toggle('hidden', bombState.mode !== 'manual');
    bombVisual?.classList.remove('is-live', 'is-hot', 'is-exploded');
    bombVisual?.style.removeProperty('--bomb-progress');
    if (bombVisual) {
        bombVisual.disabled = false;
        bombVisual.setAttribute('aria-label', 'Odpal bombę');
    }
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
    const preset = BOMB_FUSE_PRESETS[bombState.fusePreset] || BOMB_FUSE_PRESETS.unstable;
    const seconds = secureRandomBetween(preset.minSeconds, preset.maxSeconds);
    bombRuntime.durationMs = Math.round(seconds * 1000);
    bombRuntime.active = true;
    bombRuntime.passHistory = [];
    bombRuntime.lastPassAt = 0;

    const changeBtn = document.getElementById('bomb-change-prompt-btn');
    const answerBtn = document.querySelector('#bomb-tracked-controls .bomb-answer-btn');
    const statusEl = document.getElementById('bomb-play-status');
    const bombVisual = document.getElementById('bomb-visual');
    if (changeBtn) changeBtn.classList.add('hidden');
    if (answerBtn) answerBtn.disabled = false;
    if (statusEl) statusEl.textContent = bombState.mode === 'tracked' ? 'Odpowiedz i podaj dalej!' : 'Mówcie po kolei i podawajcie telefon!';
    if (bombVisual) {
        bombVisual.classList.add('is-live');
        bombVisual.disabled = true;
        bombVisual.setAttribute('aria-label', 'Bomba odpalona');
    }

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

function applyBombLoss(loserId) {
    const loser = bombState.players.find(player => player.id === loserId);
    if (!loser) return false;
    bombState.lastLoserId = loser.id;
    loser.losses += 1;
    bombState.players.forEach(player => {
        if (player.id !== loser.id) player.score += 1;
    });
    return true;
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
        if (loser) applyBombLoss(loser.id);
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
    const manualBlock = document.getElementById('bomb-manual-loser-block');
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
        if (subtitle) subtitle.textContent = 'U kogo wybuchła bomba?';
        loserCard?.classList.add('hidden');
        manualBlock?.classList.remove('hidden');
        renderBombManualLoserChoices();
        if (nextBtn) nextBtn.disabled = !bombState.manualLoserId;
    }
}

function renderBombManualLoserChoices() {
    const list = document.getElementById('bomb-manual-loser-list');
    if (!list) return;
    list.replaceChildren();
    bombState.players.forEach(player => {
        const selected = bombState.manualLoserId === player.id;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `bomb-result-player${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.onclick = () => selectBombManualLoser(player.id);
        const initial = document.createElement('span');
        initial.className = 'bomb-result-avatar';
        initial.textContent = player.name.charAt(0).toUpperCase();
        const name = document.createElement('strong');
        name.textContent = player.name;
        const marker = document.createElement('span');
        marker.className = 'bomb-result-check';
        marker.innerHTML = selected ? '<i class="fa-solid fa-bomb"></i>' : '';
        button.append(initial, name, marker);
        list.appendChild(button);
    });
}

function selectBombManualLoser(playerId) {
    if (bombState.manualLoserId === playerId) return;
    bombState.manualLoserId = playerId;
    renderBombManualLoserChoices();
    const button = document.getElementById('bomb-next-round-btn');
    if (button) button.disabled = false;
    playSound('click');
}

function commitBombManualLoser() {
    if (bombState.mode !== 'manual' || !bombState.manualLoserId) return true;
    if (!applyBombLoss(bombState.manualLoserId)) return false;
    persistBombSession();
    return true;
}

function startNextBombRound() {
    if (bombState.mode === 'manual' && !commitBombManualLoser()) {
        showToast('Przegrany', 'Wskaż osobę, u której wybuchła bomba.');
        return;
    }
    prepareBombRound();
}
