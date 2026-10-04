import { getGameModule, initializeGameModule, syncGameSessionUi } from './shared/game-registry.js?v=2';
import { registerGameModules } from './games/index.js?v=8';

const preparedGames = new Map();

async function prepareGame(gameModule) {
    if (preparedGames.has(gameModule.id)) return preparedGames.get(gameModule.id);

    const preparation = (async () => {
        await window.loadGameAssets?.(gameModule);
        await window.loadGameViews?.(gameModule);

        const initialization = await initializeGameModule(gameModule);
        if (initialization.status === 'rejected') throw initialization.reason;

        gameModule.session?.load?.();
        syncGameSessionUi(gameModule);
        return gameModule;
    })();

    preparedGames.set(gameModule.id, preparation);
    try {
        return await preparation;
    } catch (error) {
        preparedGames.delete(gameModule.id);
        throw error;
    }
}

function installLazyGameLoader() {
    const openRegisteredGame = window.openGame;
    window.openGame = async (gameId, options = {}) => {
        const gameModule = getGameModule(gameId);
        if (!gameModule) return;

        try {
            await prepareGame(gameModule);
        } catch (error) {
            console.error(`Nie udało się przygotować gry ${gameId}:`, error);
            showToast?.('Błąd gry', 'Nie udało się załadować tej gry. Spróbuj ponownie.');
            return;
        }

        return openRegisteredGame?.(gameId, options);
    };
}

async function initializeApp() {
    registerGameModules();
    initializePartyjniakThemes?.();

    try {
        await loadAppViews();
    } catch (error) {
        console.error('Nie udało się załadować widoków Partyjniaka:', error);
        document.body.innerHTML = '<main class="min-h-dvh flex items-center justify-center p-6 text-center bg-slate-950 text-slate-100"><div><h1 class="text-2xl font-black">Partyjniak</h1><p class="mt-3 text-sm text-slate-400">Nie udało się załadować interfejsu. Odśwież aplikację.</p></div></main>';
        return;
    }

    setupGameHub();
    installLazyGameLoader();
    initializePartyjniakSettingsUi?.();
    setupSystemBackHandling();
    setupNativeAndroidIntegration?.();

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (!navigateBack()) closeShellMenu?.();
    });

    document.addEventListener('click', event => {
        const modal = event.target instanceof Element ? event.target.closest('[id$="-modal"]') : null;
        if (modal && event.target === modal) closeModal(modal.id);
    });

    document.addEventListener('pointerdown', event => {
        const popover = document.getElementById('shell-menu-popover');
        const button = document.getElementById('shell-more-btn');
        if (!popover || popover.classList.contains('hidden')) return;
        if (!popover.contains(event.target) && !button?.contains(event.target)) closeShellMenu?.();
    }, { passive: true });

    const requestedGame = new URLSearchParams(window.location.search).get('game');
    if (requestedGame) {
        try {
            window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.hash}`);
        } catch (_) {}
    }

    goToScreen('home', { silent: true });
    if (requestedGame && getGameModule(requestedGame)) await window.openGame(requestedGame, { silent: true });

    const nativeApp = typeof isPartyjniakNative === 'function' && isPartyjniakNative();
    if (!nativeApp && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service Worker nie został zarejestrowany:', error));
        }, { once: true });
    }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
else initializeApp();
