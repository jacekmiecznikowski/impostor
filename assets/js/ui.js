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
    const toolbar = document.getElementById('game-toolbar');
    const shellTitle = document.getElementById('shell-title');
    const shellSubtitle = document.getElementById('shell-subtitle');
    const shellLogo = document.getElementById('shell-logo');

    if (toolbar) {
        toolbar.classList.toggle('hidden', isGameHub);
        toolbar.classList.toggle('flex', !isGameHub);
    }

    if (shellTitle) shellTitle.innerText = isGameHub ? 'Party Games' : 'Impostor';
    if (shellSubtitle) shellSubtitle.innerText = isGameHub ? 'Wybierz grę' : 'Party Game';

    if (shellLogo) {
        shellLogo.className = isGameHub
            ? 'w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-rose-500 flex items-center justify-center shadow-lg'
            : 'w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg';
        shellLogo.replaceChildren();
        const icon = document.createElement('i');
        icon.className = isGameHub ? 'fa-solid fa-dice text-white' : 'fa-solid fa-user-secret text-white';
        shellLogo.appendChild(icon);
    }
}

function goToGameHub() {
    goToScreen('home');
}

function openModal(modalId) {
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
