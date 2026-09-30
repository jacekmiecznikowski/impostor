async function initializeContentLayer() {
    try {
        if (typeof initializeImpostorRemoteContent === 'function') {
            await initializeImpostorRemoteContent();
        }
    } catch (error) {
        console.warn('Zdalna warstwa treści nie została uruchomiona. Używam danych lokalnych.', error);
    }
}

async function initializeApp() {
    await initializeContentLayer();
    setupGameHub();
    setupImpostorPresentation();
    loadSession();
    normalizeActiveCategories();

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
            closeShellMenu?.();
            document.querySelectorAll('[id$="-modal"].flex').forEach(modal => closeModal(modal.id));
        }
    });

    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    document.addEventListener('pointerdown', event => {
        const popover = document.getElementById('shell-menu-popover');
        const button = document.getElementById('shell-more-btn');
        if (!popover || popover.classList.contains('hidden')) return;
        if (!popover.contains(event.target) && !button?.contains(event.target)) closeShellMenu?.();
    }, { passive: true });

    const requestedGame = new URLSearchParams(window.location.search).get('game');
    if (requestedGame && GAME_CATALOG.some(game => game.id === requestedGame && game.status === 'available')) {
        openGame(requestedGame, { silent: true });
    } else {
        goToScreen('home', { silent: true });
    }

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(error => {
                console.warn('Service Worker nie został zarejestrowany:', error);
            });
        }, { once: true });
    }
}

document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
