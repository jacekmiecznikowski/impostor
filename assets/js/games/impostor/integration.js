registerGameModule({
    id: 'impostor',
    screens: ['menu', 'setup-count', 'setup-names', 'setup-options', 'pass', 'reveal', 'discussion', 'group-voting', 'results'],
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
    renderScoreboard() {
        const title = document.getElementById('score-modal-title');
        if (title) title.textContent = 'Tabela wyników • Impostor';
        renderScoreboardModal();
    },
    resetScoreboard() {
        resetScores();
    }
});
