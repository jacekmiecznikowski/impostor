import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerThreeFiveGame() {
    const existing = getGameModule('trzy-w-piec');
    if (existing) return existing;

    return registerGameModule({
        id: 'trzy-w-piec',
        catalog: {
            name: 'Trzy w Pięć',
            description: 'Wymień kilka rzeczy z zadanej kategorii, zanim skończy się czas.',
            icon: 'fa-stopwatch',
            status: 'available',
            order: 60
        },
        theme: {
            palette: {
                accent: '#84cc16',
                strong: '#4d7c0f',
                alt: '#eab308',
                text: '#d9f99d',
                contrast: '#0b1203',
                rgb: '132, 204, 22',
                surfaceRgb: '30, 58, 8'
            },
            previewBackground: 'trzy-w-piec',
            backgrounds: {
                'trzy-w-piec': {
                    colors: [0x84cc16, 0xeab308, 0xa3e635, 0xfef08a],
                    alpha: [0.06, 0.18], speed: 0.62, confetti: false, motif: 'party', overlayMotif: 'countdown-pulse',
                    metaColor: '#365314', pageBase: '#070b03',
                    pageGlowRgb: '132, 204, 22', pageGlowAltRgb: '234, 179, 8',
                    pageGlowAlpha: '.15', pageGlowAltAlpha: '.05'
                }
            }
        },
        views: [
            { target: '#app-main', url: './views/trzy-w-piec.html' },
            { target: '#modal-root', url: './views/trzy-w-piec-modals.html' }
        ],
        screens: {
            'three-five-menu': {
                backTarget: 'home',
                shell: { title: 'Trzy w Pięć', subtitle: 'Menu gry', mode: 'menu' },
                background: 'trzy-w-piec'
            },
            'three-five-players': {
                backTarget: 'three-five-menu',
                shell: { title: 'Gracze', subtitle: 'Trzy w Pięć • krok 1 z 2', mode: 'contextual' },
                background: 'trzy-w-piec'
            },
            'three-five-options': {
                backTarget: 'three-five-players',
                shell: { title: 'Ustawienia gry', subtitle: 'Trzy w Pięć • krok 2 z 2', mode: 'contextual' },
                background: 'trzy-w-piec'
            },
            'three-five-ready': {
                backTarget: 'three-five-options',
                shell: { title: 'Trzy w Pięć', subtitle: 'Przekaż telefon', mode: 'contextual' },
                background: 'trzy-w-piec'
            },
            'three-five-play': {
                shell: { title: 'Trzy w Pięć', subtitle: 'Szybka runda', mode: 'immersive' },
                background: 'trzy-w-piec', immersive: true, roundGuard: true, wakeLock: true
            },
            'three-five-winner': {
                backTarget: 'three-five-menu',
                shell: { title: 'Trzy w Pięć', subtitle: 'Koniec gry', mode: 'contextual' },
                background: 'trzy-w-piec'
            }
        },
        menuScreen: 'three-five-menu',
        shellIcon: 'fa-stopwatch',
        rulesModalId: 'three-five-rules-modal',
        shellLabels: {
            rules: 'Zasady Trzy w Pięć',
            menu: 'Menu Trzy w Pięć'
        },
        session: {
            load: () => loadThreeFiveSession(),
            save: () => persistThreeFiveSession(),
            reset: () => resetThreeFiveSession(),
            hasResume: () => threeFiveState.hasSavedSession && threeFiveState.players.length >= 2,
            getPlayers: () => threeFiveState.players,
            syncUi() {
                updateThreeFiveResumeButton();
                if (threeFiveState.players.length) renderThreeFivePlayerSetup();
            }
        },
        open({ silent = false } = {}) {
            openThreeFiveMenu({ silent });
        },
        onScreenEnter(screenName) {
            if (screenName === 'three-five-options') renderThreeFiveOptions();
            if (screenName === 'three-five-ready') renderThreeFiveReadyScreen();
            if (screenName === 'three-five-play') renderThreeFivePlayScreen();
        },
        onScreenLeave(previousScreen, nextScreen) {
            if (previousScreen === 'three-five-play' && nextScreen !== 'three-five-winner' && threeFiveRuntime?.timerRunning) {
                cancelThreeFiveTurn({ silent: true });
            }
        },
        leaveRound(destination) {
            cancelThreeFiveTurn({ silent: true });
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            goToScreen(destination === 'home' ? 'home' : 'three-five-menu', { direction: 'back' });
        },
        renderScoreboard() {
            renderThreeFiveScoreboardModal();
        },
        resetScoreboard() {
            resetThreeFiveScores();
        }
    });
}
