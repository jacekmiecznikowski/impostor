function openNaokoloMenu({ silent = false } = {}) {
    cancelNaokoloTurn?.({ silent: true });
    updateNaokoloResumeButton();
    goToScreen('naokolo-menu', { silent });
}

function updateNaokoloResumeButton() {
    const button = document.getElementById('naokolo-resume-btn');
    if (!button) return;
    button.classList.toggle('hidden', !naokoloState.hasSavedSession || naokoloState.players.length < 2);
}

function startNewNaokoloGame() {
    resetNaokoloSession();
    createNaokoloPlayers(NAOKOLO_DEFAULT_PLAYER_COUNT, []);
    renderNaokoloPlayerSetup();
    updateNaokoloResumeButton();
    goToScreen('naokolo-players');
}

function resumeNaokoloGame() {
    if (!naokoloState.hasSavedSession || naokoloState.players.length < 2) {
        startNewNaokoloGame();
        return;
    }
    renderNaokoloOptions();
    goToScreen('naokolo-options');
}

function setNaokoloPlayerCount(value) {
    const count = clampPlayerSetupCount(value, 2, 12, naokoloState.playerCount);
    createNaokoloPlayers(count, naokoloState.players);
    renderNaokoloPlayerSetup();
    playPlayerSetupCountFeedback();
}

function renderNaokoloPlayerSetup() {
    syncPlayerSetupCount({
        sliderId: 'naokolo-player-count',
        labelId: 'naokolo-player-count-value',
        count: naokoloState.playerCount
    });
    renderPlayerSetupNames({
        containerId: 'naokolo-player-names',
        players: naokoloState.players,
        maxLength: 24,
        inputIdPrefix: 'naokolo-player-name-',
        onInput(index, value) {
            if (naokoloState.players[index]) naokoloState.players[index].name = value;
        }
    });
}

function naokoloProceedToOptions() {
    const names = naokoloState.players.map(player => player.name.trim());
    if (names.some(name => !name)) {
        showToast('Gracze', 'Każdy gracz musi mieć imię.');
        return;
    }
    const normalized = names.map(name => name.toLocaleLowerCase('pl-PL'));
    if (new Set(normalized).size !== normalized.length) {
        showToast('Gracze', 'Imiona graczy muszą być unikalne.');
        return;
    }
    naokoloState.players.forEach((player, index) => { player.name = names[index]; });
    persistNaokoloSession();
    renderNaokoloOptions();
    goToScreen('naokolo-options');
}

function setNaokoloRoundTime(seconds) {
    const normalized = NaokoloRules.normalizeRoundTime(seconds, naokoloState.roundTime);
    if (normalized === naokoloState.roundTime && Number(seconds) !== normalized) return;
    naokoloState.roundTime = normalized;
    playSound?.('click');
    renderNaokoloRoundTimeOptions();
    if (naokoloState.hasSavedSession) persistNaokoloSession();
}

function renderNaokoloRoundTimeOptions() {
    document.querySelectorAll('[data-naokolo-time]').forEach(button => {
        const active = Number(button.dataset.naokoloTime) === naokoloState.roundTime;
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

function toggleNaokoloCategory(categoryId) {
    const available = new Set(getNaokoloCategoryIds());
    if (!available.has(categoryId)) return;
    const selected = new Set(naokoloState.activeCategories);
    if (selected.has(categoryId)) {
        if (selected.size <= 1) {
            showToast('Kategorie', 'Zostaw co najmniej jedną aktywną kategorię.');
            return;
        }
        selected.delete(categoryId);
    } else {
        selected.add(categoryId);
    }
    naokoloState.activeCategories = [...selected];
    playSound?.('click');
    renderNaokoloCategories();
    if (naokoloState.hasSavedSession) persistNaokoloSession();
}

function toggleAllNaokoloCategories() {
    const allIds = getNaokoloCategoryIds();
    const allSelected = allIds.length > 0 && allIds.every(id => naokoloState.activeCategories.includes(id));
    naokoloState.activeCategories = allSelected ? [allIds[0]] : allIds;
    playSound?.('click');
    renderNaokoloCategories();
    if (naokoloState.hasSavedSession) persistNaokoloSession();
}

function renderNaokoloCategories() {
    const grid = document.getElementById('naokolo-category-grid');
    if (!grid) return;
    normalizeNaokoloCategories();
    grid.replaceChildren();

    NAOKOLO_CATEGORIES.forEach(category => {
        const selected = naokoloState.activeCategories.includes(category.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `naokolo-category-card${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.addEventListener('click', () => toggleNaokoloCategory(category.id));

        const icon = document.createElement('span');
        icon.className = 'naokolo-category-icon';
        const iconEl = document.createElement('i');
        iconEl.className = `fa-solid ${category.icon}`;
        icon.appendChild(iconEl);

        const copy = document.createElement('span');
        copy.className = 'naokolo-category-copy';
        const name = document.createElement('strong');
        name.textContent = category.name;
        const desc = document.createElement('small');
        desc.textContent = `${category.cards.length} kart • ${category.desc}`;
        copy.append(name, desc);

        const check = document.createElement('span');
        check.className = 'naokolo-category-check';
        if (selected) check.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.append(icon, copy, check);
        grid.appendChild(button);
    });

    const toggle = document.getElementById('naokolo-toggle-all-categories');
    if (toggle) {
        const allIds = getNaokoloCategoryIds();
        const allSelected = allIds.length > 0 && allIds.every(id => naokoloState.activeCategories.includes(id));
        toggle.textContent = allSelected ? 'Zostaw jedną' : 'Wybierz wszystkie';
    }
}

function renderNaokoloOptions() {
    renderNaokoloRoundTimeOptions();
    renderNaokoloCategories();
}

function prepareNaokoloGame() {
    if (naokoloState.players.length < 2) {
        showToast('Gracze', 'Dodaj co najmniej 2 graczy.');
        return;
    }
    normalizeNaokoloCategories();
    if (!naokoloState.activeCategories.length) {
        showToast('Kategorie', 'Wybierz co najmniej jedną kategorię.');
        return;
    }
    persistNaokoloSession();
    renderNaokoloReadyScreen();
    goToScreen('naokolo-ready');
}
