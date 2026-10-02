const NAOKOLO_SESSION_STORAGE_KEY = 'partyjniak.naokolo.session.v1';
const NAOKOLO_DEFAULT_PLAYER_COUNT = 4;

const naokoloState = {
    playerCount: NAOKOLO_DEFAULT_PLAYER_COUNT,
    players: [],
    roundTime: 60,
    activeCategories: [],
    currentPlayerIndex: 0,
    roundNumber: 0,
    hasSavedSession: false
};

function createNaokoloPlayers(count, previousPlayers = naokoloState.players) {
    const safeCount = clampPlayerSetupCount(count, 2, 12, NAOKOLO_DEFAULT_PLAYER_COUNT);
    const resized = resizePlayerSetupRoster(previousPlayers, safeCount, index => ({
        id: `naokolo-player-${index + 1}`,
        name: `Gracz ${index + 1}`,
        score: 0,
        turns: 0
    }));

    naokoloState.playerCount = safeCount;
    naokoloState.players = resized.map((player, index) => ({
        id: String(player?.id || `naokolo-player-${index + 1}`),
        name: String(player?.name || `Gracz ${index + 1}`).slice(0, 24),
        score: Number(player?.score) || 0,
        turns: Number(player?.turns) || 0
    }));
}

function getNaokoloCategoryIds() {
    return NAOKOLO_CATEGORIES.map(category => category.id);
}

function normalizeNaokoloCategories() {
    const available = new Set(getNaokoloCategoryIds());
    const selected = Array.isArray(naokoloState.activeCategories)
        ? [...new Set(naokoloState.activeCategories.filter(id => available.has(id)))]
        : [];
    naokoloState.activeCategories = selected.length ? selected : [...available];
}

function persistNaokoloSession() {
    normalizeNaokoloCategories();
    naokoloState.hasSavedSession = naokoloState.players.length >= 2;
    try {
        localStorage.setItem(NAOKOLO_SESSION_STORAGE_KEY, JSON.stringify({
            playerCount: naokoloState.playerCount,
            players: naokoloState.players,
            roundTime: naokoloState.roundTime,
            activeCategories: naokoloState.activeCategories,
            currentPlayerIndex: naokoloState.currentPlayerIndex,
            roundNumber: naokoloState.roundNumber
        }));
    } catch (_) {}
    updateNaokoloResumeButton?.();
}

function loadNaokoloSession() {
    naokoloState.hasSavedSession = false;
    try {
        const parsed = JSON.parse(localStorage.getItem(NAOKOLO_SESSION_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') throw new Error('Brak sesji');
        const count = clampPlayerSetupCount(parsed.playerCount, 2, 12, NAOKOLO_DEFAULT_PLAYER_COUNT);
        const players = Array.isArray(parsed.players) ? parsed.players.slice(0, count) : [];
        createNaokoloPlayers(count, players);
        naokoloState.roundTime = NaokoloRules.normalizeRoundTime(parsed.roundTime, 60);
        naokoloState.activeCategories = Array.isArray(parsed.activeCategories) ? parsed.activeCategories.map(String) : [];
        naokoloState.currentPlayerIndex = Math.min(
            Math.max(0, Number.parseInt(parsed.currentPlayerIndex, 10) || 0),
            Math.max(0, naokoloState.players.length - 1)
        );
        naokoloState.roundNumber = Math.max(0, Number.parseInt(parsed.roundNumber, 10) || 0);
        naokoloState.hasSavedSession = naokoloState.players.length >= 2;
    } catch (_) {
        naokoloState.playerCount = NAOKOLO_DEFAULT_PLAYER_COUNT;
        naokoloState.players = [];
        naokoloState.roundTime = 60;
        naokoloState.activeCategories = getNaokoloCategoryIds();
        naokoloState.currentPlayerIndex = 0;
        naokoloState.roundNumber = 0;
    }
    normalizeNaokoloCategories();
}

function resetNaokoloSession() {
    naokoloState.playerCount = NAOKOLO_DEFAULT_PLAYER_COUNT;
    naokoloState.players = [];
    naokoloState.roundTime = 60;
    naokoloState.activeCategories = getNaokoloCategoryIds();
    naokoloState.currentPlayerIndex = 0;
    naokoloState.roundNumber = 0;
    naokoloState.hasSavedSession = false;
    try { localStorage.removeItem(NAOKOLO_SESSION_STORAGE_KEY); } catch (_) {}
}
