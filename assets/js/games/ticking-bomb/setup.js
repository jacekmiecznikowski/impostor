function openBombGameMenu({ silent = false } = {}) {
    cancelBombRound({ silent: true });
    updateBombResumeButton();
    goToScreen('bomb-menu', { silent });
}

function startNewBombGame() {
    stopAllBombAudio?.();
    resetBombSession();
    renderBombPlayerSetup();
    updateBombResumeButton();
    goToScreen('bomb-players');
}

function resumeBombGame() {
    if (!bombState.hasSavedSession) {
        startNewBombGame();
        return;
    }
    normalizeBombActiveCategories();
    renderBombOptions();
    goToScreen('bomb-options');
}

function updateBombResumeButton() {
    const button = document.getElementById('bomb-resume-btn');
    if (!button) return;
    const hasPlayers = Array.isArray(bombState.players) && bombState.players.length >= 2;
    button.classList.toggle('hidden', !bombState.hasSavedSession || !hasPlayers);
}

function setBombPlayerCount(value) {
    const count = clampPlayerSetupCount(value, 2, 12, bombState.playerCount);
    createBombPlayers(count, bombState.players);
    syncPlayerSetupCount({
        sliderId: 'bomb-player-count',
        labelId: 'bomb-player-count-value',
        count
    });
    renderBombNameInputs();
    playPlayerSetupCountFeedback();
}

function renderBombPlayerSetup() {
    syncPlayerSetupCount({
        sliderId: 'bomb-player-count',
        labelId: 'bomb-player-count-value',
        count: bombState.playerCount
    });
    renderBombNameInputs();
}

function renderBombNameInputs() {
    renderPlayerSetupNames({
        containerId: 'bomb-player-names',
        players: bombState.players,
        maxLength: 28,
        inputIdPrefix: 'bomb-player-name-',
        onInput(index, value) {
            if (bombState.players[index]) bombState.players[index].name = value;
        }
    });
}

function bombProceedToOptions() {
    const names = bombState.players.map(player => player.name.trim());
    if (names.some(name => !name)) {
        showToast('Gracze', 'Każdy gracz musi mieć nazwę.');
        return;
    }
    const normalized = names.map(name => name.toLocaleLowerCase('pl-PL'));
    if (new Set(normalized).size !== normalized.length) {
        showToast('Gracze', 'Imiona graczy muszą być unikalne.');
        return;
    }
    bombState.players.forEach((player, index) => { player.name = names[index]; });
    persistBombSession();
    renderBombOptions();
    updateBombResumeButton();
    goToScreen('bomb-options');
}

function selectBombMode(mode) {
    bombState.mode = mode === 'manual' ? 'manual' : 'tracked';
    renderBombModeOptions();
    if (bombState.hasSavedSession) persistBombSession();
}

function selectBombFusePreset(preset) {
    if (!TickingBombRules.FUSE_PRESETS[preset]) return;
    bombState.fusePreset = preset;
    renderBombFuseOptions();
    if (bombState.hasSavedSession) persistBombSession();
}

function toggleBombCategory(categoryId) {
    const active = new Set(bombState.activeCategories);
    if (active.has(categoryId)) {
        if (active.size <= 1) {
            showToast('Kategorie', 'Zostaw co najmniej jedną aktywną kategorię.');
            return;
        }
        active.delete(categoryId);
    } else {
        active.add(categoryId);
    }
    bombState.activeCategories = [...active];
    renderBombCategories();
    if (bombState.hasSavedSession) persistBombSession();
}

function toggleAllBombCategories() {
    const allIds = BOMB_CATEGORIES.map(category => category.id);
    const allSelected = allIds.length > 0 && allIds.every(id => bombState.activeCategories.includes(id));
    bombState.activeCategories = allSelected ? [allIds[0]] : allIds;
    renderBombCategories();
    if (bombState.hasSavedSession) persistBombSession();
}

function renderBombOptions() {
    normalizeBombActiveCategories();
    renderBombModeOptions();
    renderBombFuseOptions();
    renderBombCategories();
}

function renderBombModeOptions() {
    document.querySelectorAll('[data-bomb-mode]').forEach(button => {
        const selected = button.dataset.bombMode === bombState.mode;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
}

function renderBombFuseOptions() {
    document.querySelectorAll('[data-bomb-fuse]').forEach(button => {
        const selected = button.dataset.bombFuse === bombState.fusePreset;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
    });
}

function renderBombCategories() {
    const grid = document.getElementById('bomb-category-grid');
    if (!grid) return;
    grid.replaceChildren();
    BOMB_CATEGORIES.forEach(category => {
        const selected = bombState.activeCategories.includes(category.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `bomb-category-card${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.onclick = () => toggleBombCategory(category.id);

        const icon = document.createElement('span');
        icon.className = 'bomb-category-icon';
        const iconEl = document.createElement('i');
        iconEl.className = `fa-solid ${category.icon}`;
        icon.appendChild(iconEl);

        const copy = document.createElement('span');
        copy.className = 'bomb-category-copy';
        const name = document.createElement('strong');
        name.textContent = category.name;
        const desc = document.createElement('small');
        desc.textContent = category.desc;
        copy.append(name, desc);

        const check = document.createElement('span');
        check.className = 'bomb-category-check';
        check.innerHTML = selected ? '<i class="fa-solid fa-check"></i>' : '';
        button.append(icon, copy, check);
        grid.appendChild(button);
    });

    const allButton = document.getElementById('bomb-toggle-all-categories');
    if (allButton) {
        const allSelected = BOMB_CATEGORIES.length > 0 && BOMB_CATEGORIES.every(category => bombState.activeCategories.includes(category.id));
        allButton.textContent = allSelected ? 'Zostaw jedną' : 'Wybierz wszystkie';
    }
}

function startBombFromSetup() {
    if (bombState.players.length < 2) {
        showToast('Gracze', 'Dodaj co najmniej 2 graczy.');
        return;
    }
    if (!bombState.activeCategories.length) {
        showToast('Kategorie', 'Wybierz co najmniej jedną kategorię.');
        return;
    }
    persistBombSession();
    prepareBombRound();
}
