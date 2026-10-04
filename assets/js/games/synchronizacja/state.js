const SYNCHRONIZACJA_SESSION_STORAGE_KEY = 'partyjniak.synchronizacja.session.v1';
const SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT = 4;

const synchronizacjaState = {
    playerCount: SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT,
    players: [],
    activeCategories: [],
    currentPlayerIndex: 0,
    turnNumber: 0,
    completedRounds: 0,
    roundResults: {},
    recentScaleIds: [],
    awaitingRoundDecision: false,
    gameFinished: false,
    hasSavedSession: false
};

function createSynchronizacjaPlayers(count, previousPlayers = synchronizacjaState.players) {
    const safeCount = clampPlayerSetupCount(count, 2, 12, SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT);
    const resized = resizePlayerSetupRoster(previousPlayers, safeCount, index => ({
        id: `sync-player-${index + 1}`,
        name: `Gracz ${index + 1}`,
        score: 0,
        turns: 0
    }));
    synchronizacjaState.playerCount = safeCount;
    synchronizacjaState.players = resized.map((player, index) => ({
        id: String(player?.id || `sync-player-${index + 1}`),
        name: String(player?.name || `Gracz ${index + 1}`).slice(0, 24),
        score: Math.max(0, Number(player?.score) || 0),
        turns: Math.max(0, Number(player?.turns) || 0)
    }));
}

function getSynchronizacjaCategoryIds() {
    return SYNCHRONIZACJA_CATEGORIES.map(category => category.id);
}

function normalizeSynchronizacjaCategories() {
    const available = new Set(getSynchronizacjaCategoryIds());
    const selected = Array.isArray(synchronizacjaState.activeCategories)
        ? [...new Set(synchronizacjaState.activeCategories.filter(id => available.has(id)))]
        : [];
    synchronizacjaState.activeCategories = selected.length ? selected : [...available];
}

function persistSynchronizacjaSession() {
    normalizeSynchronizacjaCategories();
    synchronizacjaState.hasSavedSession = synchronizacjaState.players.length >= 2;
    try {
        localStorage.setItem(SYNCHRONIZACJA_SESSION_STORAGE_KEY, JSON.stringify({
            playerCount: synchronizacjaState.playerCount,
            players: synchronizacjaState.players,
            activeCategories: synchronizacjaState.activeCategories,
            currentPlayerIndex: synchronizacjaState.currentPlayerIndex,
            turnNumber: synchronizacjaState.turnNumber,
            completedRounds: synchronizacjaState.completedRounds,
            roundResults: synchronizacjaState.roundResults,
            recentScaleIds: synchronizacjaState.recentScaleIds,
            awaitingRoundDecision: synchronizacjaState.awaitingRoundDecision,
            gameFinished: synchronizacjaState.gameFinished
        }));
    } catch (_) {}
    updateSynchronizacjaResumeButton?.();
}

function loadSynchronizacjaSession() {
    synchronizacjaState.hasSavedSession = false;
    try {
        const parsed = JSON.parse(localStorage.getItem(SYNCHRONIZACJA_SESSION_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') throw new Error('Brak sesji');
        const count = clampPlayerSetupCount(parsed.playerCount, 2, 12, SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT);
        const players = Array.isArray(parsed.players) ? parsed.players.slice(0, count) : [];
        createSynchronizacjaPlayers(count, players);
        synchronizacjaState.activeCategories = Array.isArray(parsed.activeCategories) ? parsed.activeCategories.map(String) : [];
        synchronizacjaState.currentPlayerIndex = Math.min(
            Math.max(0, Number.parseInt(parsed.currentPlayerIndex, 10) || 0),
            Math.max(0, synchronizacjaState.players.length - 1)
        );
        synchronizacjaState.turnNumber = Math.max(0, Number.parseInt(parsed.turnNumber, 10) || 0);
        synchronizacjaState.completedRounds = Math.max(0, Number.parseInt(parsed.completedRounds, 10) || Math.floor(synchronizacjaState.turnNumber / Math.max(1, count)));
        synchronizacjaState.roundResults = parsed.roundResults && typeof parsed.roundResults === 'object' ? { ...parsed.roundResults } : {};
        synchronizacjaState.recentScaleIds = Array.isArray(parsed.recentScaleIds)
            ? parsed.recentScaleIds.map(String).slice(-SynchronizacjaRules.RECENT_SCALE_LIMIT)
            : [];
        synchronizacjaState.awaitingRoundDecision = parsed.awaitingRoundDecision === true;
        synchronizacjaState.gameFinished = parsed.gameFinished === true;
        synchronizacjaState.hasSavedSession = synchronizacjaState.players.length >= 2;
    } catch (_) {
        synchronizacjaState.playerCount = SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT;
        synchronizacjaState.players = [];
        synchronizacjaState.activeCategories = getSynchronizacjaCategoryIds();
        synchronizacjaState.currentPlayerIndex = 0;
        synchronizacjaState.turnNumber = 0;
        synchronizacjaState.completedRounds = 0;
        synchronizacjaState.roundResults = {};
        synchronizacjaState.recentScaleIds = [];
        synchronizacjaState.awaitingRoundDecision = false;
        synchronizacjaState.gameFinished = false;
    }
    normalizeSynchronizacjaCategories();
}

function resetSynchronizacjaSession() {
    synchronizacjaState.playerCount = SYNCHRONIZACJA_DEFAULT_PLAYER_COUNT;
    synchronizacjaState.players = [];
    synchronizacjaState.activeCategories = getSynchronizacjaCategoryIds();
    synchronizacjaState.currentPlayerIndex = 0;
    synchronizacjaState.turnNumber = 0;
    synchronizacjaState.completedRounds = 0;
    synchronizacjaState.roundResults = {};
    synchronizacjaState.recentScaleIds = [];
    synchronizacjaState.awaitingRoundDecision = false;
    synchronizacjaState.gameFinished = false;
    synchronizacjaState.hasSavedSession = false;
    try { localStorage.removeItem(SYNCHRONIZACJA_SESSION_STORAGE_KEY); } catch (_) {}
}

function resetSynchronizacjaMatchScores() {
    synchronizacjaState.players.forEach(player => {
        player.score = 0;
        player.turns = 0;
    });
    synchronizacjaState.currentPlayerIndex = 0;
    synchronizacjaState.turnNumber = 0;
    synchronizacjaState.completedRounds = 0;
    synchronizacjaState.roundResults = {};
    synchronizacjaState.recentScaleIds = [];
    synchronizacjaState.awaitingRoundDecision = false;
    synchronizacjaState.gameFinished = false;
}
