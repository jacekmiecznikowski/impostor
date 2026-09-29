function initializeApp() {
    loadSession();

    const slider = document.getElementById('player-slider');
    const playerCount = document.getElementById('player-count-big');
    if (slider) slider.value = state.playerCount;
    if (playerCount) playerCount.innerText = state.playerCount;

    const audioIcon = document.getElementById('audio-icon');
    if (audioIcon) audioIcon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';

    updateHintModeUI();
    setDiscussionTimer(state.discussionTime, { silent: true });
    updateImpostorButtonsUI();
    updateResumeButton();

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            document.querySelectorAll('[id$="-modal"].flex').forEach(modal => closeModal(modal.id));
        }
    });

    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(error => {
                console.warn('Service Worker nie został zarejestrowany:', error);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
