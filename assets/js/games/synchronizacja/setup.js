function openSynchronizacjaMenu({ silent = false } = {}) {
    updateSynchronizacjaResumeButton();
    goToScreen('sync-menu', { silent });
}

function updateSynchronizacjaResumeButton() {
    const button = document.getElementById('sync-resume-btn');
    if (!button) return;
    button.classList.toggle('hidden', !synchronizacjaState.hasSavedSession || synchronizacjaState.players.length < 2);
}

function startNewSynchronizacjaGame() {
    resetSynchronizacjaSession();
    createSynchronizacjaPlayers(SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT, []);
    renderSynchronizacjaPlayerSetup();
    updateSynchronizacjaResumeButton();
    goToScreen('sync-players');
}

function resumeSynchronizacjaGame() {
    if (!synchronizacjaState.hasSavedSession || synchronizacjaState.players.length < 2) {
        startNewSynchronizacjaGame();
        return;
    }
    if (synchronizacjaState.gameFinished) {
        renderSynchronizacjaFinal();
        goToScreen('sync-final');
        return;
    }
    if (synchronizacjaState.awaitingRoundDecision) {
        renderSynchronizacjaRoundSummary();
        goToScreen('sync-round-summary');
        return;
    }
    renderSynchronizacjaOptions();
    goToScreen('sync-options');
}

function setSynchronizacjaPlayerCount(value) {
    const count = clampPlayerSetupCount(value, 2, 12, synchronizacjaState.playerCount);
    createSynchronizacjaPlayers(count, synchronizacjaState.players);
    renderSynchronizacjaPlayerSetup();
    playPlayerSetupCountFeedback();
}

function renderSynchronizacjaPlayerSetup() {
    syncPlayerSetupCount({
        sliderId: 'sync-player-count',
        labelId: 'sync-player-count-value',
        count: synchronizacjaState.playerCount
    });
    renderPlayerSetupNames({
        containerId: 'sync-player-names',
        players: synchronizacjaState.players,
        maxLength: 24,
        inputIdPrefix: 'sync-player-name-',
        onInput(index, value) {
            if (synchronizacjaState.players[index]) synchronizacjaState.players[index].name = value;
        }
    });
}

function synchronizacjaProceedToOptions() {
    const names = synchronizacjaState.players.map(player => player.name.trim());
    if (names.some(name => !name)) {
        showToast('Gracze', 'Każdy gracz musi mieć imię.');
        return;
    }
    const normalized = names.map(name => name.toLocaleLowerCase('pl-PL'));
    if (new Set(normalized).size !== normalized.length) {
        showToast('Gracze', 'Imiona graczy muszą być unikalne.');
        return;
    }
    synchronizacjaState.players.forEach((player, index) => { player.name = names[index]; });
    persistSynchronizacjaSession();
    renderSynchronizacjaOptions();
    goToScreen('sync-options');
}

function toggleSynchronizacjaCategory(categoryId) {
    const available = new Set(getSynchronizacjaCategoryIds());
    if (!available.has(categoryId)) return;
    const selected = new Set(synchronizacjaState.activeCategories);
    if (selected.has(categoryId)) {
        if (selected.size <= 1) {
            showToast('Kategorie', 'Zostaw co najmniej jedną aktywną kategorię.');
            return;
        }
        selected.delete(categoryId);
    } else {
        selected.add(categoryId);
    }
    synchronizacjaState.activeCategories = [...selected];
    playSound?.('click');
    renderSynchronizacjaCategories();
    if (synchronizacjaState.hasSavedSession) persistSynchronizacjaSession();
}

function toggleAllSynchronizacjaCategories() {
    const allIds = getSynchronizacjaCategoryIds();
    const allSelected = allIds.length > 0 && allIds.every(id => synchronizacjaState.activeCategories.includes(id));
    synchronizacjaState.activeCategories = allSelected ? [allIds[0]] : allIds;
    playSound?.('click');
    renderSynchronizacjaCategories();
    if (synchronizacjaState.hasSavedSession) persistSynchronizacjaSession();
}

function renderSynchronizacjaCategories() {
    const grid = document.getElementById('sync-category-grid');
    if (!grid) return;
    normalizeSynchronizacjaCategories();
    grid.replaceChildren();

    SYNCHRONIZACJA_CATEGORIES.forEach(category => {
        const selected = synchronizacjaState.activeCategories.includes(category.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `sync-category-card${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.addEventListener('click', () => toggleSynchronizacjaCategory(category.id));

        const icon = document.createElement('span');
        icon.className = 'sync-category-icon';
        icon.innerHTML = `<i class="fa-solid ${category.icon}" aria-hidden="true"></i>`;
        const copy = document.createElement('span');
        copy.className = 'sync-category-copy';
        const name = document.createElement('strong');
        name.textContent = category.name;
        const desc = document.createElement('small');
        desc.textContent = `${category.scales.length} skal • ${category.desc}`;
        copy.append(name, desc);
        const check = document.createElement('span');
        check.className = 'sync-category-check';
        if (selected) check.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.append(icon, copy, check);
        grid.appendChild(button);
    });

    const toggle = document.getElementById('sync-toggle-all-categories');
    if (toggle) {
        const allIds = getSynchronizacjaCategoryIds();
        const allSelected = allIds.length > 0 && allIds.every(id => synchronizacjaState.activeCategories.includes(id));
        toggle.textContent = allSelected ? 'Zostaw jedną' : 'Wybierz wszystkie';
    }
}

function renderSynchronizacjaOptions() {
    renderSynchronizacjaCategories();
}

function prepareSynchronizacjaGame() {
    if (synchronizacjaState.players.length < 2) {
        showToast('Gracze', 'Dodaj co najmniej 2 graczy.');
        return;
    }
    normalizeSynchronizacjaCategories();
    if (!synchronizacjaState.activeCategories.length) {
        showToast('Kategorie', 'Wybierz co najmniej jedną kategorię.');
        return;
    }
    synchronizacjaState.gameFinished = false;
    synchronizacjaState.awaitingRoundDecision = false;
    persistSynchronizacjaSession();
    prepareSynchronizacjaTurn();
}
