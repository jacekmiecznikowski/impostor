const CO_MAM_NA_MYSLI_STORAGE_KEY = 'partyjniak.co-mam-na-mysli.session.v1';
const CO_MAM_NA_MYSLI_DEFAULT_PLAYER_COUNT = 4;
const CO_MAM_NA_MYSLI_DEFAULT_ROUND_TIME = 60;

const coMamNaMysliState = {
    playerCount: CO_MAM_NA_MYSLI_DEFAULT_PLAYER_COUNT,
    players: [],
    roundTime: CO_MAM_NA_MYSLI_DEFAULT_ROUND_TIME,
    activeCategories: [],
    currentPlayerIndex: 0,
    roundNumber: 0,
    hasSavedSession: false
};

function getDefaultCoMamNaMysliCategories() {
    return CO_MAM_NA_MYSLI_CATEGORIES.map(category => category.id);
}

function createCoMamNaMysliPlayers(count, previousPlayers = coMamNaMysliState.players) {
    const safeCount = clampPlayerSetupCount(count, 2, 12, CO_MAM_NA_MYSLI_DEFAULT_PLAYER_COUNT);
    const resized = resizePlayerSetupRoster(previousPlayers, safeCount, index => ({
        id: `cmm-player-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        name: `Gracz ${index + 1}`,
        score: 0,
        turns: 0
    }));

    coMamNaMysliState.playerCount = safeCount;
    coMamNaMysliState.players = resized.map((player, index) => ({
        id: String(player?.id || `cmm-player-${Date.now()}-${index}`),
        name: String(player?.name || `Gracz ${index + 1}`).slice(0, 28),
        score: Number(player?.score) || 0,
        turns: Number(player?.turns) || 0
    }));
}

function normalizeCoMamNaMysliActiveCategories() {
    const available = new Set(CO_MAM_NA_MYSLI_CATEGORIES.map(category => category.id));
    coMamNaMysliState.activeCategories = (Array.isArray(coMamNaMysliState.activeCategories) ? coMamNaMysliState.activeCategories : [])
        .filter(id => available.has(id));
    if (!coMamNaMysliState.activeCategories.length) coMamNaMysliState.activeCategories = [...available];
}

function persistCoMamNaMysliSession() {
    coMamNaMysliState.hasSavedSession = coMamNaMysliState.players.length >= 2;
    try {
        localStorage.setItem(CO_MAM_NA_MYSLI_STORAGE_KEY, JSON.stringify({
            playerCount: coMamNaMysliState.playerCount,
            players: coMamNaMysliState.players,
            roundTime: coMamNaMysliState.roundTime,
            activeCategories: coMamNaMysliState.activeCategories,
            currentPlayerIndex: coMamNaMysliState.currentPlayerIndex,
            roundNumber: coMamNaMysliState.roundNumber
        }));
    } catch (_) {}
}

function loadCoMamNaMysliSession() {
    coMamNaMysliState.hasSavedSession = false;
    try {
        const parsed = JSON.parse(localStorage.getItem(CO_MAM_NA_MYSLI_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') throw new Error('Brak sesji');
        const count = clampPlayerSetupCount(parsed.playerCount, 2, 12, CO_MAM_NA_MYSLI_DEFAULT_PLAYER_COUNT);
        const restoredPlayers = Array.isArray(parsed.players)
            ? parsed.players.slice(0, count).map((player, index) => ({
                id: String(player?.id || `cmm-restored-${index}`),
                name: String(player?.name || `Gracz ${index + 1}`).slice(0, 28),
                score: Number(player?.score) || 0,
                turns: Number(player?.turns) || 0
            }))
            : [];
        coMamNaMysliState.playerCount = count;
        coMamNaMysliState.players = restoredPlayers;
        if (coMamNaMysliState.players.length !== count) createCoMamNaMysliPlayers(count, coMamNaMysliState.players);
        coMamNaMysliState.roundTime = [30, 45, 60, 90].includes(Number(parsed.roundTime)) ? Number(parsed.roundTime) : CO_MAM_NA_MYSLI_DEFAULT_ROUND_TIME;
        coMamNaMysliState.activeCategories = Array.isArray(parsed.activeCategories) ? parsed.activeCategories.map(String) : [];
        coMamNaMysliState.currentPlayerIndex = Math.max(0, Math.min(count - 1, Number(parsed.currentPlayerIndex) || 0));
        coMamNaMysliState.roundNumber = Math.max(0, Number(parsed.roundNumber) || 0);
        coMamNaMysliState.hasSavedSession = coMamNaMysliState.players.length >= 2;
    } catch (_) {
        coMamNaMysliState.playerCount = CO_MAM_NA_MYSLI_DEFAULT_PLAYER_COUNT;
        coMamNaMysliState.players = [];
        coMamNaMysliState.roundTime = CO_MAM_NA_MYSLI_DEFAULT_ROUND_TIME;
        coMamNaMysliState.activeCategories = [];
        coMamNaMysliState.currentPlayerIndex = 0;
        coMamNaMysliState.roundNumber = 0;
    }
    normalizeCoMamNaMysliActiveCategories();
}

function resetCoMamNaMysliSession() {
    coMamNaMysliState.playerCount = CO_MAM_NA_MYSLI_DEFAULT_PLAYER_COUNT;
    coMamNaMysliState.players = [];
    coMamNaMysliState.roundTime = CO_MAM_NA_MYSLI_DEFAULT_ROUND_TIME;
    coMamNaMysliState.activeCategories = getDefaultCoMamNaMysliCategories();
    coMamNaMysliState.currentPlayerIndex = 0;
    coMamNaMysliState.roundNumber = 0;
    coMamNaMysliState.hasSavedSession = false;
    try { localStorage.removeItem(CO_MAM_NA_MYSLI_STORAGE_KEY); } catch (_) {}
    return coMamNaMysliState;
}
