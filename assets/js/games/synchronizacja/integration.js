import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerSynchronizacjaGame() {
    const existing = getGameModule('synchronizacja');
    if (existing) return existing;

    return registerGameModule({
        id: 'synchronizacja',
        catalog: {
            name: 'Synchronizacja',
            description: 'Daj wskazówkę tak, żeby reszta ekipy trafiła w ukryty punkt na skali.',
            icon: 'fa-wave-square',
            status: 'available',
            order: 70
        },
        theme: {
            palette: {
                accent: '#8b5cf6', strong: '#6d28d9', alt: '#22d3ee', text: '#ddd6fe', contrast: '#ffffff',
                rgb: '139, 92, 246', surfaceRgb: '46, 16, 101'
            },
            previewBackground: 'synchronizacja',
            backgrounds: {
                synchronizacja: {
                    colors: [0x8b5cf6, 0x22d3ee, 0xc4b5fd, 0xf8fafc],
                    alpha: [0.05, 0.17], speed: 0.56, confetti: false, motif: 'party', overlayMotif: 'sync-spectrum',
                    metaColor: '#4c1d95', pageBase: '#070611',
                    pageGlowRgb: '139, 92, 246', pageGlowAltRgb: '34, 211, 238',
                    pageGlowAlpha: '.14', pageGlowAltAlpha: '.05'
                }
            }
        },
        views: [
            { target: '#app-main', url: './views/synchronizacja.html' },
            { target: '#modal-root', url: './views/synchronizacja-modals.html' }
        ],
        screens: {
            'sync-menu': { backTarget: 'home', shell: { title: 'Synchronizacja', subtitle: 'Menu gry', mode: 'menu' }, background: 'synchronizacja' },
            'sync-players': { backTarget: 'sync-menu', shell: { title: 'Gracze', subtitle: 'Synchronizacja • krok 1 z 2', mode: 'contextual' }, background: 'synchronizacja' },
            'sync-options': { backTarget: 'sync-players', shell: { title: 'Kategorie', subtitle: 'Synchronizacja • krok 2 z 2', mode: 'contextual' }, background: 'synchronizacja' },
            'sync-ready': { backTarget: 'sync-options', shell: { title: 'Synchronizacja', subtitle: 'Przekaż telefon', mode: 'contextual' }, background: 'synchronizacja' },
            'sync-clue': { shell: { title: 'Synchronizacja', subtitle: 'Nadaj wskazówkę', mode: 'immersive' }, background: 'synchronizacja', immersive: true, roundGuard: true, wakeLock: true },
            'sync-guess': { shell: { title: 'Synchronizacja', subtitle: 'Ustawcie marker', mode: 'immersive' }, background: 'synchronizacja', immersive: true, roundGuard: true, wakeLock: true },
            'sync-reveal': { shell: { title: 'Synchronizacja', subtitle: 'Odkrycie', mode: 'immersive' }, background: 'synchronizacja', immersive: true, roundGuard: true, wakeLock: false },
            'sync-round-summary': { backTarget: 'sync-menu', shell: { title: 'Synchronizacja', subtitle: 'Podsumowanie rundy', mode: 'contextual' }, background: 'synchronizacja' },
            'sync-final': { backTarget: 'sync-menu', shell: { title: 'Synchronizacja', subtitle: 'Koniec gry', mode: 'contextual' }, background: 'synchronizacja' }
        },
        menuScreen: 'sync-menu',
        shellIcon: 'fa-wave-square',
        rulesModalId: 'sync-rules-modal',
        shellLabels: { rules: 'Zasady Synchronizacji', menu: 'Menu Synchronizacji' },
        session: {
            load: () => loadSynchronizacjaSession(),
            save: () => persistSynchronizacjaSession(),
            reset: () => resetSynchronizacjaSession(),
            hasResume: () => synchronizacjaState.hasSavedSession && synchronizacjaState.players.length >= 2,
            getPlayers: () => synchronizacjaState.players,
            syncUi() {
                updateSynchronizacjaResumeButton();
                if (synchronizacjaState.players.length) renderSynchronizacjaPlayerSetup();
            }
        },
        open({ silent = false } = {}) { openSynchronizacjaMenu({ silent }); },
        initialize: () => initializeSynchronizacjaContent(),
        onScreenEnter(screenName) {
            if (screenName === 'sync-options') renderSynchronizacjaOptions();
            if (screenName === 'sync-ready') renderSynchronizacjaReadyScreen();
            if (screenName === 'sync-clue') renderSynchronizacjaClueScreen();
            if (screenName === 'sync-guess') renderSynchronizacjaGuessScreen();
            if (screenName === 'sync-reveal') renderSynchronizacjaRevealScreen();
            if (screenName === 'sync-round-summary') renderSynchronizacjaRoundSummary();
            if (screenName === 'sync-final') renderSynchronizacjaFinal();
        },
        leaveRound(destination) {
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            goToScreen(destination === 'home' ? 'home' : 'sync-menu', { direction: 'back' });
        },
        renderScoreboard() { renderSynchronizacjaScoreboardModal(); },
        resetScoreboard() { resetSynchronizacjaScores(); }
    });
}
