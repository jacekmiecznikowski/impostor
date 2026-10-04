import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerTrzyRundyGame() {
    const existing = getGameModule('trzy-rundy');
    if (existing) return existing;

    return registerGameModule({
        id: 'trzy-rundy',
        catalog: {
            name: 'Trzy Rundy',
            description: 'Te same hasła: najpierw opisuj, potem pokazuj, na końcu użyj jednego słowa.',
            icon: 'fa-arrows-rotate',
            status: 'available',
            order: 50
        },
        theme: {
            palette: {
                accent: '#22c55e', strong: '#15803d', alt: '#86efac', text: '#bbf7d0', contrast: '#ffffff',
                rgb: '34, 197, 94', surfaceRgb: '5, 46, 22'
            },
            previewBackground: 'trzy-rundy',
            backgrounds: {
                'trzy-rundy': {
                    colors: [0x22c55e, 0x4ade80, 0x86efac, 0xf8fafc],
                    alpha: [0.05, 0.16], speed: 0.60, confetti: false, motif: 'party', overlayMotif: 'three-rounds',
                    metaColor: '#14532d', pageBase: '#03120a',
                    pageGlowRgb: '34, 197, 94', pageGlowAltRgb: '134, 239, 172',
                    pageGlowAlpha: '.13', pageGlowAltAlpha: '.045'
                }
            }
        },
        views: [
            { target: '#app-main', url: './views/trzy-rundy.html' },
            { target: '#modal-root', url: './views/trzy-rundy-modals.html' }
        ],
        screens: {
            'tr-menu': { backTarget: 'home', shell: { title: 'Trzy Rundy', subtitle: 'Menu gry', mode: 'menu' }, background: 'trzy-rundy' },
            'tr-players': { backTarget: 'tr-menu', shell: { title: 'Gracze', subtitle: 'Trzy Rundy • krok 1 z 2', mode: 'contextual' }, background: 'trzy-rundy' },
            'tr-options': { backTarget: 'tr-players', shell: { title: 'Ustawienia', subtitle: 'Trzy Rundy • krok 2 z 2', mode: 'contextual' }, background: 'trzy-rundy' },
            'tr-ready': { shell: { title: 'Trzy Rundy', subtitle: 'Przekaż telefon', mode: 'contextual' }, background: 'trzy-rundy', roundGuard: true },
            'tr-play': { shell: { title: 'Trzy Rundy', subtitle: 'Tura drużyny', mode: 'immersive' }, background: 'trzy-rundy', immersive: true, roundGuard: true, wakeLock: true },
            'tr-turn-summary': { shell: { title: 'Trzy Rundy', subtitle: 'Koniec tury', mode: 'contextual' }, background: 'trzy-rundy', roundGuard: true },
            'tr-round-break': { shell: { title: 'Trzy Rundy', subtitle: 'Zmiana rundy', mode: 'contextual' }, background: 'trzy-rundy', roundGuard: true },
            'tr-final': { backTarget: 'tr-menu', shell: { title: 'Trzy Rundy', subtitle: 'Koniec gry', mode: 'contextual' }, background: 'trzy-rundy' }
        },
        menuScreen: 'tr-menu',
        shellIcon: 'fa-arrows-rotate',
        rulesModalId: 'tr-rules-modal',
        shellLabels: { rules: 'Zasady Trzech Rund', menu: 'Menu Trzech Rund' },
        session: {
            load: () => loadTrzyRundySession(),
            save: () => persistTrzyRundySession(),
            reset: () => resetTrzyRundySession(),
            hasResume: () => trzyRundyState.hasSavedSession && trzyRundyState.players.length >= 4 && trzyRundyState.pool.length > 0,
            getPlayers: () => trzyRundyState.players,
            syncUi() {
                updateTrzyRundyResumeButton();
                if (trzyRundyState.players.length) renderTrzyRundyPlayerSetup();
            }
        },
        open({ silent = false } = {}) { openTrzyRundyMenu({ silent }); },
        initialize: () => initializeTrzyRundyContent(),
        onScreenEnter(screenName) {
            if (screenName === 'tr-players') renderTrzyRundyPlayerSetup();
            if (screenName === 'tr-options') renderTrzyRundyOptions();
            if (screenName === 'tr-ready') renderTrzyRundyReady();
            if (screenName === 'tr-play') renderTrzyRundyPlay();
            if (screenName === 'tr-turn-summary') renderTrzyRundyTurnSummary();
            if (screenName === 'tr-round-break') renderTrzyRundyRoundBreak();
            if (screenName === 'tr-final') renderTrzyRundyFinal();
        },
        beforeLeave() { cancelTrzyRundyTurn?.({ silent: true }); },
        leaveRound(destination) {
            cancelTrzyRundyTurn?.({ silent: true });
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            goToScreen(destination === 'home' ? 'home' : 'tr-menu', { direction: 'back' });
        },
        renderScoreboard() { renderTrzyRundyScoreboardModal(); },
        resetScoreboard() { resetTrzyRundyScores(); }
    });
}
