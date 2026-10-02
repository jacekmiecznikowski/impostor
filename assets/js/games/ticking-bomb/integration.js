APP_VIEW_FRAGMENTS.splice(2, 0,
    { target: '#app-main', url: './views/ticking-bomb.html' },
    { target: '#modal-root', url: './views/ticking-bomb-modals.html' }
);

Object.assign(SCREEN_BACK_TARGET, {
    'bomb-menu': 'home',
    'bomb-players': 'bomb-menu',
    'bomb-options': 'bomb-players',
    'bomb-result': 'bomb-menu'
});
ROUND_GUARDED_SCREENS.add('bomb-play');
WAKE_LOCK_SCREENS.add('bomb-play');
IMMERSIVE_SCREENS.add('bomb-play');

Object.assign(SHELL_CONTEXT_BY_SCREEN, {
    'bomb-menu': { title: 'Tykająca Bomba', subtitle: 'Menu gry', mode: 'menu' },
    'bomb-players': { title: 'Gracze', subtitle: 'Tykająca Bomba • krok 1 z 2', mode: 'contextual' },
    'bomb-options': { title: 'Ustawienia rundy', subtitle: 'Tykająca Bomba • krok 2 z 2', mode: 'contextual' },
    'bomb-play': { title: 'Tykająca Bomba', subtitle: 'Runda trwa', mode: 'immersive' },
    'bomb-result': { title: 'Tykająca Bomba', subtitle: 'Wynik rundy', mode: 'contextual' }
});

Object.assign(BACKGROUND_MODE_BY_SCREEN, {
    'bomb-menu': 'ticking-bomb',
    'bomb-players': 'ticking-bomb',
    'bomb-options': 'ticking-bomb',
    'bomb-play': 'ticking-bomb',
    'bomb-result': 'bomb-alert'
});

registerGameModule({
    id: 'ticking-bomb',
    screens: ['bomb-menu', 'bomb-players', 'bomb-options', 'bomb-play', 'bomb-result'],
    menuScreen: 'bomb-menu',
    shellIcon: 'fa-bomb',
    rulesModalId: 'bomb-rules-modal',
    shellLabels: {
        rules: 'Zasady Tykającej Bomby',
        menu: 'Menu Tykającej Bomby'
    },
    session: {
        load: () => loadBombSession(),
        save: () => persistBombSession(),
        reset: () => resetBombSession(),
        hasResume: () => bombState.hasSavedSession && bombState.players.length >= 2,
        getPlayers: () => bombState.players,
        syncUi() {
            updateBombResumeButton();
        }
    },
    open({ silent = false } = {}) {
        openBombGameMenu({ silent });
    },
    onScreenLeave(previousScreen, nextScreen) {
        if (previousScreen === 'bomb-result' && nextScreen !== 'bomb-result') {
            stopAllBombAudio?.();
        }
    },
    beforeLeave() {
        if (getCurrentScreenName() !== 'bomb-play') stopAllBombAudio?.();
    },
    leaveRound(destination) {
        cancelBombRound({ silent: true });
        stopAllBombAudio?.();
        resetBombRoundState();
        closeNavigationSheet();
        setGameAwakeMode?.(false);
        goToScreen(destination === 'home' ? 'home' : 'bomb-menu', { direction: 'back' });
    },
    renderScoreboard() {
        renderBombScoreboardModal();
    },
    resetScoreboard() {
        resetBombScores();
    },
    onAudioChanged(enabled) {
        if (!enabled) {
            stopAllBombAudio?.();
        } else if (getCurrentScreenName() === 'bomb-play' && bombRuntime?.active) {
            startBombTicking?.();
        }
    }
});
