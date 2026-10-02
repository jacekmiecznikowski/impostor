const GAME_MODULES = new Map();

function registerGameModule(config) {
    if (!config || typeof config.id !== 'string' || !config.id.trim()) {
        throw new Error('Moduł gry musi mieć poprawne id.');
    }

    const id = config.id.trim();
    const screens = new Set(Array.isArray(config.screens) ? config.screens : []);
    GAME_MODULES.set(id, { ...config, id, screens });
    return GAME_MODULES.get(id);
}

function getGameModule(gameId) {
    return GAME_MODULES.get(gameId) || null;
}

function getGameIdForScreen(screenName) {
    if (!screenName || screenName === 'home') return 'home';
    for (const gameModule of GAME_MODULES.values()) {
        if (gameModule.screens.has(screenName)) return gameModule.id;
    }
    return 'home';
}

function getActiveGameId() {
    const screenName = typeof getCurrentScreenName === 'function'
        ? getCurrentScreenName()
        : (document.body?.dataset?.screen || 'home');
    return getGameIdForScreen(screenName);
}

function getActiveGameModule() {
    const gameId = getActiveGameId();
    return gameId === 'home' ? null : getGameModule(gameId);
}

function callGameHook(gameOrId, hookName, ...args) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule(gameOrId) : gameOrId;
    const hook = gameModule?.[hookName];
    if (typeof hook !== 'function') return undefined;
    return hook(...args);
}
