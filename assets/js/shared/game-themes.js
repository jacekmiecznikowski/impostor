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
            colors: [0x950f26, 0xd9465f, 0x8b5cf6, 0xf8fafc],
            alpha: [0.04, 0.16],
            speed: 0.82,
            confetti: false,
            motif: 'party',
            metaColor: '#950f26',
            pageBase: '#06050a',
            pageGlowRgb: '149, 15, 38',
            pageGlowAltRgb: '217, 70, 95',
            pageGlowAlpha: '.25',
            pageGlowAltAlpha: '.065'
        }
    }
});

let partyjniakThemeMotifs = [];
let motifMode = null;
let themesInitialized = false;

function getPartyjniakGameTheme(gameId) {
    if (!gameId || gameId === 'home') return PARTYJNIAK_HOME_THEME;
    return getGameModule?.(gameId)?.theme || null;
}

function registerPartyjniakBackgroundModes() {
    Object.assign(BACKGROUND_MODES, PARTYJNIAK_HOME_THEME.backgrounds);
    const catalog = typeof getGameCatalog === 'function' ? getGameCatalog() : [];
    catalog.forEach(entry => {
        const backgrounds = getGameModule?.(entry.id)?.theme?.backgrounds;
        if (backgrounds && typeof backgrounds === 'object') Object.assign(BACKGROUND_MODES, backgrounds);
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
    const meta = document.querySelector('meta[name="theme-color"]');
    document.body.dataset.bgMode = modeName;
    setThemeVariable('--page-bg', mode.pageBase || '#020617');
    setThemeVariable('--page-glow-rgb', mode.pageGlowRgb || '15, 23, 42');
    setThemeVariable('--page-glow-alt-rgb', mode.pageGlowAltRgb || mode.pageGlowRgb || '15, 23, 42');
    setThemeVariable('--page-glow-alpha', mode.pageGlowAlpha || '.12');
    setThemeVariable('--page-glow-alt-alpha', mode.pageGlowAltAlpha || '.045');
    if (meta) meta.setAttribute('content', mode.metaColor || '#020617');
}

function clearPartyjniakThemeMotifs() {
    partyjniakThemeMotifs.forEach(item => {
        try { item.destroy(); } catch (_) {}
    });
    partyjniakThemeMotifs = [];
}

function addFloatingMotif(scene, item, { x, y, dx = 12, dy = 18, duration = 6500, rotation = 0.12 } = {}) {
    item.setPosition(x, y);
    partyjniakThemeMotifs.push(item);
    if (scene.reducedMotion) return;
    scene.tweens.add({
        targets: item,
        x: x + dx,
        y: y + dy,
        angle: item.angle + rotation * 180 / Math.PI,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
    });
}

function renderPartyjniakThemeMotifs(modeName) {
    const scene = typeof backgroundScene !== 'undefined' ? backgroundScene : null;
    const mode = BACKGROUND_MODES[modeName];
    const motif = mode?.overlayMotif || null;
    if (!scene || !scene.add || motifMode === modeName) return;

    motifMode = modeName;
    clearPartyjniakThemeMotifs();
    if (!motif || scene.reducedMotion) return;

    const w = scene.scale.width;
    const h = scene.scale.height;
    const colors = Array.isArray(mode.colors) && mode.colors.length ? mode.colors : [0xffffff];

    if (motif === 'orbit') {
        [[.12, .24, 34], [.83, .18, 54], [.75, .78, 42], [.18, .72, 24]].forEach(([xr, yr, radius], index) => {
            const color = colors[index % colors.length];
            const ring = scene.add.circle(w * xr, h * yr, radius, color, .010).setStrokeStyle(1, color, .16);
            addFloatingMotif(scene, ring, { x: w * xr, y: h * yr, dx: index % 2 ? -20 : 18, dy: -20, duration: 5600 + index * 650 });
        });
    } else if (motif === 'wild-cards') {
        [[.12, .22, -24], [.82, .18, 28], [.78, .76, -18], [.14, .70, 32]].forEach(([xr, yr, angle], index) => {
            const color = colors[index % colors.length];
            const card = scene.add.rectangle(w * xr, h * yr, 72, 102, color, .025).setAngle(angle).setStrokeStyle(1, color, .16);
            addFloatingMotif(scene, card, { x: w * xr, y: h * yr, dx: index % 2 ? -18 : 16, dy: 14, duration: 6200 + index * 550, rotation: .04 });
        });
    } else if (motif === 'thought') {
        [[.14, .24, 30], [.82, .20, 46], [.74, .76, 38], [.20, .72, 24]].forEach(([xr, yr, radius], index) => {
            const color = colors[index % colors.length];
            const bubble = scene.add.circle(w * xr, h * yr, radius, color, .018).setStrokeStyle(1, color, .14);
            addFloatingMotif(scene, bubble, { x: w * xr, y: h * yr, dx: index % 2 ? -14 : 14, dy: -16, duration: 5900 + index * 520, rotation: 0 });
        });
    }
}

function decorateGameCards() {
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
    renderPartyjniakThemeMotifs(backgroundMode);
};

function initializePartyjniakThemes() {
    if (themesInitialized) return;
    themesInitialized = true;
    registerPartyjniakBackgroundModes();
    applyPartyjniakGameTheme('home');
    setBackgroundMode('party');
    queueMicrotask(decorateGameCards);
}

const themeObserver = new MutationObserver(() => {
    if (themesInitialized) decorateGameCards();
});
themeObserver.observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener('load', () => {
    renderPartyjniakThemeMotifs(backgroundMode);
}, { once: true });
