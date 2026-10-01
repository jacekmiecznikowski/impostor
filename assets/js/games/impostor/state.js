const STORAGE_KEY = 'impostor.session.v2';

const DEFAULT_STATE = {
    playerCount: 4,
    players: [],
    impostorCount: 1,
    hintMode: 'random',
    discussionTime: 0,
    activeCategories: ['jedzenie', 'zwierzeta', 'miejsca', 'przedmioty', 'zawody', 'popkultura'],
    currentTurnPlayerIndex: 0,
    secretWord: '',
    secretHint: '',
    impostorIds: [],
    playerRoles: {},
    startingPlayerName: '',
    selectedVotedPlayerId: null
};

let state = { ...DEFAULT_STATE, activeCategories: [...DEFAULT_STATE.activeCategories] };
let soundEnabled = true;
let timerInterval = null;
let revealUnlockTimer = null;

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getAvailableCategoryIds() {
    return Object.keys(CATEGORY_NAMES).filter(key => Array.isArray(WORD_DATABASE[key]) && WORD_DATABASE[key].length > 0);
}

function getDefaultActiveCategories() {
    const available = getAvailableCategoryIds();
    const preferred = DEFAULT_STATE.activeCategories.filter(key => available.includes(key));
    return (preferred.length ? preferred : available).slice(0, 6);
}

function normalizeActiveCategories() {
    const available = new Set(getAvailableCategoryIds());
    const normalized = Array.isArray(state.activeCategories)
        ? [...new Set(state.activeCategories.filter(key => available.has(key)))]
        : [];
    state.activeCategories = normalized.length ? normalized : getDefaultActiveCategories();
    return state.activeCategories;
}

function getPersistableSession() {
    return {
        playerCount: state.playerCount,
        players: state.players.map(({ id, name, score }) => ({ id, name, score })),
        impostorCount: state.impostorCount,
        hintMode: state.hintMode,
        discussionTime: state.discussionTime,
        activeCategories: [...state.activeCategories],
        soundEnabled
    };
}

function persistSession() {
    normalizeActiveCategories();
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistableSession()));
    } catch (error) {
        console.warn('Nie udało się zapisać sesji:', error);
    }
    updateResumeButton();
}

function loadSession() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            normalizeActiveCategories();
            return false;
        }
        const saved = JSON.parse(raw);
        if (!saved || !Array.isArray(saved.players)) {
            normalizeActiveCategories();
            return false;
        }

        const validPlayers = saved.players
            .filter(player => player && Number.isInteger(player.id) && typeof player.name === 'string')
            .slice(0, 12)
            .map(player => ({
                id: player.id,
                name: player.name.trim().slice(0, 15) || `Gracz ${player.id}`,
                score: Number.isFinite(player.score) ? player.score : 0
            }));

        state.playerCount = Math.min(12, Math.max(3, Number(saved.playerCount) || validPlayers.length || 4));
        state.players = validPlayers;
        state.impostorCount = [1, 2, 3].includes(saved.impostorCount) ? saved.impostorCount : 1;
        state.hintMode = ['none', 'always', 'random'].includes(saved.hintMode) ? saved.hintMode : 'random';
        state.discussionTime = [0, 60, 120, 180].includes(saved.discussionTime) ? saved.discussionTime : 0;
        state.activeCategories = Array.isArray(saved.activeCategories) ? saved.activeCategories : getDefaultActiveCategories();
        soundEnabled = saved.soundEnabled !== false;

        normalizeActiveCategories();
        if (state.playerCount < 5) state.impostorCount = 1;
        if (state.impostorCount >= state.playerCount) state.impostorCount = 1;
        return validPlayers.length >= 3;
    } catch (error) {
        console.warn('Nie udało się odczytać zapisanej sesji:', error);
        normalizeActiveCategories();
        return false;
    }
}

function hasSavedSession() {
    return state.players.length >= 3;
}

function updateResumeButton() {
    const button = document.getElementById('resume-session-btn');
    if (!button) return;
    const visible = hasSavedSession();
    button.classList.toggle('hidden', !visible);
    button.classList.toggle('flex', visible);
}

function resumeSavedSession() {
    if (!hasSavedSession()) {
        showToast('Poprzednia ekipa', 'Nie znaleziono zapisanej poprzedniej ekipy. Rozpocznij nową grę.');
        return;
    }

    normalizeActiveCategories();
    document.getElementById('player-slider').value = state.playerCount;
    document.getElementById('player-count-big').innerText = state.playerCount;
    updateHintModeUI();
    setDiscussionTimer(state.discussionTime, { silent: true });
    goToScreen('setup-options');
}
