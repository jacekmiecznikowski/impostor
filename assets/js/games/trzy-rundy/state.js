const TRZY_RUNDY_SESSION_KEY = 'partyjniak.trzy-rundy.session.v1';
const TRZY_RUNDY_DEFAULT_PLAYER_COUNT = 6;

const trzyRundyState = {
    playerCount: TRZY_RUNDY_DEFAULT_PLAYER_COUNT,
    players: [],
    activeCategories: [],
    poolSize: TrzyRundyRules.DEFAULT_POOL_SIZE,
    turnSeconds: TrzyRundyRules.DEFAULT_TURN_SECONDS,
    pool: [],
    remainingIds: [],
    currentRound: 1,
    activeTeam: 0,
    clueOffsets: [0, 0],
    teamScores: [0, 0],
    turnNumber: 0,
    gameFinished: false,
    hasSavedSession: false
};

function createTrzyRundyPlayers(count, previousPlayers = trzyRundyState.players) {
    const safeCount = clampPlayerSetupCount(count, 4, 12, TRZY_RUNDY_DEFAULT_PLAYER_COUNT);
    const resized = resizePlayerSetupRoster(previousPlayers, safeCount, index => ({ id: `tr-player-${index + 1}`, name: `Gracz ${index + 1}` }));
    trzyRundyState.playerCount = safeCount;
    trzyRundyState.players = resized.map((player, index) => ({ id: String(player?.id || `tr-player-${index + 1}`), name: String(player?.name || `Gracz ${index + 1}`).slice(0, 24) }));
}

function getTrzyRundyCategoryIds() { return TRZY_RUNDY_CATEGORIES.map(category => category.id); }
function normalizeTrzyRundyCategories() {
    const available = new Set(getTrzyRundyCategoryIds());
    const selected = Array.isArray(trzyRundyState.activeCategories) ? [...new Set(trzyRundyState.activeCategories.filter(id => available.has(id)))] : [];
    trzyRundyState.activeCategories = selected.length ? selected : [...available];
}
function normalizeTrzyRundyOptions() {
    trzyRundyState.poolSize = TrzyRundyRules.normalizePoolSize(trzyRundyState.poolSize);
    trzyRundyState.turnSeconds = TrzyRundyRules.normalizeTurnSeconds(trzyRundyState.turnSeconds);
}

function persistTrzyRundySession() {
    normalizeTrzyRundyCategories();
    normalizeTrzyRundyOptions();
    trzyRundyState.hasSavedSession = trzyRundyState.players.length >= 4;
    try {
        localStorage.setItem(TRZY_RUNDY_SESSION_KEY, JSON.stringify({
            playerCount: trzyRundyState.playerCount,
            players: trzyRundyState.players,
            activeCategories: trzyRundyState.activeCategories,
            poolSize: trzyRundyState.poolSize,
            turnSeconds: trzyRundyState.turnSeconds,
            pool: trzyRundyState.pool,
            remainingIds: trzyRundyState.remainingIds,
            currentRound: trzyRundyState.currentRound,
            activeTeam: trzyRundyState.activeTeam,
            clueOffsets: trzyRundyState.clueOffsets,
            teamScores: trzyRundyState.teamScores,
            turnNumber: trzyRundyState.turnNumber,
            gameFinished: trzyRundyState.gameFinished
        }));
    } catch (_) {}
    updateTrzyRundyResumeButton?.();
}

function loadTrzyRundySession() {
    trzyRundyState.hasSavedSession = false;
    try {
        const parsed = JSON.parse(localStorage.getItem(TRZY_RUNDY_SESSION_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') throw new Error('Brak sesji');
        const count = clampPlayerSetupCount(parsed.playerCount, 4, 12, TRZY_RUNDY_DEFAULT_PLAYER_COUNT);
        createTrzyRundyPlayers(count, Array.isArray(parsed.players) ? parsed.players : []);
        trzyRundyState.activeCategories = Array.isArray(parsed.activeCategories) ? parsed.activeCategories.map(String) : [];
        trzyRundyState.poolSize = TrzyRundyRules.normalizePoolSize(parsed.poolSize);
        trzyRundyState.turnSeconds = TrzyRundyRules.normalizeTurnSeconds(parsed.turnSeconds);
        trzyRundyState.pool = Array.isArray(parsed.pool) ? parsed.pool.filter(item => item?.id && item?.text).map(item => ({ id: String(item.id), text: String(item.text), categoryName: String(item.categoryName || '') })) : [];
        trzyRundyState.remainingIds = Array.isArray(parsed.remainingIds) ? parsed.remainingIds.map(String).filter(id => trzyRundyState.pool.some(item => item.id === id)) : [];
        trzyRundyState.currentRound = Math.min(4, Math.max(1, Number.parseInt(parsed.currentRound, 10) || 1));
        trzyRundyState.activeTeam = Number(parsed.activeTeam) === 1 ? 1 : 0;
        trzyRundyState.clueOffsets = [0, 1].map(index => Math.max(0, Number.parseInt(parsed.clueOffsets?.[index], 10) || 0));
        trzyRundyState.teamScores = [0, 1].map(index => Math.max(0, Number(parsed.teamScores?.[index]) || 0));
        trzyRundyState.turnNumber = Math.max(0, Number.parseInt(parsed.turnNumber, 10) || 0);
        trzyRundyState.gameFinished = parsed.gameFinished === true;
        trzyRundyState.hasSavedSession = trzyRundyState.players.length >= 4;
    } catch (_) {
        trzyRundyState.playerCount = TRZY_RUNDY_DEFAULT_PLAYER_COUNT;
        trzyRundyState.players = [];
        trzyRundyState.activeCategories = getTrzyRundyCategoryIds();
        trzyRundyState.poolSize = TrzyRundyRules.DEFAULT_POOL_SIZE;
        trzyRundyState.turnSeconds = TrzyRundyRules.DEFAULT_TURN_SECONDS;
        trzyRundyState.pool = [];
        trzyRundyState.remainingIds = [];
        trzyRundyState.currentRound = 1;
        trzyRundyState.activeTeam = 0;
        trzyRundyState.clueOffsets = [0, 0];
        trzyRundyState.teamScores = [0, 0];
        trzyRundyState.turnNumber = 0;
        trzyRundyState.gameFinished = false;
    }
    normalizeTrzyRundyCategories();
    normalizeTrzyRundyOptions();
}

function resetTrzyRundySession() {
    trzyRundyState.playerCount = TRZY_RUNDY_DEFAULT_PLAYER_COUNT;
    trzyRundyState.players = [];
    trzyRundyState.activeCategories = getTrzyRundyCategoryIds();
    trzyRundyState.poolSize = TrzyRundyRules.DEFAULT_POOL_SIZE;
    trzyRundyState.turnSeconds = TrzyRundyRules.DEFAULT_TURN_SECONDS;
    trzyRundyState.pool = [];
    trzyRundyState.remainingIds = [];
    trzyRundyState.currentRound = 1;
    trzyRundyState.activeTeam = 0;
    trzyRundyState.clueOffsets = [0, 0];
    trzyRundyState.teamScores = [0, 0];
    trzyRundyState.turnNumber = 0;
    trzyRundyState.gameFinished = false;
    trzyRundyState.hasSavedSession = false;
    try { localStorage.removeItem(TRZY_RUNDY_SESSION_KEY); } catch (_) {}
}

function resetTrzyRundyMatch() {
    trzyRundyState.pool = [];
    trzyRundyState.remainingIds = [];
    trzyRundyState.currentRound = 1;
    trzyRundyState.activeTeam = 0;
    trzyRundyState.clueOffsets = [0, 0];
    trzyRundyState.teamScores = [0, 0];
    trzyRundyState.turnNumber = 0;
    trzyRundyState.gameFinished = false;
}
