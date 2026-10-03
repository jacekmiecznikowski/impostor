import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerNaokoloGame() {
    const existing = getGameModule('naokolo');
    if (existing) return existing;

    return registerGameModule({
        id: 'naokolo',
        catalog: {
            name: 'Naokoło',
            description: 'Opisuj hasło bez używania zakazanych słów.',
            icon: 'fa-comments',
            status: 'available',
            order: 30
        },
        theme: {
            palette: {
                accent: '#6366f1',
                strong: '#4f46e5',
                alt: '#a78bfa',
                text: '#c4b5fd',
                contrast: '#ffffff',
                rgb: '99, 102, 241',
                surfaceRgb: '49, 46, 129'
            },
            previewBackground: 'naokolo',
            backgrounds: {
                naokolo: {
                    colors: [0x6366f1, 0xa78bfa, 0x38bdf8, 0xf8fafc],
                    alpha: [0.06, 0.18], speed: 0.72, confetti: false, motif: 'party', overlayMotif: 'orbit-words',
                    metaColor: '#312e81', pageBase: '#070716',
                    pageGlowRgb: '99, 102, 241', pageGlowAltRgb: '167, 139, 250',
                    pageGlowAlpha: '.16', pageGlowAltAlpha: '.06'
                },
                'naokolo-play': {
                    colors: [0x6366f1, 0x38bdf8, 0xa78bfa, 0x22d3ee],
                    alpha: [0.07, 0.19], speed: 0.84, confetti: false, motif: 'party', overlayMotif: 'orbit-fast',
                    metaColor: '#312e81', pageBase: '#060615',
                    pageGlowRgb: '99, 102, 241', pageGlowAltRgb: '56, 189, 248',
                    pageGlowAlpha: '.17', pageGlowAltAlpha: '.055'
                },
                'naokolo-result': {
                    colors: [0xa78bfa, 0x6366f1, 0x38bdf8, 0xf8fafc],
                    alpha: [0.08, 0.22], speed: 0.9, confetti: true, motif: 'celebrate', overlayMotif: 'orbit-celebrate',
                    metaColor: '#312e81', pageBase: '#070716',
                    pageGlowRgb: '167, 139, 250', pageGlowAltRgb: '99, 102, 241',
                    pageGlowAlpha: '.18', pageGlowAltAlpha: '.065'
                }
            }
        },
        views: [
            { target: '#app-main', url: './views/naokolo.html' },
            { target: '#modal-root', url: './views/naokolo-modals.html' }
        ],
        screens: {
            'naokolo-menu': {
                backTarget: 'home',
                shell: { title: 'Naokoło', subtitle: 'Menu gry', mode: 'menu' },
                background: 'naokolo'
            },
            'naokolo-players': {
                backTarget: 'naokolo-menu',
                shell: { title: 'Gracze', subtitle: 'Naokoło • krok 1 z 2', mode: 'contextual' },
                background: 'naokolo'
            },
            'naokolo-options': {
                backTarget: 'naokolo-players',
                shell: { title: 'Ustawienia rundy', subtitle: 'Naokoło • krok 2 z 2', mode: 'contextual' },
                background: 'naokolo'
            },
            'naokolo-ready': {
                backTarget: 'naokolo-options',
                shell: { title: 'Naokoło', subtitle: 'Przekaż telefon opisującemu', mode: 'contextual' },
                background: 'naokolo'
            },
            'naokolo-play': {
                shell: { title: 'Naokoło', subtitle: 'Tura trwa', mode: 'immersive' },
                background: 'naokolo-play', immersive: true, roundGuard: true, wakeLock: true
            },
            'naokolo-result': {
                backTarget: 'naokolo-menu',
                shell: { title: 'Naokoło', subtitle: 'Wynik tury', mode: 'contextual' },
                background: 'naokolo-result'
            }
        },
        menuScreen: 'naokolo-menu',
        shellIcon: 'fa-comments',
        rulesModalId: 'naokolo-rules-modal',
        shellLabels: {
            rules: 'Zasady Naokoło',
            menu: 'Menu Naokoło'
        },
        session: {
            load: () => loadNaokoloSession(),
            save: () => persistNaokoloSession(),
            reset: () => resetNaokoloSession(),
            hasResume: () => naokoloState.hasSavedSession && naokoloState.players.length >= 2,
            getPlayers: () => naokoloState.players,
            syncUi() {
                updateNaokoloResumeButton();
                if (naokoloState.players.length) renderNaokoloPlayerSetup();
            }
        },
        open({ silent = false } = {}) {
            openNaokoloMenu({ silent });
        },
        onScreenEnter(screenName) {
            if (screenName === 'naokolo-options') renderNaokoloOptions();
            if (screenName === 'naokolo-ready') renderNaokoloReadyScreen();
        },
        onScreenLeave(previousScreen, nextScreen) {
            if (previousScreen === 'naokolo-play' && nextScreen !== 'naokolo-result' && naokoloRuntime?.active) {
                cancelNaokoloTurn({ silent: true });
            }
        },
        leaveRound(destination) {
            cancelNaokoloTurn({ silent: true });
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            goToScreen(destination === 'home' ? 'home' : 'naokolo-menu', { direction: 'back' });
        },
        renderScoreboard() {
            renderNaokoloScoreboardModal();
        },
        resetScoreboard() {
            resetNaokoloScores();
        }
    });
}
