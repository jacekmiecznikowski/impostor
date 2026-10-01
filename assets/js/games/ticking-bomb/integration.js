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
Object.assign(BACKGROUND_MODES, {
    'ticking-bomb': { colors: [0xf97316, 0xfbbf24, 0xea580c, 0xfef3c7], alpha: [0.065, 0.19], speed: 0.74, confetti: false },
    'bomb-alert': { colors: [0xf97316, 0xef4444, 0xfbbf24, 0xfef3c7], alpha: [0.08, 0.23], speed: 0.94, confetti: false }
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
    if (screenName.startsWith('bomb-')) document.body.dataset.game = 'ticking-bomb';
    else if (screenName === 'home') document.body.dataset.game = 'home';
    else document.body.dataset.game = 'impostor';
    return baseGoToScreen(screenName, options);
};

const baseSetupGameHub = setupGameHub;
setupGameHub = function partyjniakSetupHub() {
    baseSetupGameHub();
    const bombCard = [...document.querySelectorAll('.game-card-primary')]
        .find(card => card.querySelector('strong')?.textContent?.trim() === 'Tykająca Bomba');
    if (bombCard && bombCard.dataset.bombThemeReady !== 'true') {
        bombCard.dataset.bombThemeReady = 'true';
        bombCard.dataset.gameId = 'ticking-bomb';
        bombCard.style.setProperty('--game-accent', '#f97316');
        bombCard.style.setProperty('--game-rgb', '249, 115, 22');
        const preview = () => getCurrentScreenName() === 'home' && setBackgroundMode('ticking-bomb');
        const restore = () => getCurrentScreenName() === 'home' && setBackgroundMode('party');
        bombCard.addEventListener('pointerenter', preview);
        bombCard.addEventListener('focus', preview);
        bombCard.addEventListener('pointerleave', restore);
        bombCard.addEventListener('blur', restore);
    }

    const about = document.querySelector('#about-modal .text-sm');
    if (about) about.innerHTML = '<p><strong>Partyjniak</strong> to kolekcja mobilnych gier imprezowych na jeden telefon.</p><p>Dostępne gry: <strong>Impostor</strong> i <strong>Tykająca Bomba</strong>. Kolejne tryby będą korzystać z tego samego wspólnego huba.</p>';

    const resetButton = document.querySelector('#score-modal .secondary-btn');
    if (resetButton) {
        resetButton.removeAttribute('onclick');
        resetButton.onclick = resetCurrentScores;
    }
    const scoreTitle = document.querySelector('#score-modal h3');
    if (scoreTitle) scoreTitle.id = 'score-modal-title';
}

const baseUpdateShellContext = updateShellContext;
updateShellContext = function bombAwareShellContext(screenName) {
    baseUpdateShellContext(screenName);
    const isBomb = screenName.startsWith('bomb-');
    if (!isBomb) return;

    const shellLogo = document.getElementById('shell-logo');
    if (shellLogo) {
        shellLogo.className = 'shell-logo is-game';
        shellLogo.innerHTML = '<i class="fa-solid fa-bomb" aria-hidden="true"></i>';
    }
    const rulesLabel = document.querySelector('#shell-rules-action span');
    if (rulesLabel) rulesLabel.textContent = 'Zasady Tykającej Bomby';
    const menuLabel = document.querySelector('#shell-game-menu-action span');
    if (menuLabel) menuLabel.textContent = 'Menu Tykającej Bomby';
}

function openCurrentRules() {
    if (getActiveGameId() === 'ticking-bomb') openModal('bomb-rules-modal');
    else openModal('rules-modal');
}

function openCurrentScoreboard() {
    openModal('score-modal');
    if (getActiveGameId() === 'ticking-bomb') renderBombScoreboardModal();
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
}

const baseRequestLeaveGame = requestLeaveGame;
requestLeaveGame = function bombAwareRequestLeave(destination = 'home') {
    if (getActiveGameId() !== 'ticking-bomb') return baseRequestLeaveGame(destination);
    closeShellMenu?.();
    if (isRoundInProgress()) {
        openNavigationSheet(destination);
        return;
    }
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

const baseApplyThemeMeta = applyPartyjniakThemeMeta;
applyPartyjniakThemeMeta = function bombAwareThemeMeta(modeName) {
    baseApplyThemeMeta(modeName);
    if (!['ticking-bomb', 'bomb-alert'].includes(modeName)) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    document.body.dataset.bgMode = modeName;
    if (meta) meta.setAttribute('content', modeName === 'bomb-alert' ? '#7f1d1d' : '#7c2d12');
};

const baseRenderThemeMotifs = renderPartyjniakThemeMotifs;
renderPartyjniakThemeMotifs = function bombAwareThemeMotifs(modeName) {
    if (!['ticking-bomb', 'bomb-alert'].includes(modeName)) return baseRenderThemeMotifs(modeName);
    const scene = typeof backgroundScene !== 'undefined' ? backgroundScene : null;
    if (!scene || !scene.add || motifMode === modeName) return;
    motifMode = modeName;
    clearPartyjniakThemeMotifs();
    if (scene.reducedMotion) return;
    const w = scene.scale.width;
    const h = scene.scale.height;
    [[.12,.22,48],[.88,.31,66],[.74,.82,42]].forEach(([xr,yr,r], index) => {
        const ring = scene.add.circle(w*xr,h*yr,r,0xf97316,.003).setStrokeStyle(1.2,index===1?0xfbbf24:0xf97316,.13);
        addFloatingMotif(scene, ring, { x:w*xr, y:h*yr, dx:index%2?-15:13, dy:18, duration:6200+index*700 });
        const spark = scene.add.rectangle(w*xr+r*.72,h*yr-r*.72,18,2,index===1?0xfde047:0xfb923c,.18).setAngle(-38+index*18);
        addFloatingMotif(scene, spark, { x:spark.x, y:spark.y, dx:index%2?-11:9, dy:12, duration:4800+index*500, rotation:.04 });
    });
};
