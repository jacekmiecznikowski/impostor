function openCoMamNaMysliMenu({ silent = false } = {}) {
    updateCoMamNaMysliResumeButton();
    goToScreen('cmm-menu', { silent });
}

function updateCoMamNaMysliResumeButton() {
    const button = document.getElementById('cmm-resume-btn');
    if (!button) return;
    const visible = coMamNaMysliState.hasSavedSession && coMamNaMysliState.players.length >= 2;
    button.classList.toggle('hidden', !visible);
    button.classList.toggle('flex', visible);
}

function startNewCoMamNaMysliGame() {
    resetCoMamNaMysliSession();
    createCoMamNaMysliPlayers(coMamNaMysliState.playerCount, []);
    renderCoMamNaMysliPlayerSetup();
    goToScreen('cmm-players');
}

function resumeCoMamNaMysliGame() {
    if (!coMamNaMysliState.hasSavedSession || coMamNaMysliState.players.length < 2) {
        showToast('Co mam na myśli?', 'Nie znaleziono zapisanej ekipy.');
        return;
    }
    renderCoMamNaMysliReadyScreen();
    goToScreen('cmm-ready');
}

function renderCoMamNaMysliPlayerSetup() {
    if (!coMamNaMysliState.players.length) return;
    syncPlayerSetupCount({
        sliderId: 'cmm-player-slider',
        labelId: 'cmm-player-count',
        count: coMamNaMysliState.playerCount
    });
    renderPlayerSetupNames({
        containerId: 'cmm-name-list',
        players: coMamNaMysliState.players,
        maxLength: 28,
        inputIdPrefix: 'cmm-player-name-',
        onInput(index, value) {
            if (coMamNaMysliState.players[index]) coMamNaMysliState.players[index].name = value;
        }
    });
}

function onCoMamNaMysliPlayerCountChange(value) {
    const count = clampPlayerSetupCount(value, 2, 12, coMamNaMysliState.playerCount);
    createCoMamNaMysliPlayers(count, coMamNaMysliState.players);
    renderCoMamNaMysliPlayerSetup();
    playPlayerSetupCountFeedback();
}

function collectCoMamNaMysliPlayerNames() {
    const used = new Set();
    for (let index = 0; index < coMamNaMysliState.playerCount; index += 1) {
        const player = coMamNaMysliState.players[index];
        const input = document.getElementById(`cmm-player-name-${index}`);
        const name = String(input?.value || player?.name || `Gracz ${index + 1}`).trim().slice(0, 28) || `Gracz ${index + 1}`;
        const normalized = name.toLocaleLowerCase('pl-PL');
        if (used.has(normalized)) {
            showToast('Powtórzone imię', `Imię „${name}” występuje więcej niż raz.`);
            return false;
        }
        used.add(normalized);
        player.name = name;
    }
    return true;
}

function goToCoMamNaMysliOptions() {
    if (!collectCoMamNaMysliPlayerNames()) return;
    renderCoMamNaMysliOptions();
    goToScreen('cmm-options');
}

function selectCoMamNaMysliRoundTime(seconds) {
    const value = Number(seconds);
    if (![30, 45, 60, 90].includes(value)) return;
    coMamNaMysliState.roundTime = value;
    renderCoMamNaMysliOptions();
    playSound?.('click');
}

function toggleCoMamNaMysliCategory(categoryId) {
    const id = String(categoryId || '');
    const active = new Set(coMamNaMysliState.activeCategories);
    if (active.has(id)) {
        if (active.size <= 1) {
            showToast('Kategorie', 'Zostaw przynajmniej jedną kategorię.');
            return;
        }
        active.delete(id);
    } else {
        active.add(id);
    }
    coMamNaMysliState.activeCategories = [...active];
    renderCoMamNaMysliOptions();
    playSound?.('click');
}

function renderCoMamNaMysliOptions() {
    normalizeCoMamNaMysliActiveCategories();
    document.querySelectorAll('[data-cmm-time]').forEach(button => {
        button.classList.toggle('is-selected', Number(button.dataset.cmmTime) === coMamNaMysliState.roundTime);
    });

    const grid = document.getElementById('cmm-category-grid');
    if (!grid) return;
    grid.replaceChildren();
    const active = new Set(coMamNaMysliState.activeCategories);
    CO_MAM_NA_MYSLI_CATEGORIES.forEach(category => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `cmm-category-card${active.has(category.id) ? ' is-selected' : ''}`;
        button.addEventListener('click', () => toggleCoMamNaMysliCategory(category.id));

        const icon = document.createElement('span');
        icon.className = 'cmm-category-icon';
        icon.innerHTML = `<i class="fa-solid ${category.icon}"></i>`;
        const copy = document.createElement('span');
        copy.className = 'cmm-category-copy';
        const title = document.createElement('strong');
        title.textContent = category.name;
        const desc = document.createElement('small');
        desc.textContent = category.desc;
        copy.append(title, desc);
        const check = document.createElement('span');
        check.className = 'cmm-category-check';
        check.innerHTML = '<i class="fa-solid fa-check"></i>';
        button.append(icon, copy, check);
        grid.appendChild(button);
    });
}

function beginCoMamNaMysliSession() {
    normalizeCoMamNaMysliActiveCategories();
    if (!coMamNaMysliState.activeCategories.length) {
        showToast('Kategorie', 'Wybierz przynajmniej jedną kategorię.');
        return;
    }
    persistCoMamNaMysliSession();
    renderCoMamNaMysliReadyScreen();
    goToScreen('cmm-ready');
}
