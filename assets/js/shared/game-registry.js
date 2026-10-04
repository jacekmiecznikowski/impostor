const GAME_MODULES = new Map();
const GAME_SESSION_METHODS = Object.freeze(['load', 'save', 'reset', 'hasResume', 'getPlayers']);

function normalizeGameSession(gameId, session) {
    if (!session) return null;
    for (const methodName of GAME_SESSION_METHODS) {
        if (typeof session[methodName] !== 'function') throw new Error(`Sesja gry ${gameId} musi implementować ${methodName}().`);
    }
    return session;
}

function normalizeCatalog(gameId, catalog) {
    if (!catalog) return null;
    return Object.freeze({ id: gameId, name: String(catalog.name || gameId), description: String(catalog.description || ''), icon: String(catalog.icon || 'fa-gamepad'), status: String(catalog.status || 'prototype'), order: Number.isFinite(Number(catalog.order)) ? Number(catalog.order) : 100 });
}

function normalizeScreens(screens) {
    if (!screens) return new Map();
    if (Array.isArray(screens)) return new Map(screens.map(screenName => [screenName, {}]));
    if (typeof screens !== 'object') throw new Error('Konfiguracja ekranów gry musi być obiektem.');
    return new Map(Object.entries(screens).map(([screenName, config]) => [screenName, { ...(config || {}) }]));
}

function normalizeViews(views) {
    if (!Array.isArray(views)) return [];
    return views.map(view => ({ target: String(view.target || ''), url: String(view.url || '') })).filter(view => view.target && view.url);
}

export function registerGameModule(config) {
    if (!config || typeof config.id !== 'string' || !config.id.trim()) throw new Error('Moduł gry musi mieć poprawne id.');
    const id = config.id.trim();
    const screenConfig = normalizeScreens(config.screens);
    const session = normalizeGameSession(id, config.session);
    const catalog = normalizeCatalog(id, config.catalog);
    const views = normalizeViews(config.views);
    const module = { ...config, id, catalog, views, screens: new Set(screenConfig.keys()), screenConfig, session };
    GAME_MODULES.set(id, module);
    return module;
}

export function getGameModule(gameId) { return GAME_MODULES.get(gameId) || null; }
export function listGameModules() { return [...GAME_MODULES.values()]; }
export function getGameCatalog() { return listGameModules().filter(gameModule => gameModule.catalog).map(gameModule => gameModule.catalog).sort((a,b) => a.order - b.order || a.name.localeCompare(b.name, 'pl')); }
export function getGameViewFragments() { return listGameModules().flatMap(gameModule => gameModule.views); }

export function getGameScreenConfig(screenName) {
    if (!screenName || screenName === 'home') return null;
    for (const gameModule of GAME_MODULES.values()) {
        const config = gameModule.screenConfig.get(screenName);
        if (config) return { ...config, gameId: gameModule.id };
    }
    return null;
}

export function getGameSession(gameOrId) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule(gameOrId) : gameOrId;
    return gameModule?.session || null;
}

export function getGameIdForScreen(screenName) {
    if (!screenName || screenName === 'home') return 'home';
    for (const gameModule of GAME_MODULES.values()) if (gameModule.screens.has(screenName)) return gameModule.id;
    return 'home';
}

export function getActiveGameId() {
    const screenName = typeof window.getCurrentScreenName === 'function' ? window.getCurrentScreenName() : (document.body?.dataset?.screen || 'home');
    return getGameIdForScreen(screenName);
}

export function getActiveGameModule() { const gameId = getActiveGameId(); return gameId === 'home' ? null : getGameModule(gameId); }
export function getActiveGameSession() { return getGameSession(getActiveGameModule()); }

export function callGameHook(gameOrId, hookName, ...args) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule(gameOrId) : gameOrId;
    const hook = gameModule?.[hookName];
    return typeof hook === 'function' ? hook(...args) : undefined;
}

export async function initializeGameModules() {
    const results = new Map();
    for (const gameModule of GAME_MODULES.values()) {
        if (typeof gameModule.initialize !== 'function') continue;
        try {
            results.set(gameModule.id, { status: 'fulfilled', value: await gameModule.initialize() });
        } catch (error) {
            console.warn(`Nie udało się zainicjalizować modułu ${gameModule.id}.`, error);
            results.set(gameModule.id, { status: 'rejected', reason: error });
        }
    }
    return results;
}

export function forEachGameSession(callback) {
    for (const gameModule of GAME_MODULES.values()) {
        if (gameModule.session) callback(gameModule.session, gameModule);
    }
}
export function loadGameSessions() { const results = new Map(); forEachGameSession((session, gameModule) => results.set(gameModule.id, session.load())); return results; }
export function syncGameSessionUi() { forEachGameSession(session => session.syncUi?.()); }
export function saveGameSession(gameOrId) { return getGameSession(gameOrId)?.save(); }
export function resetGameSession(gameOrId) { return getGameSession(gameOrId)?.reset(); }
export function hasGameResume(gameOrId) { return Boolean(getGameSession(gameOrId)?.hasResume()); }
export function getGamePlayers(gameOrId) { const players = getGameSession(gameOrId)?.getPlayers(); return Array.isArray(players) ? players : []; }

const legacyBridge = { registerGameModule, getGameModule, listGameModules, getGameCatalog, getGameViewFragments, getGameScreenConfig, getGameSession, getGameIdForScreen, getActiveGameId, getActiveGameModule, getActiveGameSession, callGameHook, initializeGameModules, forEachGameSession, loadGameSessions, syncGameSessionUi, saveGameSession, resetGameSession, hasGameResume, getGamePlayers };
Object.assign(window, legacyBridge);
