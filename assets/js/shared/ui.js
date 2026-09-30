const IMMERSIVE_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting', 'results']);
const WAKE_LOCK_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting']);
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

function goToScreen(screenName, { silent = false } = {}) {
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (!targetScreen) {
        console.warn(`Nie znaleziono ekranu: ${screenName}`);
        return false;
    }

    if (!silent) playSound('click');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('flex');
    });

    targetScreen.classList.remove('hidden');
    targetScreen.classList.add('flex');
    updateShellContext(screenName);

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
    const isGameHub = screenName === 'home';
    const immersive = IMMERSIVE_SCREENS.has(screenName);
    const shell = document.getElementById('app-shell');
    const backButton = document.getElementById('shell-back-btn');
    const shellTitle = document.getElementById('shell-title');
    const shellSubtitle = document.getElementById('shell-subtitle');
    const shellLogo = document.getElementById('shell-logo');
    const scoreAction = document.getElementById('shell-score-action');
    const rulesAction = document.getElementById('shell-rules-action');
    const exitAction = document.getElementById('shell-exit-action');

    document.body.dataset.screen = screenName;
    shell?.classList.toggle('is-home', isGameHub);
    shell?.classList.toggle('is-game', !isGameHub);
    shell?.classList.toggle('is-immersive', immersive);

    if (backButton) {
        const showBackToHub = screenName === 'menu';
        backButton.classList.toggle('hidden', !showBackToHub);
        backButton.setAttribute('aria-label', 'Wróć do wyboru gier');
    }

    scoreAction?.classList.toggle('hidden', isGameHub);
    rulesAction?.classList.toggle('hidden', isGameHub);
    exitAction?.classList.toggle('hidden', isGameHub);

    if (shellTitle) shellTitle.textContent = isGameHub ? 'Partyjniak' : 'Impostor';
    if (shellSubtitle) shellSubtitle.textContent = isGameHub ? 'gry imprezowe' : 'Partyjniak';

    if (shellLogo) {
        shellLogo.className = `shell-logo${isGameHub ? '' : ' is-game'}`;
        shellLogo.replaceChildren();
        if (isGameHub) {
            const image = document.createElement('img');
            image.src = './assets/icons/icon.svg';
            image.alt = '';
            image.setAttribute('aria-hidden', 'true');
            shellLogo.appendChild(image);
        } else {
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-user-secret';
            icon.setAttribute('aria-hidden', 'true');
            shellLogo.appendChild(icon);
        }
    }

    closeShellMenu?.();
    setBackgroundMode?.(BACKGROUND_MODE_BY_SCREEN[screenName] || 'party');
    setGameAwakeMode?.(WAKE_LOCK_SCREENS.has(screenName));
}

function goToGameHub() {
    if (window.location.search) {
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    }
    goToScreen('home');
}

function openModal(modalId) {
    closeShellMenu?.();
    playSound('click');
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (modalId === 'score-modal') renderScoreboardModal();
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
