const BOMB_SESSION_STORAGE_KEY = 'partyjniak.ticking-bomb.session.v1';
const BOMB_DEFAULT_PLAYER_COUNT = 4;

const bombState = {
    playerCount: BOMB_DEFAULT_PLAYER_COUNT,
    players: [],
    mode: 'tracked',
    fusePreset: 'normal',
    activeCategories: [],
    currentPrompt: null,
    currentCategoryId: null,
    currentPlayerIndex: 0,
    lastLoserId: null,
    manualWinnerId: null,
    roundNumber: 0
};

const BOMB_FUSE_PRESETS = Object.freeze({
    quick: { id: 'quick', label: 'Szybka', minSeconds: 18, maxSeconds: 32, description: 'Krótko i nerwowo' },
    normal: { id: 'normal', label: 'Klasyczna', minSeconds: 28, maxSeconds: 52, description: 'Najlepsza na start' },
    long: { id: 'long', label: 'Długa', minSeconds: 42, maxSeconds: 72, description: 'Więcej czasu na odpowiedzi' }
});

function createBombPlayers(count, previousPlayers = bombState.players) {
    const previous = Array.isArray(previousPlayers) ? previousPlayers : [];
    bombState.playerCount = count;
    bombState.players = Array.from({ length: count }, (_, index) => {
        const existing = previous[index];
        return {
            id: existing?.id || `bomb-player-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
            name: existing?.name || `Gracz ${index + 1}`,
            score: Number(existing?.score) || 0,
            losses: Number(existing?.losses) || 0
        };
    });
}

function normalizeBombActiveCategories() {
    const available = new Set(BOMB_CATEGORIES.map(category => category.id));
    bombState.activeCategories = bombState.activeCategories.filter(id => available.has(id));
    if (bombState.activeCategories.length === 0) bombState.activeCategories = [...available];
}

function persistBombSession() {
    try {
        localStorage.setItem(BOMB_SESSION_STORAGE_KEY, JSON.stringify({
            playerCount: bombState.playerCount,
            players: bombState.players,
            mode: bombState.mode,
            fusePreset: bombState.fusePreset,
            activeCategories: bombState.activeCategories,
            roundNumber: bombState.roundNumber
        }));
    } catch (_) {}
}

function loadBombSession() {
    try {
        const parsed = JSON.parse(localStorage.getItem(BOMB_SESSION_STORAGE_KEY) || 'null');
        if (!parsed || typeof parsed !== 'object') throw new Error('Brak sesji');
        const count = Math.min(12, Math.max(2, Number(parsed.playerCount) || BOMB_DEFAULT_PLAYER_COUNT));
        bombState.playerCount = count;
        bombState.players = Array.isArray(parsed.players)
            ? parsed.players.slice(0, count).map((player, index) => ({
                id: String(player?.id || `bomb-player-restored-${index}`),
                name: String(player?.name || `Gracz ${index + 1}`).slice(0, 28),
                score: Number(player?.score) || 0,
                losses: Number(player?.losses) || 0
            }))
            : [];
        bombState.mode = parsed.mode === 'manual' ? 'manual' : 'tracked';
        bombState.fusePreset = BOMB_FUSE_PRESETS[parsed.fusePreset] ? parsed.fusePreset : 'normal';
        bombState.activeCategories = Array.isArray(parsed.activeCategories) ? parsed.activeCategories.map(String) : [];
        bombState.roundNumber = Number(parsed.roundNumber) || 0;
        if (bombState.players.length !== count) createBombPlayers(count, bombState.players);
    } catch (_) {
        createBombPlayers(BOMB_DEFAULT_PLAYER_COUNT, []);
    }
    normalizeBombActiveCategories();
}

function resetBombRoundState() {
    bombState.currentPrompt = null;
    bombState.currentCategoryId = null;
    bombState.currentPlayerIndex = 0;
    bombState.lastLoserId = null;
    bombState.manualWinnerId = null;
}
