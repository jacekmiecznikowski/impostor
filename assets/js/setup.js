function startNewGameFlow() {
    state = { ...DEFAULT_STATE, activeCategories: [...DEFAULT_STATE.activeCategories] };
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    document.getElementById('player-slider').value = 4;
    document.getElementById('player-count-big').innerText = 4;
    updateResumeButton();
    goToScreen('setup-count');
}

function onPlayerSliderChange(val) {
    state.playerCount = Number.parseInt(val, 10);
    document.getElementById('player-count-big').innerText = state.playerCount;
    playSound('click');
}

function adjustPlayerCount(delta) {
    const newVal = Math.min(12, Math.max(3, state.playerCount + delta));
    state.playerCount = newVal;
    document.getElementById('player-slider').value = newVal;
    document.getElementById('player-count-big').innerText = newVal;
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

        const score = Number.parseInt(input?.dataset.score || '0', 10) || 0;
        nextPlayers.push({ id: i + 1, name, score });
    }

    state.players = nextPlayers;
    if (state.playerCount < 5 && state.impostorCount > 1) state.impostorCount = 1;

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
    const btn2 = document.getElementById('imp-btn-2');
    const btn3 = document.getElementById('imp-btn-3');
    const notice = document.getElementById('impostor-notice');

    if (state.playerCount < 5) {
        if (btn2) { btn2.disabled = true; btn2.className = 'impostor-btn py-2.5 rounded-xl text-xs font-bold border transition-all bg-slate-950/40 text-slate-700 border-slate-900 cursor-not-allowed'; }
        if (btn3) { btn3.disabled = true; btn3.className = 'impostor-btn py-2.5 rounded-xl text-xs font-bold border transition-all bg-slate-950/40 text-slate-700 border-slate-900 cursor-not-allowed'; }
        if (notice) notice.classList.remove('hidden');
        state.impostorCount = 1;
    } else {
        if (btn2) { btn2.disabled = false; }
        if (btn3) { btn3.disabled = false; }
        if (notice) notice.classList.add('hidden');
    }

    document.getElementById('impostor-count-label').innerText = `${state.impostorCount} ${state.impostorCount === 1 ? 'Impostor' : 'Impostorów'}`;
    document.querySelectorAll('.impostor-btn').forEach(btn => {
        const count = parseInt(btn.getAttribute('data-count'));
        if (count === state.impostorCount) {
            btn.className = 'impostor-btn py-2.5 rounded-xl text-xs font-bold border transition-all bg-teal-600 text-white border-teal-500 shadow-md';
        } else if (!btn.disabled) {
            btn.className = 'impostor-btn py-2.5 rounded-xl text-xs font-bold border transition-all bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800';
        }
    });
}

function setHintMode(mode) {
    state.hintMode = mode;
    playSound('click');
    updateHintModeUI();
    persistSession();
}

function updateHintModeUI() {
    document.querySelectorAll('.hint-mode-btn').forEach(btn => {
        const mode = btn.getAttribute('data-mode');
        if (mode === state.hintMode) {
            btn.className = 'hint-mode-btn py-2.5 rounded-xl text-xs font-bold border transition-all bg-teal-600 text-white border-teal-500 shadow-md';
        } else {
            btn.className = 'hint-mode-btn py-2.5 rounded-xl text-xs font-bold border transition-all bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800';
        }
    });
}

function setDiscussionTimer(seconds, options = {}) {
    state.discussionTime = seconds;
    if (!options.silent) playSound('click');
    document.querySelectorAll('.timer-btn').forEach(btn => {
        const time = parseInt(btn.getAttribute('data-time'));
        if (time === seconds) {
            btn.className = 'timer-btn py-2 rounded-xl text-xs font-bold border transition-all bg-teal-600 text-white border-teal-500 shadow';
        } else {
            btn.className = 'timer-btn py-2 rounded-xl text-xs font-bold border transition-all bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800';
        }
    });
    const label = seconds === 0 ? 'Wyłączony' : `${seconds / 60} min`;
    document.getElementById('timer-label').innerText = label;
    if (!options.silent) persistSession();
}

function toggleCategory(key) {
    if (state.activeCategories.includes(key)) {
        if (state.activeCategories.length <= 1) {
            showToast('Kategorie', 'Musisz wybrać co najmniej jedną kategorię.');
            return;
        }
        state.activeCategories = state.activeCategories.filter(k => k !== key);
    } else {
        state.activeCategories.push(key);
    }
    playSound('click');
    renderCategoriesGrid();
    persistSession();
}

function toggleAllCategories(select) {
    state.activeCategories = select ? Object.keys(CATEGORY_NAMES) : ['jedzenie'];
    playSound('click');
    renderCategoriesGrid();
    persistSession();
}

function filterCategories(query) {
    renderCategoriesGrid(query.toLowerCase());
}

function renderCategoriesGrid(filter = '') {
    const catGrid = document.getElementById('categories-grid');
    catGrid.innerHTML = '';
    Object.keys(CATEGORY_NAMES).forEach(key => {
        const cat = CATEGORY_NAMES[key];
        if (filter && !cat.name.toLowerCase().includes(filter) && !cat.desc.toLowerCase().includes(filter)) return;

        const active = state.activeCategories.includes(key);
        const wordCount = WORD_DATABASE[key]?.length || 0;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.onclick = () => toggleCategory(key);
        btn.setAttribute('aria-pressed', String(active));
        btn.className = `w-full text-left flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${active ? 'bg-teal-950/40 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`;
        btn.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="w-7 h-7 rounded-lg ${active ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400'} flex items-center justify-center text-xs"><i class="fa-solid ${cat.icon}"></i></div>
                <div><p class="font-bold text-white text-xs">${cat.name}</p><span class="text-[10px] text-slate-400 font-normal">${wordCount} haseł</span></div>
            </div>
            <div class="w-4 h-4 rounded-full border ${active ? 'border-teal-500 bg-teal-500 text-slate-950 flex items-center justify-center text-[10px]' : 'border-slate-700'}">${active ? '<i class="fa-solid fa-check"></i>' : ''}</div>`;
        catGrid.appendChild(btn);
    });
}
