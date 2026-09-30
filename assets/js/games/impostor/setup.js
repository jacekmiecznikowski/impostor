function startNewGameFlow() {
    state = {
        ...DEFAULT_STATE,
        activeCategories: getDefaultActiveCategories()
    };
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    document.getElementById('player-slider').value = state.playerCount;
    document.getElementById('player-count-big').innerText = state.playerCount;
    updateResumeButton();
    goToScreen('setup-count');
}

function onPlayerSliderChange(value) {
    state.playerCount = Number.parseInt(value, 10);
    document.getElementById('player-count-big').innerText = state.playerCount;
    playSound('click');
}

function adjustPlayerCount(delta) {
    state.playerCount = Math.min(12, Math.max(3, state.playerCount + delta));
    document.getElementById('player-slider').value = state.playerCount;
    document.getElementById('player-count-big').innerText = state.playerCount;
    playSound('click');
}

function goToSetupNames() {
    const container = document.getElementById('name-inputs-container');
    container.replaceChildren();

    for (let i = 0; i < state.playerCount; i++) {
        const existingName = state.players[i]?.name || `Gracz ${i + 1}`;
        const existingScore = state.players[i]?.score || 0;

        const row = document.createElement('div');
        row.className = 'flex items-center space-x-2';

        const indexBadge = document.createElement('span');
        indexBadge.className = 'w-8 h-8 rounded-xl bg-teal-950/80 border border-teal-800/60 text-teal-300 flex items-center justify-center font-bold text-xs';
        indexBadge.textContent = String(i + 1);

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `player-name-${i}`;
        input.value = existingName;
        input.maxLength = 15;
        input.dataset.score = String(existingScore);
        input.className = 'flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-all shadow-inner';
        input.placeholder = 'Imię gracza...';
        input.autocomplete = 'off';
        input.enterKeyHint = i === state.playerCount - 1 ? 'done' : 'next';

        row.append(indexBadge, input);
        container.appendChild(row);
    }
    goToScreen('setup-names');
}

function goToSetupOptions() {
    const nextPlayers = [];
    const usedNames = new Set();

    for (let i = 0; i < state.playerCount; i++) {
        const input = document.getElementById(`player-name-${i}`);
        const name = input?.value.trim() || `Gracz ${i + 1}`;
        const normalizedName = name.toLocaleLowerCase('pl-PL');

        if (usedNames.has(normalizedName)) {
            showToast('Powtórzone imię', `Imię „${name}” występuje więcej niż raz. Każdy gracz powinien mieć unikalne imię.`);
            input?.focus();
            return;
        }
        usedNames.add(normalizedName);

        nextPlayers.push({
            id: i + 1,
            name,
            score: Number.parseInt(input?.dataset.score || '0', 10) || 0
        });
    }

    state.players = nextPlayers;
    if (state.playerCount < 5 && state.impostorCount > 1) state.impostorCount = 1;
    normalizeActiveCategories();
    updateHintModeUI();
    persistSession();
    goToScreen('setup-options');
}

function setImpostorCount(count) {
    if (state.playerCount < 5 && count > 1) {
        showToast('Ograniczenie', 'Przy 3 lub 4 graczach może być maksymalnie 1 impostor.');
        return;
    }
    if (count >= state.playerCount) {
        showToast('Za mało graczy', 'Liczba impostorów musi być mniejsza niż liczba graczy.');
        return;
    }
    state.impostorCount = count;
    playSound('click');
    updateImpostorButtonsUI();
    persistSession();
}

function updateImpostorButtonsUI() {
    const notice = document.getElementById('impostor-notice');
    const smallGroup = state.playerCount < 5;
    if (smallGroup) state.impostorCount = 1;

    [2, 3].forEach(count => {
        const button = document.getElementById(`imp-btn-${count}`);
        if (button) button.disabled = smallGroup;
    });
    notice?.classList.toggle('hidden', !smallGroup);

    const label = document.getElementById('impostor-count-label');
    if (label) label.innerText = `${state.impostorCount} ${state.impostorCount === 1 ? 'Impostor' : 'Impostorów'}`;

    document.querySelectorAll('.impostor-btn').forEach(button => {
        const count = Number.parseInt(button.dataset.count, 10);
        const active = count === state.impostorCount;
        button.className = button.disabled
            ? 'impostor-btn option-btn opacity-40 cursor-not-allowed'
            : `impostor-btn ${active ? 'option-active' : 'option-btn'}`;
        button.setAttribute('aria-pressed', String(active));
    });
}

function setHintMode(mode) {
    if (!['none', 'always', 'random'].includes(mode)) return;
    state.hintMode = mode;
    playSound('click');
    updateHintModeUI();
    persistSession();
}

function updateHintModeUI() {
    document.querySelectorAll('.hint-mode-btn').forEach(button => {
        const active = button.dataset.mode === state.hintMode;
        button.className = `hint-mode-btn ${active ? 'option-active' : 'option-btn'}`;
        button.setAttribute('aria-pressed', String(active));
    });
}

function setDiscussionTimer(seconds, options = {}) {
    if (![0, 60, 120, 180].includes(seconds)) return;
    state.discussionTime = seconds;
    if (!options.silent) playSound('click');

    document.querySelectorAll('.timer-btn').forEach(button => {
        const active = Number.parseInt(button.dataset.time, 10) === seconds;
        button.className = `timer-btn ${active ? 'option-active' : 'option-btn'}`;
        button.setAttribute('aria-pressed', String(active));
    });

    const label = document.getElementById('timer-label');
    if (label) label.innerText = seconds === 0 ? 'Wyłączony' : `${seconds / 60} min`;
    if (!options.silent) persistSession();
}

function toggleCategory(key) {
    if (!Object.hasOwn(CATEGORY_NAMES, key)) return;
    if (state.activeCategories.includes(key)) {
        if (state.activeCategories.length <= 1) {
            showToast('Kategorie', 'Musisz wybrać co najmniej jedną kategorię.');
            return;
        }
        state.activeCategories = state.activeCategories.filter(categoryKey => categoryKey !== key);
    } else {
        state.activeCategories.push(key);
    }
    playSound('click');
    renderCategoriesGrid();
    persistSession();
}

function toggleAllCategories(select) {
    const available = getAvailableCategoryIds();
    state.activeCategories = select ? available : available.slice(0, 1);
    playSound('click');
    renderCategoriesGrid();
    persistSession();
}

function filterCategories(query) {
    renderCategoriesGrid(String(query || '').trim().toLocaleLowerCase('pl-PL'));
}

function createCategoryButton(key, category, active, wordCount) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `w-full text-left flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${active ? 'bg-teal-950/40 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`;
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => toggleCategory(key));

    const left = document.createElement('span');
    left.className = 'flex items-center space-x-2';

    const iconBox = document.createElement('span');
    iconBox.className = `w-7 h-7 rounded-lg ${active ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'} flex items-center justify-center text-xs`;
    const icon = document.createElement('i');
    icon.className = `fa-solid ${category.icon}`;
    iconBox.appendChild(icon);

    const copy = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'block font-bold text-white text-xs';
    name.textContent = category.name;
    const count = document.createElement('span');
    count.className = 'block text-[10px] text-slate-400 font-normal';
    count.textContent = `${wordCount} haseł`;
    copy.append(name, count);
    left.append(iconBox, copy);

    const marker = document.createElement('span');
    marker.className = `w-4 h-4 rounded-full border ${active ? 'border-teal-500 bg-teal-500 text-slate-950' : 'border-slate-700'} flex items-center justify-center text-[10px]`;
    if (active) {
        const check = document.createElement('i');
        check.className = 'fa-solid fa-check';
        marker.appendChild(check);
    }

    button.append(left, marker);
    return button;
}

function renderCategoriesGrid(filter = '') {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;
    normalizeActiveCategories();
    grid.replaceChildren();

    Object.entries(CATEGORY_NAMES).forEach(([key, category]) => {
        const searchable = `${category.name} ${category.desc || ''}`.toLocaleLowerCase('pl-PL');
        if (filter && !searchable.includes(filter)) return;
        const words = WORD_DATABASE[key];
        if (!Array.isArray(words) || words.length === 0) return;
        grid.appendChild(createCategoryButton(key, category, state.activeCategories.includes(key), words.length));
    });
}
