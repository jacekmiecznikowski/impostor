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
    const count = Math.min(12, Math.max(2, Number(value) || 2));
    createBombPlayers(count, bombState.players);
    const label = document.getElementById('bomb-player-count-value');
    const slider = document.getElementById('bomb-player-count');
    if (label) label.textContent = String(count);
    if (slider) slider.value = String(count);
    renderBombNameInputs();
}

function renderBombPlayerSetup() {
    const slider = document.getElementById('bomb-player-count');
    const label = document.getElementById('bomb-player-count-value');
    if (slider) slider.value = String(bombState.playerCount);
    if (label) label.textContent = String(bombState.playerCount);
    renderBombNameInputs();
}

function renderBombNameInputs() {
    const container = document.getElementById('bomb-player-names');
    if (!container) return;
    container.replaceChildren();

    bombState.players.forEach((player, index) => {
        const label = document.createElement('label');
        label.className = 'bomb-name-row';
        const number = document.createElement('span');
        number.className = 'bomb-player-number';
        number.textContent = String(index + 1).padStart(2, '0');
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 28;
        input.autocomplete = 'off';
        input.value = player.name;
        input.setAttribute('aria-label', `Imię gracza ${index + 1}`);
        input.addEventListener('input', () => { bombState.players[index].name = input.value; });
        label.append(number, input);
        container.appendChild(label);
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
    if (!BOMB_FUSE_PRESETS[preset]) return;
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
