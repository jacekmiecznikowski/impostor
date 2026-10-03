function openThreeFiveMenu({ silent = false } = {}) {
    cancelThreeFiveTurn?.({ silent: true });
    updateThreeFiveResumeButton();
    goToScreen('three-five-menu', { silent });
}

function updateThreeFiveResumeButton() {
    const button = document.getElementById('three-five-resume-btn');
    if (!button) return;
    button.classList.toggle('hidden', !threeFiveState.hasSavedSession || threeFiveState.players.length < 2);
}

function startNewThreeFiveGame() {
    resetThreeFiveSession();
    createThreeFivePlayers(THREE_FIVE_DEFAULT_PLAYER_COUNT, []);
    renderThreeFivePlayerSetup();
    updateThreeFiveResumeButton();
    goToScreen('three-five-players');
}

function resumeThreeFiveGame() {
    if (!threeFiveState.hasSavedSession || threeFiveState.players.length < 2) {
        startNewThreeFiveGame();
        return;
    }
    const winner = threeFiveState.players.find(player => ThreeFiveRules.hasWinner(player.score, threeFiveState.targetScore));
    if (winner) {
        renderThreeFiveWinner(winner);
        goToScreen('three-five-winner');
        return;
    }
    renderThreeFiveOptions();
    goToScreen('three-five-options');
}

function setThreeFivePlayerCount(value) {
    const count = clampPlayerSetupCount(value, 2, 12, threeFiveState.playerCount);
    createThreeFivePlayers(count, threeFiveState.players);
    renderThreeFivePlayerSetup();
    playPlayerSetupCountFeedback();
}

function renderThreeFivePlayerSetup() {
    syncPlayerSetupCount({
        sliderId: 'three-five-player-count',
        labelId: 'three-five-player-count-value',
        count: threeFiveState.playerCount
    });
    renderPlayerSetupNames({
        containerId: 'three-five-player-names',
        players: threeFiveState.players,
        maxLength: 24,
        inputIdPrefix: 'three-five-player-name-',
        onInput(index, value) {
            if (threeFiveState.players[index]) threeFiveState.players[index].name = value;
        }
    });
}

function threeFiveProceedToOptions() {
    const names = threeFiveState.players.map(player => player.name.trim());
    if (names.some(name => !name)) {
        showToast('Gracze', 'Każdy gracz musi mieć imię.');
        return;
    }
    const normalized = names.map(name => name.toLocaleLowerCase('pl-PL'));
    if (new Set(normalized).size !== normalized.length) {
        showToast('Gracze', 'Imiona graczy muszą być unikalne.');
        return;
    }
    threeFiveState.players.forEach((player, index) => { player.name = names[index]; });
    persistThreeFiveSession();
    renderThreeFiveOptions();
    goToScreen('three-five-options');
}

function setThreeFiveTargetScore(value) {
    const normalized = ThreeFiveRules.normalizeTargetScore(value, threeFiveState.targetScore);
    if (normalized === threeFiveState.targetScore && Number(value) !== normalized) return;
    threeFiveState.targetScore = normalized;
    playSound?.('click');
    renderThreeFiveTargetOptions();
    if (threeFiveState.hasSavedSession) persistThreeFiveSession();
}

function renderThreeFiveTargetOptions() {
    document.querySelectorAll('[data-three-five-target]').forEach(button => {
        const active = Number(button.dataset.threeFiveTarget) === threeFiveState.targetScore;
        button.classList.toggle('is-selected', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

function toggleThreeFiveCategory(categoryId) {
    const available = new Set(getThreeFiveCategoryIds());
    if (!available.has(categoryId)) return;
    const selected = new Set(threeFiveState.activeCategories);
    if (selected.has(categoryId)) {
        if (selected.size <= 1) {
            showToast('Kategorie', 'Zostaw co najmniej jedną aktywną kategorię.');
            return;
        }
        selected.delete(categoryId);
    } else {
        selected.add(categoryId);
    }
    threeFiveState.activeCategories = [...selected];
    playSound?.('click');
    renderThreeFiveCategories();
    if (threeFiveState.hasSavedSession) persistThreeFiveSession();
}

function toggleAllThreeFiveCategories() {
    const allIds = getThreeFiveCategoryIds();
    const allSelected = allIds.length > 0 && allIds.every(id => threeFiveState.activeCategories.includes(id));
    threeFiveState.activeCategories = allSelected ? [allIds[0]] : allIds;
    playSound?.('click');
    renderThreeFiveCategories();
    if (threeFiveState.hasSavedSession) persistThreeFiveSession();
}

function renderThreeFiveCategories() {
    const grid = document.getElementById('three-five-category-grid');
    if (!grid) return;
    normalizeThreeFiveCategories();
    grid.replaceChildren();

    THREE_FIVE_CATEGORIES.forEach(category => {
        const selected = threeFiveState.activeCategories.includes(category.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `three-five-category-card${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.addEventListener('click', () => toggleThreeFiveCategory(category.id));

        const icon = document.createElement('span');
        icon.className = 'three-five-category-icon';
        icon.innerHTML = `<i class="fa-solid ${category.icon}" aria-hidden="true"></i>`;

        const copy = document.createElement('span');
        copy.className = 'three-five-category-copy';
        const name = document.createElement('strong');
        name.textContent = category.name;
        const desc = document.createElement('small');
        desc.textContent = `${category.prompts.length} wyzwań • ${category.desc}`;
        copy.append(name, desc);

        const check = document.createElement('span');
        check.className = 'three-five-category-check';
        if (selected) check.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.append(icon, copy, check);
        grid.appendChild(button);
    });

    const toggle = document.getElementById('three-five-toggle-all-categories');
    if (toggle) {
        const allIds = getThreeFiveCategoryIds();
        const allSelected = allIds.length > 0 && allIds.every(id => threeFiveState.activeCategories.includes(id));
        toggle.textContent = allSelected ? 'Zostaw jedną' : 'Wybierz wszystkie';
    }
}

function renderThreeFiveOptions() {
    renderThreeFiveTargetOptions();
    renderThreeFiveCategories();
}

function prepareThreeFiveGame() {
    if (threeFiveState.players.length < 2) {
        showToast('Gracze', 'Dodaj co najmniej 2 graczy.');
        return;
    }
    normalizeThreeFiveCategories();
    if (!threeFiveState.activeCategories.length) {
        showToast('Kategorie', 'Wybierz co najmniej jedną kategorię.');
        return;
    }
    persistThreeFiveSession();
    prepareThreeFiveTurn();
}
