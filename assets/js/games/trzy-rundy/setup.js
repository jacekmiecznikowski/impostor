function openTrzyRundyMenu({ silent = false } = {}) {
    cancelTrzyRundyTurn?.({ silent: true });
    updateTrzyRundyResumeButton();
    goToScreen('tr-menu', { silent });
}

function updateTrzyRundyResumeButton() {
    const button = document.getElementById('tr-resume-btn');
    if (!button) return;
    button.classList.toggle('hidden', !trzyRundyState.hasSavedSession || trzyRundyState.players.length < 4 || !trzyRundyState.pool.length);
}

function startNewTrzyRundyGame() {
    resetTrzyRundySession();
    createTrzyRundyPlayers(TRZY_RUNDY_DEFAULT_PLAYER_COUNT, []);
    renderTrzyRundyPlayerSetup();
    updateTrzyRundyResumeButton();
    goToScreen('tr-players');
}

function resumeTrzyRundyGame() {
    if (!trzyRundyState.hasSavedSession || trzyRundyState.players.length < 4 || !trzyRundyState.pool.length) {
        startNewTrzyRundyGame();
        return;
    }
    if (trzyRundyState.gameFinished || TrzyRundyRules.isGameComplete(trzyRundyState.currentRound)) {
        renderTrzyRundyFinal();
        goToScreen('tr-final');
        return;
    }
    prepareTrzyRundyTurn();
}

function setTrzyRundyPlayerCount(value) {
    const count = clampPlayerSetupCount(value, 4, 12, trzyRundyState.playerCount);
    createTrzyRundyPlayers(count, trzyRundyState.players);
    renderTrzyRundyPlayerSetup();
    playPlayerSetupCountFeedback();
}

function renderTrzyRundyPlayerSetup() {
    syncPlayerSetupCount({ sliderId: 'tr-player-count', labelId: 'tr-player-count-value', count: trzyRundyState.playerCount });
    renderPlayerSetupNames({
        containerId: 'tr-player-names', players: trzyRundyState.players, maxLength: 24, inputIdPrefix: 'tr-player-name-',
        onInput(index, value) { if (trzyRundyState.players[index]) trzyRundyState.players[index].name = value; }
    });
    renderTrzyRundyTeamPreview();
}

function renderTrzyRundyTeamPreview() {
    const containers = [document.getElementById('tr-team-a-preview'), document.getElementById('tr-team-b-preview')];
    const teams = TrzyRundyRules.assignTeams(trzyRundyState.players);
    containers.forEach((container, teamIndex) => {
        if (!container) return;
        container.textContent = teams[teamIndex].map(player => player.name || 'Gracz').join(' • ');
    });
}

function trzyRundyProceedToOptions() {
    const names = trzyRundyState.players.map(player => player.name.trim());
    if (names.some(name => !name)) return showToast('Gracze', 'Każdy gracz musi mieć imię.');
    if (new Set(names.map(name => name.toLocaleLowerCase('pl-PL'))).size !== names.length) return showToast('Gracze', 'Imiona graczy muszą być unikalne.');
    trzyRundyState.players.forEach((player, index) => { player.name = names[index]; });
    persistTrzyRundySession();
    renderTrzyRundyOptions();
    goToScreen('tr-options');
}

function setTrzyRundyPoolSize(value) {
    trzyRundyState.poolSize = TrzyRundyRules.normalizePoolSize(value);
    renderTrzyRundyOptionValues();
}
function setTrzyRundyTurnSeconds(value) {
    trzyRundyState.turnSeconds = TrzyRundyRules.normalizeTurnSeconds(value);
    renderTrzyRundyOptionValues();
}
function renderTrzyRundyOptionValues() {
    const poolInput = document.getElementById('tr-pool-size');
    const timeInput = document.getElementById('tr-turn-seconds');
    const poolValue = document.getElementById('tr-pool-size-value');
    const timeValue = document.getElementById('tr-turn-seconds-value');
    if (poolInput) poolInput.value = String(trzyRundyState.poolSize);
    if (timeInput) timeInput.value = String(trzyRundyState.turnSeconds);
    if (poolValue) poolValue.textContent = String(trzyRundyState.poolSize);
    if (timeValue) timeValue.textContent = `${trzyRundyState.turnSeconds}s`;
}

function toggleTrzyRundyCategory(categoryId) {
    const available = new Set(getTrzyRundyCategoryIds());
    if (!available.has(categoryId)) return;
    const selected = new Set(trzyRundyState.activeCategories);
    if (selected.has(categoryId)) {
        if (selected.size <= 1) return showToast('Kategorie', 'Zostaw co najmniej jedną kategorię.');
        selected.delete(categoryId);
    } else selected.add(categoryId);
    trzyRundyState.activeCategories = [...selected];
    playSound?.('click');
    renderTrzyRundyCategories();
}

function renderTrzyRundyCategories() {
    const grid = document.getElementById('tr-category-grid');
    if (!grid) return;
    normalizeTrzyRundyCategories();
    grid.replaceChildren();
    TRZY_RUNDY_CATEGORIES.forEach(category => {
        const selected = trzyRundyState.activeCategories.includes(category.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `tr-category-card${selected ? ' is-selected' : ''}`;
        button.setAttribute('aria-pressed', String(selected));
        button.onclick = () => toggleTrzyRundyCategory(category.id);
        button.innerHTML = `<span class="tr-category-icon"><i class="fa-solid ${category.icon}"></i></span><span><strong>${category.name}</strong><small>${category.words.length} haseł</small></span><i class="fa-solid ${selected ? 'fa-check' : 'fa-plus'}"></i>`;
        grid.appendChild(button);
    });
}

function renderTrzyRundyOptions() {
    normalizeTrzyRundyOptions();
    renderTrzyRundyOptionValues();
    renderTrzyRundyCategories();
}

function prepareTrzyRundyGame() {
    if (trzyRundyState.players.length < 4) return showToast('Gracze', 'Trzy Rundy wymagają co najmniej 4 graczy.');
    normalizeTrzyRundyCategories();
    normalizeTrzyRundyOptions();
    const pool = TrzyRundyRules.createPool(TRZY_RUNDY_CATEGORIES, trzyRundyState.activeCategories, trzyRundyState.poolSize);
    if (pool.length < TrzyRundyRules.POOL_MIN) return showToast('Hasła', `Wybrane kategorie mają za mało haseł. Potrzeba co najmniej ${TrzyRundyRules.POOL_MIN}.`);
    resetTrzyRundyMatch();
    trzyRundyState.pool = pool;
    trzyRundyState.poolSize = pool.length;
    trzyRundyState.remainingIds = pool.map(word => word.id);
    persistTrzyRundySession();
    prepareTrzyRundyTurn();
}
