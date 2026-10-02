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
        target.appendChild(template.content.cloneNode(true));
    }
}
