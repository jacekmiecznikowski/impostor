import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerImpostorGame() {
    const existing = getGameModule('impostor');
    if (existing) return existing;

    return registerGameModule({
        id: 'impostor',
        catalog: {
            name: 'Impostor',
            description: 'Dedukcja, blef i szukanie osoby, która nie zna hasła.',
            icon: 'fa-user-secret',
            status: 'available',
            order: 10
        },
        theme: {
            palette: {
                accent: '#14b8a6',
                strong: '#0d9488',
                alt: '#0891b2',
                text: '#5eead4',
                contrast: '#ffffff',
                rgb: '20, 184, 166',
                surfaceRgb: '6, 59, 56'
            },
            previewBackground: 'impostor',
            backgrounds: {
                impostor: {
                    colors: [0x14b8a6, 0x06b6d4, 0x5eead4, 0x334155],
                    alpha: [0.05, 0.15], speed: 0.62, confetti: false, motif: 'impostor',
                    metaColor: '#063b38', pageBase: '#020617',
                    pageGlowRgb: '20, 184, 166', pageGlowAltRgb: '8, 145, 178',
                    pageGlowAlpha: '.12', pageGlowAltAlpha: '.045'
                },
                mystery: {
                    colors: [0x0f766e, 0x0891b2, 0x38bdf8, 0x475569],
                    alpha: [0.04, 0.12], speed: 0.48, confetti: false, motif: 'impostor',
                    metaColor: '#062e2c', pageBase: '#020617',
                    pageGlowRgb: '15, 118, 110', pageGlowAltRgb: '8, 145, 178',
                    pageGlowAlpha: '.11', pageGlowAltAlpha: '.04'
                },
                discussion: {
                    colors: [0x14b8a6, 0x06b6d4, 0x22d3ee, 0x334155],
                    alpha: [0.04, 0.13], speed: 0.58, confetti: false, motif: 'discussion',
                    metaColor: '#063b38', pageBase: '#020617',
                    pageGlowRgb: '20, 184, 166', pageGlowAltRgb: '34, 211, 238',
                    pageGlowAlpha: '.11', pageGlowAltAlpha: '.04'
                },
                vote: {
                    colors: [0x0f766e, 0x14b8a6, 0x0891b2, 0x1e293b],
                    alpha: [0.04, 0.12], speed: 0.54, confetti: false, motif: 'vote',
                    metaColor: '#063b38', pageBase: '#020617',
                    pageGlowRgb: '15, 118, 110', pageGlowAltRgb: '20, 184, 166',
                    pageGlowAlpha: '.10', pageGlowAltAlpha: '.04'
                },
                celebrate: {
                    colors: [0x14b8a6, 0x22d3ee, 0x5eead4, 0xf8fafc],
                    alpha: [0.07, 0.20], speed: 0.92, confetti: true, motif: 'celebrate',
                    metaColor: '#063b38', pageBase: '#020617',
                    pageGlowRgb: '20, 184, 166', pageGlowAltRgb: '94, 234, 212',
                    pageGlowAlpha: '.14', pageGlowAltAlpha: '.055'
                }
            }
        },
        views: [
            { target: '#app-main', url: './views/impostor-setup.html' },
            { target: '#app-main', url: './views/impostor-round.html' }
        ],
        screens: {
            menu: {
                backTarget: 'home',
                shell: { title: 'Impostor', subtitle: 'Menu gry', mode: 'menu' },
                background: 'impostor'
            },
            'setup-count': {
                backTarget: 'menu',
                shell: { title: 'Gracze', subtitle: 'Impostor • krok 1 z 2', mode: 'contextual' },
                background: 'impostor'
            },
            'setup-options': {
                backTarget: 'setup-count',
                shell: { title: 'Ustawienia rundy', subtitle: 'Impostor • krok 2 z 2', mode: 'contextual' },
                background: 'impostor'
            },
            pass: {
                shell: { title: 'Impostor', subtitle: 'Rozgrywka', mode: 'immersive' },
                background: 'mystery', immersive: true, roundGuard: true, wakeLock: true
            },
            reveal: {
                shell: { title: 'Impostor', subtitle: 'Rozgrywka', mode: 'immersive' },
                background: 'mystery', immersive: true, roundGuard: true, wakeLock: true
            },
            discussion: {
                shell: { title: 'Impostor', subtitle: 'Dyskusja', mode: 'immersive' },
                background: 'discussion', immersive: true, roundGuard: true, wakeLock: true
            },
            'group-voting': {
                shell: { title: 'Impostor', subtitle: 'Głosowanie', mode: 'immersive' },
                background: 'vote', immersive: true, roundGuard: true, wakeLock: true
            },
            results: {
                backTarget: 'menu',
                shell: { title: 'Impostor', subtitle: 'Wynik rundy', mode: 'immersive' },
                background: 'celebrate'
            }
        },
        menuScreen: 'menu',
        shellIcon: 'fa-user-secret',
        rulesModalId: 'rules-modal',
        shellLabels: {
            rules: 'Zasady Impostora',
            menu: 'Menu Impostora'
        },
        session: {
            load: () => loadSession(),
            save: () => persistSession(),
            reset: () => resetImpostorSession(),
            hasResume: () => hasSavedSession(),
            getPlayers: () => state.players,
            syncUi() {
                normalizeActiveCategories();
                renderImpostorPlayerSetup();
                updateHintModeUI();
                setDiscussionTimer(state.discussionTime, { silent: true });
                updateImpostorButtonsUI();
                updateResumeButton();
            }
        },
        open({ silent = false } = {}) {
            goToScreen('menu', { silent });
        },
        onScreenLeave() {
            if (!timerInterval) return;
            clearInterval(timerInterval);
            timerInterval = null;
        },
        onScreenEnter(screenName) {
            if (screenName === 'setup-options') {
                renderCategoriesGrid();
                updateImpostorButtonsUI();
                return;
            }
            if (screenName === 'discussion' && state.players.length > 0) {
                const randomPlayer = state.players[Math.floor(Math.random() * state.players.length)];
                state.startingPlayerName = randomPlayer.name;
                const starter = document.getElementById('starting-player-name');
                if (starter) starter.innerText = randomPlayer.name;

                const tips = Array.isArray(DISCUSSION_TIPS) && DISCUSSION_TIPS.length > 0
                    ? DISCUSSION_TIPS
                    : ['Zadawajcie pytania tak, żeby nie zdradzić hasła.'];
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                const tipElement = document.getElementById('discussion-tip');
                if (tipElement) tipElement.innerText = `“${randomTip}”`;
                setupDiscussionTimer();
                return;
            }
            if (screenName === 'group-voting') renderGroupVotingScreen();
        },
        leaveRound(destination) {
            state.currentTurnPlayerIndex = 0;
            state.secretWord = '';
            state.secretHint = '';
            state.impostorIds = [];
            state.playerRoles = {};
            state.startingPlayerName = '';
            state.selectedVotedPlayerId = null;
            if (typeof resetRevealCardPresentation === 'function') resetRevealCardPresentation();
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            goToScreen(destination === 'home' ? 'home' : 'menu', { direction: 'back' });
        },
        renderScoreboard() {
            const title = document.getElementById('score-modal-title');
            if (title) title.textContent = 'Tabela wyników • Impostor';
            renderScoreboardModal();
        },
        resetScoreboard() {
            resetScores();
        }
    });
}
