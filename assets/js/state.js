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

function shuffleArray(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
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
        if (!raw) return false;
        const saved = JSON.parse(raw);
        if (!saved || !Array.isArray(saved.players)) return false;

        const validPlayers = saved.players
            .filter(player => player && Number.isInteger(player.id) && typeof player.name === 'string')
            .slice(0, 12)
            .map(player => ({
                id: player.id,
                name: player.name.slice(0, 15),
                score: Number.isFinite(player.score) ? player.score : 0
            }));

        state.playerCount = Math.min(12, Math.max(3, Number(saved.playerCount) || validPlayers.length || 4));
        state.players = validPlayers;
        state.impostorCount = [1, 2, 3].includes(saved.impostorCount) ? saved.impostorCount : 1;
        state.hintMode = ['none', 'always', 'random'].includes(saved.hintMode) ? saved.hintMode : 'random';
        state.discussionTime = [0, 60, 120, 180].includes(saved.discussionTime) ? saved.discussionTime : 0;
        state.activeCategories = Array.isArray(saved.activeCategories)
            ? saved.activeCategories.filter(key => Object.hasOwn(CATEGORY_NAMES, key))
            : [...DEFAULT_STATE.activeCategories];
        if (state.activeCategories.length === 0) state.activeCategories = ['jedzenie'];
        soundEnabled = saved.soundEnabled !== false;

        if (state.playerCount < 5) state.impostorCount = 1;
        if (state.impostorCount >= state.playerCount) state.impostorCount = 1;
        return validPlayers.length >= 3;
    } catch (error) {
        console.warn('Nie udało się odczytać zapisanej sesji:', error);
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
        showToast('Brak zapisu', 'Nie znaleziono poprzedniej sesji do wznowienia.');
        return;
    }

    document.getElementById('player-slider').value = state.playerCount;
    document.getElementById('player-count-big').innerText = state.playerCount;
    updateHintModeUI();
    setDiscussionTimer(state.discussionTime, { silent: true });
    goToScreen('setup-options');
}
