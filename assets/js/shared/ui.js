const IMMERSIVE_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting', 'results']);
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
    if (!silent) playSound('click');

    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('flex');
    });

    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('flex');
    }

    updateShellContext(screenName);

    if (screenName === 'setup-options') {
        renderCategoriesGrid();
        updateImpostorButtonsUI();
    } else if (screenName === 'discussion' && state.players.length > 0) {
        const randomPlayer = state.players[Math.floor(Math.random() * state.players.length)];
        state.startingPlayerName = randomPlayer.name;
        document.getElementById('starting-player-name').innerText = randomPlayer.name;

        const randomTip = DISCUSSION_TIPS[Math.floor(Math.random() * DISCUSSION_TIPS.length)];
        document.getElementById('discussion-tip').innerText = `“${randomTip}”`;
        setupDiscussionTimer();
    } else if (screenName === 'group-voting') {
        renderGroupVotingScreen();
    }
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
        backButton.classList.toggle('hidden', isGameHub);
        backButton.setAttribute('aria-label', 'Wróć do wyboru gier');
    }

    if (scoreAction) scoreAction.classList.toggle('hidden', isGameHub);
    if (rulesAction) rulesAction.classList.toggle('hidden', isGameHub);
    if (exitAction) exitAction.classList.toggle('hidden', isGameHub);

    if (shellTitle) shellTitle.textContent = isGameHub ? 'Partyjniak' : 'Impostor';
    if (shellSubtitle) shellSubtitle.textContent = isGameHub ? 'gry imprezowe' : 'Partyjniak';

    if (shellLogo) {
        shellLogo.className = `shell-logo${isGameHub ? '' : ' is-game'}`;
        if (isGameHub) {
            shellLogo.innerHTML = '<img src="./assets/icons/icon.svg" alt="" aria-hidden="true">';
        } else {
            shellLogo.innerHTML = '<i class="fa-solid fa-user-secret" aria-hidden="true"></i>';
        }
    }

    closeShellMenu();
    if (typeof setBackgroundMode === 'function') setBackgroundMode(BACKGROUND_MODE_BY_SCREEN[screenName] || 'party');
    if (typeof setGameAwakeMode === 'function') setGameAwakeMode(!isGameHub);
}

function goToGameHub() {
    if (window.location.search) {
        window.history.replaceState({}, '', `${window.location.pathname}${window.location.hash}`);
    }
    goToScreen('home');
}

function openModal(modalId) {
    closeShellMenu();
    playSound('click');
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    if (modalId === 'score-modal') renderScoreboardModal();
}

function closeModal(modalId) {
    playSound('click');
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function showToast(title, message, iconClass = 'fa-solid fa-circle-exclamation') {
    document.getElementById('toast-title').innerText = title;
    document.getElementById('toast-message').innerText = message;
    const iconWrapper = document.getElementById('toast-icon');
    const icon = document.createElement('i');
    icon.className = iconClass;
    iconWrapper.replaceChildren(icon);
    const modal = document.getElementById('toast-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    playSound('click');
}
