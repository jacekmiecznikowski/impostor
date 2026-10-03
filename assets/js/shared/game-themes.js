const PARTYJNIAK_HOME_THEME = Object.freeze({
    palette: {
        accent: '#950f26',
        strong: '#720b1d',
        alt: '#d9465f',
        text: '#fda4af',
        contrast: '#ffffff',
        rgb: '149, 15, 38',
        surfaceRgb: '76, 5, 20'
    },
    previewBackground: 'party',
    backgrounds: {
        party: {
            family: 'home',
            colors: [0x950f26, 0xd9465f, 0x8b5cf6, 0xf8fafc],
            alpha: [0.04, 0.16],
            speed: 0.82,
            confetti: false,
            motif: 'party',
            overlayMotif: 'party-aurora',
            metaColor: '#950f26',
            pageBase: '#06050a',
            pageGlowRgb: '149, 15, 38',
            pageGlowAltRgb: '217, 70, 95',
            pageGlowAlpha: '.25',
            pageGlowAltAlpha: '.065'
        }
    }
});

let themesInitialized = false;
let activeBackgroundFamily = null;

function getPartyjniakGameTheme(gameId) {
    if (!gameId || gameId === 'home') return PARTYJNIAK_HOME_THEME;
    return getGameModule?.(gameId)?.theme || null;
}

function registerPartyjniakBackgroundModes() {
    Object.entries(PARTYJNIAK_HOME_THEME.backgrounds).forEach(([modeName, config]) => {
        BACKGROUND_MODES[modeName] = { ...config, family: 'home' };
    });

    const catalog = typeof getGameCatalog === 'function' ? getGameCatalog() : [];
    catalog.forEach(entry => {
        const backgrounds = getGameModule?.(entry.id)?.theme?.backgrounds;
        if (!backgrounds || typeof backgrounds !== 'object') return;
        Object.entries(backgrounds).forEach(([modeName, config]) => {
            BACKGROUND_MODES[modeName] = { ...config, family: entry.id };
        });
    });
}

function setThemeVariable(name, value) {
    if (value == null || !document.body) return;
    document.body.style.setProperty(name, String(value));
}

function applyPartyjniakGameTheme(gameId) {
    const theme = getPartyjniakGameTheme(gameId) || PARTYJNIAK_HOME_THEME;
    const palette = theme.palette || PARTYJNIAK_HOME_THEME.palette;
    document.body.dataset.themeGame = gameId || 'home';
    setThemeVariable('--ui-accent', palette.accent);
    setThemeVariable('--ui-accent-strong', palette.strong);
    setThemeVariable('--ui-accent-alt', palette.alt);
    setThemeVariable('--ui-accent-text', palette.text);
    setThemeVariable('--ui-accent-contrast', palette.contrast);
    setThemeVariable('--ui-accent-rgb', palette.rgb);
    setThemeVariable('--ui-accent-surface-rgb', palette.surfaceRgb);
}

function applyPartyjniakBackgroundMeta(modeName) {
    const mode = BACKGROUND_MODES[modeName] || BACKGROUND_MODES.party;
    const family = mode.family || modeName;
    const meta = document.querySelector('meta[name="theme-color"]');
    document.body.dataset.bgMode = modeName;
    document.body.dataset.bgFamily = family;

    // Page glows and base color are part of the same persistent game background.
    // Do not recolor them on every screen transition inside one game.
    if (activeBackgroundFamily === family) return;
    activeBackgroundFamily = family;

    setThemeVariable('--page-bg', mode.pageBase || '#020617');
    setThemeVariable('--page-glow-rgb', mode.pageGlowRgb || '15, 23, 42');
    setThemeVariable('--page-glow-alt-rgb', mode.pageGlowAltRgb || mode.pageGlowRgb || '15, 23, 42');
    setThemeVariable('--page-glow-alpha', mode.pageGlowAlpha || '.12');
    setThemeVariable('--page-glow-alt-alpha', mode.pageGlowAltAlpha || '.045');
    if (meta) meta.setAttribute('content', mode.metaColor || '#020617');
}

function assignCatalogCardIds() {
    const catalog = typeof getGameCatalog === 'function' ? getGameCatalog() : [];
    const available = catalog.filter(game => game.status === 'available');
    const prototypes = catalog.filter(game => game.status !== 'available');

    document.querySelectorAll('.game-card-primary').forEach((card, index) => {
        if (!card.dataset.gameId && available[index]) card.dataset.gameId = available[index].id;
    });
    document.querySelectorAll('.upcoming-card').forEach((card, index) => {
        if (!card.dataset.gameId && prototypes[index]) card.dataset.gameId = prototypes[index].id;
    });
}

function decorateGameCards() {
    assignCatalogCardIds();
    document.querySelectorAll('[data-game-id]').forEach(card => {
        const gameId = card.dataset.gameId;
        const theme = getPartyjniakGameTheme(gameId);
        const palette = theme?.palette;
        if (!palette) return;

        card.style.setProperty('--game-accent', palette.accent);
        card.style.setProperty('--game-rgb', palette.rgb);
        card.style.setProperty('--game-text', palette.text);
        if (card.dataset.themeReady === 'true') return;
        card.dataset.themeReady = 'true';

        const preview = () => {
            if (getCurrentScreenName?.() !== 'home') return;
            setBackgroundMode(theme.previewBackground || 'party');
        };
        const restore = () => {
            if (getCurrentScreenName?.() !== 'home') return;
            setBackgroundMode('party');
        };
        card.addEventListener('pointerenter', preview);
        card.addEventListener('focus', preview);
        card.addEventListener('pointerleave', restore);
        card.addEventListener('blur', restore);
    });
}

const baseSetBackgroundMode = setBackgroundMode;
setBackgroundMode = function themedSetBackgroundMode(modeName) {
    baseSetBackgroundMode(modeName);
    applyPartyjniakBackgroundMeta(backgroundMode);
};

function initializePartyjniakThemes() {
    if (themesInitialized) return;
    themesInitialized = true;
    document.getElementById('phaser-bg')?.style.setProperty('opacity', '.94', 'important');
    registerPartyjniakBackgroundModes();
    applyPartyjniakGameTheme('home');
    setBackgroundMode('party');
    queueMicrotask(decorateGameCards);
}

const themeObserver = new MutationObserver(mutations => {
    if (!themesInitialized) return;
    if (mutations.some(mutation => mutation.type === 'attributes' && mutation.attributeName === 'data-game')) {
        applyPartyjniakGameTheme(document.body?.dataset?.game || 'home');
    }
    decorateGameCards();
});
themeObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-game']
});
