const IMMERSIVE_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting', 'results']);
const ROUND_GUARDED_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting']);
const WAKE_LOCK_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting']);
const SCREEN_BACK_TARGET = {
    menu: 'home',
    'setup-count': 'menu',
    'setup-names': 'setup-count',
    'setup-options': 'setup-names',
    results: 'menu'
};
const SHELL_CONTEXT_BY_SCREEN = {
    home: { title: 'Partyjniak', subtitle: 'gry imprezowe', mode: 'home' },
    menu: { title: 'Impostor', subtitle: 'Menu gry', mode: 'menu' },
    'setup-count': { title: 'Liczba graczy', subtitle: 'Impostor • krok 1 z 3', mode: 'contextual' },
    'setup-names': { title: 'Imiona graczy', subtitle: 'Impostor • krok 2 z 3', mode: 'contextual' },
    'setup-options': { title: 'Ustawienia rundy', subtitle: 'Impostor • krok 3 z 3', mode: 'contextual' },
    pass: { title: 'Impostor', subtitle: 'Rozgrywka', mode: 'immersive' },
    reveal: { title: 'Impostor', subtitle: 'Rozgrywka', mode: 'immersive' },
    discussion: { title: 'Impostor', subtitle: 'Dyskusja', mode: 'immersive' },
    'group-voting': { title: 'Impostor', subtitle: 'Głosowanie', mode: 'immersive' },
    results: { title: 'Impostor', subtitle: 'Wynik rundy', mode: 'immersive' }
};
const BACKGROUND_MODE_BY_SCREEN = {
    home: 'party',
    menu: 'impostor',
    'setup-count': 'impostor',
    'setup-names': 'impostor',
    'setup-options': 'impostor',
    pass: 'mystery',
    reveal: 'mystery',
    discussion: 'discussion',
    'group-voting': 'vote',
    results: 'celebrate'
};

let systemBackGuardArmed = false;
let suppressNextPopState = false;

function getCurrentScreenName() {
    return document.body.dataset.screen || 'home';
}

function isRoundInProgress() {
    return ROUND_GUARDED_SCREENS.has(getCurrentScreenName());
}

function animateScreenEntry(screen, direction) {
    if (!screen || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    screen.classList.remove('screen-enter-forward', 'screen-enter-back');
    void screen.offsetWidth;
    const className = direction === 'back' ? 'screen-enter-back' : 'screen-enter-forward';
    screen.classList.add(className);
    screen.addEventListener('animationend', () => screen.classList.remove(className), { once: true });
}

function goToScreen(screenName, { silent = false, direction = 'forward' } = {}) {
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (!targetScreen) {
        console.warn(`Nie znaleziono ekranu: ${screenName}`);
        return false;
    }

    const previousScreen = getCurrentScreenName();
    const previousGameId = getGameIdForScreen(previousScreen);
    if (previousScreen !== screenName && previousGameId !== 'home') {
        callGameHook(previousGameId, 'onScreenLeave', previousScreen, screenName);
    }

    if (!silent && previousScreen !== screenName) playSound('click');

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('flex', 'screen-enter-forward', 'screen-enter-back');
    });

    targetScreen.classList.remove('hidden');
    targetScreen.classList.add('flex');
    animateScreenEntry(targetScreen, direction);

    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;

    updateShellContext(screenName);
    syncSystemBackGuard(screenName);

    if (screenName === 'setup-options') {
        renderCategoriesGrid();
        updateImpostorButtonsUI();
    } else if (screenName === 'discussion' && state.players.length > 0) {
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
    } else if (screenName === 'group-voting') {
        renderGroupVotingScreen();
    }

    return true;
}

function updateShellContext(screenName) {
    const context = SHELL_CONTEXT_BY_SCREEN[screenName] || SHELL_CONTEXT_BY_SCREEN.home;
    const gameId = getGameIdForScreen(screenName);
    const gameModule = gameId === 'home' ? null : getGameModule(gameId);
    const isHome = screenName === 'home';
    const immersive = IMMERSIVE_SCREENS.has(screenName);
    const shell = document.getElementById('app-shell');
    const backButton = document.getElementById('shell-back-btn');
    const shellTitle = document.getElementById('shell-title');
    const shellSubtitle = document.getElementById('shell-subtitle');
    const shellLogo = document.getElementById('shell-logo');
    const scoreAction = document.getElementById('shell-score-action');
    const rulesAction = document.getElementById('shell-rules-action');
    const gameMenuAction = document.getElementById('shell-game-menu-action');
    const exitAction = document.getElementById('shell-exit-action');

    document.body.dataset.screen = screenName;
    document.body.dataset.game = gameId;
    shell?.setAttribute('data-mode', context.mode);
    shell?.classList.toggle('is-home', isHome);
    shell?.classList.toggle('is-game', !isHome);
    shell?.classList.toggle('is-immersive', immersive);
    shell?.classList.toggle('is-contextual', context.mode === 'contextual');
    shell?.classList.toggle('is-menu', context.mode === 'menu');

    if (backButton) {
        const canGoBack = Boolean(SCREEN_BACK_TARGET[screenName]) && !immersive;
        backButton.classList.toggle('hidden', !canGoBack);
        backButton.setAttribute('aria-label', screenName === gameModule?.menuScreen ? 'Wróć do wyboru gier' : 'Wróć');
    }

    scoreAction?.classList.toggle('hidden', isHome || typeof gameModule?.renderScoreboard !== 'function');
    rulesAction?.classList.toggle('hidden', isHome || !gameModule?.rulesModalId);
    gameMenuAction?.classList.toggle('hidden', isHome || screenName === gameModule?.menuScreen);
    exitAction?.classList.toggle('hidden', isHome);

    if (shellTitle) shellTitle.textContent = context.title;
    if (shellSubtitle) shellSubtitle.textContent = context.subtitle;

    if (shellLogo) {
        shellLogo.className = `shell-logo${isHome ? '' : ' is-game'}`;
        shellLogo.replaceChildren();
        if (isHome) {
            const image = document.createElement('img');
            image.src = './assets/icons/icon.svg';
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            shellLogo.appendChild(image);
        } else {
            const icon = document.createElement('i');
            icon.className = `fa-solid ${gameModule?.shellIcon || 'fa-gamepad'}`;
            icon.setAttribute('aria-hidden', 'true');
            shellLogo.appendChild(icon);
        }
    }

    const rulesLabel = document.querySelector('#shell-rules-action span');
    const menuLabel = document.querySelector('#shell-game-menu-action span');
    if (rulesLabel) rulesLabel.textContent = gameModule?.shellLabels?.rules || 'Zasady gry';
    if (menuLabel) menuLabel.textContent = gameModule?.shellLabels?.menu || 'Menu gry';

    const sheetMenuButton = document.querySelector('#navigation-sheet .secondary-btn');
    const sheetMenuIcon = sheetMenuButton?.querySelector('i');
    const sheetMenuLabel = sheetMenuButton?.querySelector('span');
    if (sheetMenuIcon) sheetMenuIcon.className = `fa-solid ${gameModule?.shellIcon || 'fa-gamepad'}`;
    if (sheetMenuLabel) sheetMenuLabel.textContent = gameModule?.shellLabels?.menu || 'Menu gry';

    closeShellMenu?.();
    setBackgroundMode?.(BACKGROUND_MODE_BY_SCREEN[screenName] || 'party');
    setGameAwakeMode?.(WAKE_LOCK_SCREENS.has(screenName));
}

function navigateBack({ fromSystem = false } = {}) {
    const openSheet = document.getElementById('navigation-sheet');
    if (openSheet && !openSheet.classList.contains('hidden')) {
        closeNavigationSheet();
        return true;
    }

    const openModalElement = [...document.querySelectorAll('[id$="-modal"].flex')].at(-1);
    if (openModalElement) {
        closeModal(openModalElement.id);
        return true;
    }

    const popover = document.getElementById('shell-menu-popover');
    if (popover && !popover.classList.contains('hidden')) {
        closeShellMenu?.();
        return true;
    }

    const currentScreen = getCurrentScreenName();
    if (ROUND_GUARDED_SCREENS.has(currentScreen)) {
        openNavigationSheet();
        return true;
    }

    const target = SCREEN_BACK_TARGET[currentScreen];
    if (target) {
        goToScreen(target, { direction: 'back' });
        return true;
    }

    return !fromSystem;
}

function requestLeaveGame(destination = 'home') {
    closeShellMenu?.();
    const gameModule = getActiveGameModule();
    callGameHook(gameModule, 'beforeLeave', destination);

    if (isRoundInProgress()) {
        openNavigationSheet(destination);
        return;
    }

    const target = destination === 'menu' ? gameModule?.menuScreen : 'home';
    goToScreen(target || 'home', { direction: 'back' });
}

function clearTransientRoundState() {
    if (typeof state !== 'object' || !state) return;
    state.currentTurnPlayerIndex = 0;
    state.secretWord = '';
    state.secretHint = '';
    state.impostorIds = [];
    state.playerRoles = {};
    state.startingPlayerName = '';
    state.selectedVotedPlayerId = null;
    if (typeof resetRevealCardPresentation === 'function') resetRevealCardPresentation();
}

function leaveActiveRound(destination) {
    const gameModule = getActiveGameModule();
    if (typeof gameModule?.leaveRound === 'function') {
        gameModule.leaveRound(destination);
        return;
    }

    clearTransientRoundState();
    closeNavigationSheet();
    setGameAwakeMode?.(false);
    goToScreen(destination === 'home' ? 'home' : (gameModule?.menuScreen || 'home'), { direction: 'back' });
}

function openNavigationSheet(preferredDestination = 'menu') {
    const sheet = document.getElementById('navigation-sheet');
    if (!sheet) return;
    sheet.dataset.preferredDestination = preferredDestination;
    sheet.classList.remove('hidden');
    sheet.classList.add('flex');
    closeShellMenu?.();
    requestAnimationFrame(() => sheet.querySelector('[data-sheet-primary]')?.focus());
}

function closeNavigationSheet() {
    const sheet = document.getElementById('navigation-sheet');
    if (!sheet) return;
    sheet.classList.add('hidden');
    sheet.classList.remove('flex');
}

function armSystemBackGuard() {
    if (systemBackGuardArmed || getCurrentScreenName() === 'home') return;
    try {
        window.history.pushState({ partyjniakBackGuard: true }, '', window.location.href);
        systemBackGuardArmed = true;
    } catch (_) {}
}

function disarmSystemBackGuard() {
    if (!systemBackGuardArmed) return;
    systemBackGuardArmed = false;
    suppressNextPopState = true;
    try {
        window.history.back();
    } catch (_) {
        suppressNextPopState = false;
    }
}

function syncSystemBackGuard(screenName) {
    if (screenName === 'home') disarmSystemBackGuard();
    else armSystemBackGuard();
}

function setupSystemBackHandling() {
    window.addEventListener('popstate', () => {
        if (suppressNextPopState) {
            suppressNextPopState = false;
            return;
        }

        systemBackGuardArmed = false;
        const handled = navigateBack({ fromSystem: true });
        if (handled && getCurrentScreenName() !== 'home') {
            queueMicrotask(armSystemBackGuard);
        }
    });
}

function goToGameHub() {
    requestLeaveGame('home');
}

function openModal(modalId) {
    closeShellMenu?.();
    playSound('click');
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (modalId === 'score-modal') {
        const gameModule = getActiveGameModule();
        if (typeof gameModule?.renderScoreboard === 'function') gameModule.renderScoreboard();
        else renderScoreboardModal?.();
    }
    requestAnimationFrame(() => modal.querySelector('button')?.focus());
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    playSound('click');
}

function showToast(title, message, iconClass = 'fa-solid fa-circle-exclamation') {
    closeShellMenu?.();
    const titleElement = document.getElementById('toast-title');
    const messageElement = document.getElementById('toast-message');
    const iconWrapper = document.getElementById('toast-icon');
    if (titleElement) titleElement.innerText = title;
    if (messageElement) messageElement.innerText = message;
    if (iconWrapper) {
        const icon = document.createElement('i');
        icon.className = iconClass;
        iconWrapper.replaceChildren(icon);
    }
    const modal = document.getElementById('toast-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    playSound('click');
}
