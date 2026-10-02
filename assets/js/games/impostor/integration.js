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
