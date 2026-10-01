const TICKING_BOMB_GAME = {
    id: 'ticking-bomb',
    name: 'Tykająca Bomba',
    description: 'Szybkie odpowiedzi, ukryty lont i telefon, którego nikt nie chce trzymać przy BOOM.',
    icon: 'fa-bomb',
    status: 'available'
};

if (!GAME_CATALOG.some(game => game.id === TICKING_BOMB_GAME.id)) {
    GAME_CATALOG.splice(1, 0, TICKING_BOMB_GAME);
}

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

function getActiveGameId() {
    const screen = getCurrentScreenName();
    if (screen.startsWith('bomb-')) return 'ticking-bomb';
    if (screen === 'home') return 'home';
    return 'impostor';
}

const baseOpenGame = openGame;
openGame = function partyjniakOpenGame(gameId, options = {}) {
    if (gameId === 'ticking-bomb') {
        closeShellMenu?.();
        document.body.dataset.game = 'ticking-bomb';
        openBombGameMenu({ silent: Boolean(options?.silent) });
        return;
    }
    document.body.dataset.game = gameId === 'impostor' ? 'impostor' : 'home';
    return baseOpenGame(gameId, options);
};

const baseGoToScreen = goToScreen;
goToScreen = function partyjniakGoToScreen(screenName, options = {}) {
    const previousScreen = getCurrentScreenName();
    if (previousScreen === 'bomb-result' && screenName !== 'bomb-result') stopAllBombAudio?.();

    if (screenName.startsWith('bomb-')) document.body.dataset.game = 'ticking-bomb';
    else if (screenName === 'home') document.body.dataset.game = 'home';
    else document.body.dataset.game = 'impostor';
    return baseGoToScreen(screenName, options);
};

const baseSetupGameHub = setupGameHub;
setupGameHub = function partyjniakSetupHub() {
    baseSetupGameHub();

    const about = document.querySelector('#about-modal .text-sm');
    if (about) about.innerHTML = '<p><strong>Partyjniak</strong> to kolekcja mobilnych gier imprezowych na jeden telefon.</p><p>Dostępne gry: <strong>Impostor</strong> i <strong>Tykająca Bomba</strong>. Kolejne tryby będą korzystać z tego samego wspólnego huba.</p>';

    const resetButton = document.querySelector('#score-modal .secondary-btn');
    if (resetButton) {
        resetButton.removeAttribute('onclick');
        resetButton.onclick = resetCurrentScores;
    }
    const scoreTitle = document.querySelector('#score-modal h3');
    if (scoreTitle) scoreTitle.id = 'score-modal-title';
};

function updateBombAwareNavigationIcons(isBomb) {
    const shellMenuIcon = document.querySelector('#shell-game-menu-action i');
    const sheetMenuIcon = document.querySelector('#navigation-sheet .secondary-btn i');
    const iconClass = isBomb ? 'fa-bomb' : 'fa-user-secret';

    [shellMenuIcon, sheetMenuIcon].forEach(icon => {
        if (!icon) return;
        icon.className = `fa-solid ${iconClass}`;
    });
}

const baseUpdateShellContext = updateShellContext;
updateShellContext = function bombAwareShellContext(screenName) {
    baseUpdateShellContext(screenName);
    const isBomb = screenName.startsWith('bomb-');
    const rulesLabel = document.querySelector('#shell-rules-action span');
    const menuLabel = document.querySelector('#shell-game-menu-action span');

    updateBombAwareNavigationIcons(isBomb);

    if (!isBomb) {
        if (rulesLabel) rulesLabel.textContent = 'Zasady Impostora';
        if (menuLabel) menuLabel.textContent = 'Menu Impostora';
        return;
    }

    const shellLogo = document.getElementById('shell-logo');
    if (shellLogo) {
        shellLogo.className = 'shell-logo is-game';
        shellLogo.innerHTML = '<i class="fa-solid fa-bomb" aria-hidden="true"></i>';
    }
    if (rulesLabel) rulesLabel.textContent = 'Zasady Tykającej Bomby';
    if (menuLabel) menuLabel.textContent = 'Menu Tykającej Bomby';
};

function openCurrentRules() {
    if (getActiveGameId() === 'ticking-bomb') openModal('bomb-rules-modal');
    else openModal('rules-modal');
}

function openCurrentScoreboard() {
    const gameId = getActiveGameId();
    openModal('score-modal');
    const title = document.getElementById('score-modal-title');
    if (gameId === 'ticking-bomb') {
        renderBombScoreboardModal();
    } else if (title) {
        title.textContent = 'Tabela wyników • Impostor';
    }
}

function resetCurrentScores() {
    if (getActiveGameId() === 'ticking-bomb') resetBombScores();
    else resetScores();
}

const baseSetupAppShell = setupAppShell;
setupAppShell = function bombAwareSetupShell() {
    baseSetupAppShell();
    const scoreAction = document.getElementById('shell-score-action');
    const rulesAction = document.getElementById('shell-rules-action');
    if (scoreAction) {
        scoreAction.removeAttribute('onclick');
        scoreAction.onclick = () => { closeShellMenu(); openCurrentScoreboard(); };
    }
    if (rulesAction) {
        rulesAction.removeAttribute('onclick');
        rulesAction.onclick = () => { closeShellMenu(); openCurrentRules(); };
    }
    const sheetMenu = document.querySelector('#navigation-sheet .secondary-btn span');
    if (sheetMenu) sheetMenu.textContent = 'Menu gry';
    updateBombAwareNavigationIcons(getActiveGameId() === 'ticking-bomb');
};

const baseRequestLeaveGame = requestLeaveGame;
requestLeaveGame = function bombAwareRequestLeave(destination = 'home') {
    if (getActiveGameId() !== 'ticking-bomb') return baseRequestLeaveGame(destination);
    closeShellMenu?.();
    if (isRoundInProgress()) {
        openNavigationSheet(destination);
        return;
    }
    stopAllBombAudio?.();
    goToScreen(destination === 'menu' ? 'bomb-menu' : 'home', { direction: 'back' });
};

const baseLeaveActiveRound = leaveActiveRound;
leaveActiveRound = function bombAwareLeaveRound(destination) {
    if (getActiveGameId() !== 'ticking-bomb') return baseLeaveActiveRound(destination);
    cancelBombRound({ silent: true });
    stopAllBombAudio?.();
    resetBombRoundState();
    closeNavigationSheet();
    setGameAwakeMode?.(false);
    goToScreen(destination === 'home' ? 'home' : 'bomb-menu', { direction: 'back' });
};

const baseToggleAudio = toggleAudio;
toggleAudio = function bombAwareToggleAudio() {
    baseToggleAudio();
    if (!soundEnabled) {
        stopAllBombAudio?.();
    } else if (getCurrentScreenName() === 'bomb-play' && bombRuntime?.active) {
        startBombTicking?.();
    }
};
