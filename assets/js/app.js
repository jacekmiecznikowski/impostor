import { getGameModule, loadGameSessions, syncGameSessionUi } from './shared/game-registry.js?v=2';
import { registerGameModules } from './games/index.js?v=1';

async function initializeContentLayer() {
    try {
        if (typeof initializeImpostorRemoteContent === 'function') {
            await initializeImpostorRemoteContent();
        }
        if (typeof initializeTickingBombContent === 'function') {
            await initializeTickingBombContent();
        }
    } catch (error) {
        console.warn('Zdalna warstwa treści nie została uruchomiona. Używam danych lokalnych.', error);
    }
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

    await initializeContentLayer();
    loadGameSessions();

    setupGameHub();
    setupImpostorPresentation();
    if (typeof setupRevealWordFitting === 'function') setupRevealWordFitting();
    setupSystemBackHandling();
    setupNativeAndroidIntegration?.();
    syncGameSessionUi();

    const audioIcon = document.getElementById('audio-icon');
    if (audioIcon) audioIcon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (!navigateBack()) closeShellMenu?.();
    });

    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal.id);
        });
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

    if (requestedGame && getGameModule(requestedGame)) {
        openGame(requestedGame, { silent: true });
    } else {
        goToScreen('home', { silent: true });
    }

    const nativeApp = typeof isPartyjniakNative === 'function' && isPartyjniakNative();
    if (!nativeApp && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(error => {
                console.warn('Service Worker nie został zarejestrowany:', error);
            });
        }, { once: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}
