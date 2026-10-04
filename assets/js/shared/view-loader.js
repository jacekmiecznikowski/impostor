const SHARED_VIEW_FRAGMENTS = [
    { target: '#modal-root', url: './views/modals.html' }
];

const loadedViewUrls = new Set();
const pendingViewLoads = new Map();

async function loadViewFragment(fragment) {
    if (!fragment?.target || !fragment?.url) return;
    if (loadedViewUrls.has(fragment.url)) return;
    if (pendingViewLoads.has(fragment.url)) return pendingViewLoads.get(fragment.url);

    const load = (async () => {
        const target = document.querySelector(fragment.target);
        if (!target) throw new Error(`Brak kontenera widoku: ${fragment.target}`);

        const response = await fetch(fragment.url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`Nie udało się załadować widoku ${fragment.url} (HTTP ${response.status})`);

        const template = document.createElement('template');
        template.innerHTML = await response.text();
        const content = template.content.cloneNode(true);
        content.querySelectorAll?.('.screen').forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('flex');
        });
        target.appendChild(content);
        loadedViewUrls.add(fragment.url);
    })();

    pendingViewLoads.set(fragment.url, load);
    try {
        await load;
    } finally {
        pendingViewLoads.delete(fragment.url);
    }
}

async function loadAppViews() {
    await Promise.all(SHARED_VIEW_FRAGMENTS.map(loadViewFragment));
}

async function loadGameViews(gameOrId) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule?.(gameOrId) : gameOrId;
    if (!gameModule) throw new Error('Nie znaleziono modułu gry do załadowania widoków.');
    await Promise.all((gameModule.views || []).map(loadViewFragment));
}
