const SHARED_VIEW_FRAGMENTS = [
    { target: '#modal-root', url: './views/modals.html' }
];

async function loadAppViews() {
    const gameFragments = typeof getGameViewFragments === 'function' ? getGameViewFragments() : [];
    const fragments = [...gameFragments, ...SHARED_VIEW_FRAGMENTS];

    for (const fragment of fragments) {
        const target = document.querySelector(fragment.target);
        if (!target) throw new Error(`Brak kontenera widoku: ${fragment.target}`);

        const response = await fetch(fragment.url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Nie udało się załadować widoku ${fragment.url} (HTTP ${response.status})`);

        const template = document.createElement('template');
        template.innerHTML = await response.text();
        const content = template.content.cloneNode(true);

        // Every game view starts hidden. The bootstrap decides which screen becomes
        // visible through goToScreen(), preventing a first-loaded game fragment from
        // flashing briefly before the Partyjniak home screen is initialized.
        content.querySelectorAll?.('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('flex');
        });

        target.appendChild(content);
    }
}
