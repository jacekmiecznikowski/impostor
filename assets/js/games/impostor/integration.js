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
                shell: { title: 'Liczba graczy', subtitle: 'Impostor • krok 1 z 3', mode: 'contextual' },
                background: 'impostor'
            },
            'setup-names': {
                backTarget: 'setup-count',
                shell: { title: 'Imiona graczy', subtitle: 'Impostor • krok 2 z 3', mode: 'contextual' },
                background: 'impostor'
            },
            'setup-options': {
                backTarget: 'setup-names',
                shell: { title: 'Ustawienia rundy', subtitle: 'Impostor • krok 3 z 3', mode: 'contextual' },
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
                const slider = document.getElementById('player-slider');
                const playerCount = document.getElementById('player-count-big');
                if (slider) slider.value = state.playerCount;
                if (playerCount) playerCount.innerText = state.playerCount;
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
