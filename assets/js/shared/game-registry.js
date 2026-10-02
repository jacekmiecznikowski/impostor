const GAME_MODULES = new Map();
const GAME_SESSION_METHODS = Object.freeze(['load', 'save', 'reset', 'hasResume', 'getPlayers']);

function normalizeGameSession(gameId, session) {
    if (!session) return null;
    for (const methodName of GAME_SESSION_METHODS) {
        if (typeof session[methodName] !== 'function') {
            throw new Error(`Sesja gry ${gameId} musi implementować ${methodName}().`);
        }
    }
    return session;
}

export function registerGameModule(config) {
    if (!config || typeof config.id !== 'string' || !config.id.trim()) {
        throw new Error('Moduł gry musi mieć poprawne id.');
    }

    const id = config.id.trim();
    const screens = new Set(Array.isArray(config.screens) ? config.screens : []);
    const session = normalizeGameSession(id, config.session);
    GAME_MODULES.set(id, { ...config, id, screens, session });
    return GAME_MODULES.get(id);
}

export function getGameModule(gameId) {
    return GAME_MODULES.get(gameId) || null;
}

export function getGameSession(gameOrId) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule(gameOrId) : gameOrId;
    return gameModule?.session || null;
}

export function getGameIdForScreen(screenName) {
    if (!screenName || screenName === 'home') return 'home';
    for (const gameModule of GAME_MODULES.values()) {
        if (gameModule.screens.has(screenName)) return gameModule.id;
    }
    return 'home';
}

export function getActiveGameId() {
    const screenName = typeof window.getCurrentScreenName === 'function'
        ? window.getCurrentScreenName()
        : (document.body?.dataset?.screen || 'home');
    return getGameIdForScreen(screenName);
}

export function getActiveGameModule() {
    const gameId = getActiveGameId();
    return gameId === 'home' ? null : getGameModule(gameId);
}

export function getActiveGameSession() {
    return getGameSession(getActiveGameModule());
}

export function callGameHook(gameOrId, hookName, ...args) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule(gameOrId) : gameOrId;
    const hook = gameModule?.[hookName];
    if (typeof hook !== 'function') return undefined;
    return hook(...args);
}

export function forEachGameSession(callback) {
    for (const gameModule of GAME_MODULES.values()) {
        if (!gameModule.session) continue;
        callback(gameModule.session, gameModule);
    }
}

export function loadGameSessions() {
    const results = new Map();
    forEachGameSession((session, gameModule) => {
        results.set(gameModule.id, session.load());
    });
    return results;
}

export function syncGameSessionUi() {
    forEachGameSession(session => session.syncUi?.());
}

export function saveGameSession(gameOrId) {
    return getGameSession(gameOrId)?.save();
}

export function resetGameSession(gameOrId) {
    return getGameSession(gameOrId)?.reset();
}

export function hasGameResume(gameOrId) {
    return Boolean(getGameSession(gameOrId)?.hasResume());
}

export function getGamePlayers(gameOrId) {
    const players = getGameSession(gameOrId)?.getPlayers();
    return Array.isArray(players) ? players : [];
}

const legacyBridge = {
    registerGameModule,
    getGameModule,
    getGameSession,
    getGameIdForScreen,
    getActiveGameId,
    getActiveGameModule,
    getActiveGameSession,
    callGameHook,
    forEachGameSession,
    loadGameSessions,
    syncGameSessionUi,
    saveGameSession,
    resetGameSession,
    hasGameResume,
    getGamePlayers
};

Object.assign(window, legacyBridge);
