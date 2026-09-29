function goToScreen(screenName) {
    playSound('click');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('flex');
    }

    if (screenName === 'setup-options') {
        renderCategoriesGrid();
        updateImpostorButtonsUI();
    } else if (screenName === 'discussion' && state.players.length > 0) {
        const randomPlayer = state.players[Math.floor(Math.random() * state.players.length)];
        state.startingPlayerName = randomPlayer.name;
        document.getElementById('starting-player-name').innerText = randomPlayer.name;

        const randomTip = DISCUSSION_TIPS[Math.floor(Math.random() * DISCUSSION_TIPS.length)];
        document.getElementById('discussion-tip').innerText = `"${randomTip}"`;

        setupDiscussionTimer();
    } else if (screenName === 'group-voting') {
        renderGroupVotingScreen();
    }
}

function openModal(modalId) {
    playSound('click');
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        if (modalId === 'score-modal') renderScoreboardModal();
    }
}

function closeModal(modalId) {
    playSound('click');
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
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
