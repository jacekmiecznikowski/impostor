const loadedGameAssetUrls = new Set();
const pendingGameAssetLoads = new Map();

function normalizeGameAssetUrl(url) {
    return new URL(url, document.baseURI).href;
}

function loadGameStylesheet(url) {
    const normalized = normalizeGameAssetUrl(url);
    if (loadedGameAssetUrls.has(normalized)) return Promise.resolve();
    if (pendingGameAssetLoads.has(normalized)) return pendingGameAssetLoads.get(normalized);

    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .find(link => link.href === normalized);
    if (existing) {
        loadedGameAssetUrls.add(normalized);
        return Promise.resolve();
    }

    const load = new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error(`Nie udało się załadować stylu ${url}.`));
        document.head.appendChild(link);
    });

    pendingGameAssetLoads.set(normalized, load);
    return load.then(() => {
        loadedGameAssetUrls.add(normalized);
    }).finally(() => pendingGameAssetLoads.delete(normalized));
}

function loadGameScript(url) {
    const normalized = normalizeGameAssetUrl(url);
    if (loadedGameAssetUrls.has(normalized)) return Promise.resolve();
    if (pendingGameAssetLoads.has(normalized)) return pendingGameAssetLoads.get(normalized);

    const existing = [...document.scripts].find(script => script.src === normalized);
    if (existing) {
        loadedGameAssetUrls.add(normalized);
        return Promise.resolve();
    }

    const load = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Nie udało się załadować skryptu ${url}.`));
        document.head.appendChild(script);
    });

    pendingGameAssetLoads.set(normalized, load);
    return load.then(() => {
        loadedGameAssetUrls.add(normalized);
    }).finally(() => pendingGameAssetLoads.delete(normalized));
}

async function loadGameAssets(gameOrId) {
    const gameModule = typeof gameOrId === 'string' ? getGameModule?.(gameOrId) : gameOrId;
    if (!gameModule) throw new Error('Nie znaleziono modułu gry do załadowania assetów.');

    const styles = Array.isArray(gameModule.assets?.styles) ? gameModule.assets.styles : [];
    const scripts = Array.isArray(gameModule.assets?.scripts) ? gameModule.assets.scripts : [];
    await Promise.all(styles.map(loadGameStylesheet));
    for (const script of scripts) await loadGameScript(script);
}
