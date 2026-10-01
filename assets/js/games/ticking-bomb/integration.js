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
    'ticking-bomb': { colors: [0xf97316, 0xfbbf24, 0xea580c, 0xfb923c], alpha: [0.075, 0.21], speed: 0.78, confetti: false },
    'bomb-alert': { colors: [0xf97316, 0xef4444, 0xfbbf24, 0xfb923c], alpha: [0.10, 0.27], speed: 1.02, confetti: false }
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
    const rulesLabel = document.querySelector('#shell-rules-action span');
    const menuLabel = document.querySelector('#shell-game-menu-action span');

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
}

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
}

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
    const alertMode = modeName === 'bomb-alert';
    const bursts = alertMode
        ? [[.09, .18, 42], [.88, .28, 58], [.17, .72, 66], [.82, .82, 38]]
        : [[.10, .20, 34], [.87, .30, 48], [.18, .74, 56], [.80, .84, 30]];

    bursts.forEach(([xr, yr, radius], index) => {
        const x = w * xr;
        const y = h * yr;
        const warm = index % 2 === 0 ? 0xf97316 : 0xfbbf24;
        const hot = index % 2 === 0 ? 0xfbbf24 : 0xfb923c;
        const direction = index % 2 === 0 ? 1 : -1;
        const duration = (alertMode ? 4700 : 6200) + index * 520;

        const halo = scene.add.circle(x, y, radius * .64, warm, alertMode ? .018 : .010)
            .setStrokeStyle(alertMode ? 1.8 : 1.2, warm, alertMode ? .24 : .15);
        const shockwave = scene.add.circle(x, y, radius, hot, .002)
            .setStrokeStyle(alertMode ? 2.1 : 1.35, hot, alertMode ? .22 : .12);
        const burst = scene.add.star(x, y, 10, radius * .30, radius * .72, warm, alertMode ? .030 : .017)
            .setStrokeStyle(1, hot, alertMode ? .24 : .14)
            .setAngle(index * 13 - 8);

        addFloatingMotif(scene, halo, {
            x, y, dx: 10 * direction, dy: 14, duration: duration + 500, rotation: .025 * direction
        });
        addFloatingMotif(scene, shockwave, {
            x, y, dx: 12 * direction, dy: 18, duration: duration + 900, rotation: -.02 * direction
        });
        addFloatingMotif(scene, burst, {
            x, y, dx: 15 * direction, dy: 16, duration, rotation: .075 * direction
        });

        const shardCount = alertMode ? 5 : 3;
        for (let shardIndex = 0; shardIndex < shardCount; shardIndex += 1) {
            const angle = ((Math.PI * 2) / shardCount) * shardIndex + index * .45;
            const distance = radius * (.82 + (shardIndex % 2) * .22);
            const sx = x + Math.cos(angle) * distance;
            const sy = y + Math.sin(angle) * distance;
            const shard = scene.add.rectangle(
                sx,
                sy,
                shardIndex % 2 ? 13 : 18,
                shardIndex % 2 ? 2.2 : 3,
                shardIndex % 2 ? hot : warm,
                alertMode ? .24 : .15
            ).setAngle(angle * 180 / Math.PI);
            addFloatingMotif(scene, shard, {
                x: sx,
                y: sy,
                dx: Math.cos(angle) * 10,
                dy: Math.sin(angle) * 10 + 8,
                duration: duration - 350 + shardIndex * 180,
                rotation: .045 * direction
            });
        }
    });

    const sparkPositions = alertMode
        ? [[.31,.16],[.69,.13],[.56,.47],[.33,.58],[.67,.66],[.48,.87]]
        : [[.30,.15],[.70,.17],[.57,.48],[.34,.60],[.66,.67],[.50,.88]];

    sparkPositions.forEach(([xr, yr], index) => {
        const spark = scene.add.star(
            w * xr,
            h * yr,
            4,
            alertMode ? 2.2 : 1.6,
            alertMode ? 7 : 5.2,
            index % 2 ? 0xfbbf24 : 0xfb923c,
            alertMode ? .28 : .16
        ).setAngle(45 + index * 17);
        addFloatingMotif(scene, spark, {
            x: w * xr,
            y: h * yr,
            dx: index % 2 ? -9 : 9,
            dy: index % 3 === 0 ? -12 : 13,
            duration: (alertMode ? 3600 : 5200) + index * 310,
            rotation: index % 2 ? -.11 : .11
        });
    });
};
