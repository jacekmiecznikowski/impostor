/* Mobile navigation behavior layered on top of shared/ui.js. */
function syncMobileShellAction(screenName) {
    const button = document.getElementById('shell-more-btn');
    const icon = button?.querySelector('i');
    if (!button || !icon) return;

    const screenConfig = screenName === 'home' ? null : getGameScreenConfig?.(screenName);
    const isActiveRound = Boolean(screenConfig?.roundGuard);
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

const mobileNavigationObserver = new MutationObserver(() => {
    syncMobileShellAction(document.body.dataset.screen || 'home');
});

mobileNavigationObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-screen']
});
