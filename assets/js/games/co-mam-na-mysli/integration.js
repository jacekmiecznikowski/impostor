import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerCoMamNaMysliGame() {
    const existing = getGameModule('co-mam-na-mysli');
    if (existing) return existing;

    return registerGameModule({
        id: 'co-mam-na-mysli',
        catalog: {
            name: 'Co mam na myśli?',
            description: 'Telefon na czoło, podpowiedzi ekipy i sterowanie przechyleniem.',
            icon: 'fa-face-grin-stars',
            status: 'available',
            order: 50
        },
        theme: {
            palette: {
                accent: '#0ea5e9', strong: '#0284c7', alt: '#22d3ee', text: '#bae6fd', contrast: '#ffffff',
                rgb: '14, 165, 233', surfaceRgb: '7, 89, 133'
            },
            previewBackground: 'co-mam-na-mysli',
            backgrounds: {
                'co-mam-na-mysli': {
                    colors: [0x0ea5e9, 0x22d3ee, 0x38bdf8, 0xa78bfa],
                    alpha: [0.06, 0.18], speed: 0.68, confetti: false, motif: 'party', overlayMotif: 'thought-field',
                    metaColor: '#075985', pageBase: '#030712',
                    pageGlowRgb: '14, 165, 233', pageGlowAltRgb: '34, 211, 238',
                    pageGlowAlpha: '.15', pageGlowAltAlpha: '.05'
                },
                'cmm-play': {
                    colors: [0x0ea5e9, 0x38bdf8, 0x22d3ee, 0x818cf8],
                    alpha: [0.07, 0.2], speed: 0.8, confetti: false, motif: 'party', overlayMotif: 'gyro',
                    metaColor: '#075985', pageBase: '#020617',
                    pageGlowRgb: '14, 165, 233', pageGlowAltRgb: '56, 189, 248',
                    pageGlowAlpha: '.16', pageGlowAltAlpha: '.055'
                },
                'cmm-result': {
                    colors: [0x22d3ee, 0x0ea5e9, 0x818cf8, 0xf8fafc],
                    alpha: [0.08, 0.22], speed: 0.9, confetti: true, motif: 'celebrate', overlayMotif: 'thought-celebrate',
                    metaColor: '#075985', pageBase: '#030712',
                    pageGlowRgb: '34, 211, 238', pageGlowAltRgb: '14, 165, 233',
                    pageGlowAlpha: '.18', pageGlowAltAlpha: '.06'
                }
            }
        },
        views: [
            { target: '#app-main', url: './views/co-mam-na-mysli.html' },
            { target: '#modal-root', url: './views/co-mam-na-mysli-modals.html' }
        ],
        screens: {
            'cmm-menu': {
                backTarget: 'home',
                shell: { title: 'Co mam na myśli?', subtitle: 'Menu gry', mode: 'menu' },
                background: 'co-mam-na-mysli'
            },
            'cmm-players': {
                backTarget: 'cmm-menu',
                shell: { title: 'Gracze', subtitle: 'Co mam na myśli? • krok 1 z 2', mode: 'contextual' },
                background: 'co-mam-na-mysli'
            },
            'cmm-options': {
                backTarget: 'cmm-players',
                shell: { title: 'Ustawienia rundy', subtitle: 'Co mam na myśli? • krok 2 z 2', mode: 'contextual' },
                background: 'co-mam-na-mysli'
            },
            'cmm-ready': {
                backTarget: 'cmm-options',
                shell: { title: 'Co mam na myśli?', subtitle: 'Telefon na czoło', mode: 'contextual' },
                background: 'co-mam-na-mysli'
            },
            'cmm-play': {
                shell: { title: 'Co mam na myśli?', subtitle: 'Runda trwa', mode: 'immersive' },
                background: 'cmm-play', immersive: true, roundGuard: true, wakeLock: true, orientation: 'landscape'
            },
            'cmm-result': {
                backTarget: 'cmm-menu',
                shell: { title: 'Co mam na myśli?', subtitle: 'Wynik tury', mode: 'contextual' },
                background: 'cmm-result', orientation: 'portrait'
            }
        },
        menuScreen: 'cmm-menu',
        shellIcon: 'fa-face-grin-stars',
        rulesModalId: 'cmm-rules-modal',
        shellLabels: {
            rules: 'Zasady Co mam na myśli?',
            menu: 'Menu Co mam na myśli?'
        },
        initialize: () => initializeCoMamNaMysliContent(),
        session: {
            load: () => loadCoMamNaMysliSession(),
            save: () => persistCoMamNaMysliSession(),
            reset: () => resetCoMamNaMysliSession(),
            hasResume: () => coMamNaMysliState.hasSavedSession && coMamNaMysliState.players.length >= 2,
            getPlayers: () => coMamNaMysliState.players,
            syncUi() {
                updateCoMamNaMysliResumeButton();
                if (coMamNaMysliState.players.length) renderCoMamNaMysliPlayerSetup();
            }
        },
        open({ silent = false } = {}) {
            openCoMamNaMysliMenu({ silent });
        },
        onScreenEnter(screenName) {
            if (screenName === 'cmm-options') renderCoMamNaMysliOptions();
            if (screenName === 'cmm-ready') renderCoMamNaMysliReadyScreen();
        },
        onScreenLeave(previousScreen, nextScreen) {
            if (previousScreen === 'cmm-play' && nextScreen !== 'cmm-result') cancelCoMamNaMysliRound({ silent: true });
        },
        beforeLeave() {
            if (getCurrentScreenName() === 'cmm-play') cancelCoMamNaMysliRound({ silent: true });
        },
        leaveRound(destination) {
            cancelCoMamNaMysliRound({ silent: true });
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            setPartyjniakOrientation?.('portrait');
            goToScreen(destination === 'home' ? 'home' : 'cmm-menu', { direction: 'back' });
        },
        renderScoreboard() {
            renderCoMamNaMysliScoreboardModal();
        },
        resetScoreboard() {
            resetCoMamNaMysliScores();
        }
    });
}
