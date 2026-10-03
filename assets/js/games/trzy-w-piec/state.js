const THREE_FIVE_SESSION_STORAGE_KEY = 'partyjniak.trzy-w-piec.session.v1';
const THREE_FIVE_DEFAULT_PLAYER_COUNT = 4;

const threeFiveState = {
    playerCount: THREE_FIVE_DEFAULT_PLAYER_COUNT,
    players: [],
    targetScore: 10,
    activeCategories: [],
    currentPlayerIndex: 0,
    turnNumber: 0,
    recentPromptIds: [],
    hasSavedSession: false
};

function createThreeFivePlayers(count, previousPlayers = threeFiveState.players) {
    const safeCount = clampPlayerSetupCount(count, 2, 12, THREE_FIVE_DEFAULT_PLAYER_COUNT);
    const resized = resizePlayerSetupRoster(previousPlayers, safeCount, index => ({
        id: `three-five-player-${index + 1}`,
        name: `Gracz ${index + 1}`,
        score: 0,
        turns: 0
    }));

    threeFiveState.playerCount = safeCount;
    threeFiveState.players = resized.map((player, index) => ({
        id: String(player?.id || `three-five-player-${index + 1}`),
        name: String(player?.name || `Gracz ${index + 1}`).slice(0, 24),
        score: Math.max(0, Number(player?.score) || 0),
        turns: Math.max(0, Number(player?.turns) || 0)
    }));
}

function getThreeFiveCategoryIds() {
    return THREE_FIVE_CATEGORIES.map(category => category.id);
}

function normalizeThreeFiveCategories() {
    const available = new Set(getThreeFiveCategoryIds());
    const selected = Array.isArray(threeFiveState.activeCategories)
        ? [...new Set(threeFiveState.activeCategories.filter(id => available.has(id)))]
        : [];
    threeFiveState.activeCategories = selected.length ? selected : [...available];
}

function persistThreeFiveSession() {
    normalizeThreeFiveCategories();
    threeFiveState.hasSavedSession = threeFiveState.players.length >= 2;
    try {
        localStorage.setItem(THREE_FIVE_SESSION_STORAGE_KEY, JSON.stringify({
            playerCount: threeFiveState.playerCount,
            players: threeFiveState.players,
            targetScore: threeFiveState.targetScore,
            activeCategories: threeFiveState.activeCategories,
            currentPlayerIndex: threeFiveState.currentPlayerIndex,
            turnNumber: threeFiveState.turnNumber,
            recentPromptIds: threeFiveState.recentPromptIds
        }));
    } catch (_) {}
    updateThreeFiveResumeButton?.();
}

function loadThreeFiveSession() {
    threeFiveState.hasSavedSession = false;
    try {
        const parsed = JSON.parse(localStorage.getItem(THREE_FIVE_SESSION_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') throw new Error('Brak sesji');
        const count = clampPlayerSetupCount(parsed.playerCount, 2, 12, THREE_FIVE_DEFAULT_PLAYER_COUNT);
        const players = Array.isArray(parsed.players) ? parsed.players.slice(0, count) : [];
        createThreeFivePlayers(count, players);
        threeFiveState.targetScore = ThreeFiveRules.normalizeTargetScore(parsed.targetScore, 10);
        threeFiveState.activeCategories = Array.isArray(parsed.activeCategories) ? parsed.activeCategories.map(String) : [];
        threeFiveState.currentPlayerIndex = Math.min(
            Math.max(0, Number.parseInt(parsed.currentPlayerIndex, 10) || 0),
            Math.max(0, threeFiveState.players.length - 1)
        );
        threeFiveState.turnNumber = Math.max(0, Number.parseInt(parsed.turnNumber, 10) || 0);
        threeFiveState.recentPromptIds = Array.isArray(parsed.recentPromptIds)
            ? parsed.recentPromptIds.map(String).slice(-ThreeFiveRules.RECENT_PROMPT_LIMIT)
            : [];
        threeFiveState.hasSavedSession = threeFiveState.players.length >= 2;
    } catch (_) {
        threeFiveState.playerCount = THREE_FIVE_DEFAULT_PLAYER_COUNT;
        threeFiveState.players = [];
        threeFiveState.targetScore = 10;
        threeFiveState.activeCategories = getThreeFiveCategoryIds();
        threeFiveState.currentPlayerIndex = 0;
        threeFiveState.turnNumber = 0;
        threeFiveState.recentPromptIds = [];
    }
    normalizeThreeFiveCategories();
}

function resetThreeFiveSession() {
    threeFiveState.playerCount = THREE_FIVE_DEFAULT_PLAYER_COUNT;
    threeFiveState.players = [];
    threeFiveState.targetScore = 10;
    threeFiveState.activeCategories = getThreeFiveCategoryIds();
    threeFiveState.currentPlayerIndex = 0;
    threeFiveState.turnNumber = 0;
    threeFiveState.recentPromptIds = [];
    threeFiveState.hasSavedSession = false;
    try { localStorage.removeItem(THREE_FIVE_SESSION_STORAGE_KEY); } catch (_) {}
}

function resetThreeFiveMatchScores() {
    threeFiveState.players.forEach(player => {
        player.score = 0;
        player.turns = 0;
    });
    threeFiveState.currentPlayerIndex = 0;
    threeFiveState.turnNumber = 0;
    threeFiveState.recentPromptIds = [];
}
