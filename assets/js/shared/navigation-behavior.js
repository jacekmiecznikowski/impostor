/* Mobile navigation behavior layered on top of shared/ui.js. */
(() => {
    if (typeof IMMERSIVE_SCREENS !== 'undefined') IMMERSIVE_SCREENS.delete('results');

    const originalUpdateShellContext = typeof updateShellContext === 'function'
        ? updateShellContext
        : null;

    if (!originalUpdateShellContext) return;

    const ACTIVE_ROUND_SCREENS = new Set(['pass', 'reveal', 'discussion', 'group-voting']);

    function syncMobileShellAction(screenName) {
        const button = document.getElementById('shell-more-btn');
        const icon = button?.querySelector('i');
        if (!button || !icon) return;

        const isActiveRound = ACTIVE_ROUND_SCREENS.has(screenName);
        button.classList.toggle('is-pause-action', isActiveRound);

        if (isActiveRound) {
            icon.className = 'fa-solid fa-pause';
            button.setAttribute('aria-label', 'Pauza');
            button.setAttribute('aria-expanded', 'false');
            button.onclick = () => openNavigationSheet('menu');
            closeShellMenu?.();
        } else {
            icon.className = 'fa-solid fa-ellipsis-vertical';
            button.setAttribute('aria-label', 'Więcej opcji');
            button.onclick = () => toggleShellMenu();
        }
    }

    updateShellContext = function mobileUpdateShellContext(screenName) {
        originalUpdateShellContext(screenName);
        syncMobileShellAction(screenName);
    };
})();
