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

let partyjniakThemeMotifs = [];
let partyjniakThemeTweens = [];
let motifMode = null;
let motifRenderToken = 0;
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
    partyjniakThemeTweens.forEach(tween => {
        try { tween.stop?.(); tween.remove?.(); } catch (_) {}
    });
    partyjniakThemeTweens = [];
    partyjniakThemeMotifs.forEach(item => {
        try { item.destroy(); } catch (_) {}
    });
    partyjniakThemeMotifs = [];
}

function trackThemeNode(node, { additive = false } = {}) {
    if (!node) return node;
    if (additive) {
        try { node.setBlendMode?.('ADD'); } catch (_) {}
    }
    partyjniakThemeMotifs.push(node);
    return node;
}

function trackThemeTween(tween) {
    if (tween) partyjniakThemeTweens.push(tween);
    return tween;
}

function addThemeTween(scene, config) {
    if (scene.reducedMotion) return null;
    return trackThemeTween(scene.tweens.add(config));
}

function sceneMetrics(scene) {
    const w = Math.max(1, scene.scale.width);
    const h = Math.max(1, scene.scale.height);
    const areaScale = Math.max(.8, Math.min(1.55, Math.sqrt((w * h) / (390 * 844))));
    return { w, h, areaScale };
}

function particleCount(scene, base) {
    const { areaScale } = sceneMetrics(scene);
    const count = Math.round(base * areaScale);
    return scene.reducedMotion ? Math.max(8, Math.round(count * .34)) : count;
}

function between(scene, min, max) {
    const PhaserLib = window.Phaser;
    if (PhaserLib?.Math?.FloatBetween) return PhaserLib.Math.FloatBetween(min, max);
    return min + Math.random() * (max - min);
}

function integer(scene, min, max) {
    const PhaserLib = window.Phaser;
    if (PhaserLib?.Math?.Between) return PhaserLib.Math.Between(min, max);
    return Math.floor(between(scene, min, max + 1));
}

function makeParticle(scene, shape, x, y, size, color, alpha) {
    if (shape === 'dash') {
        return scene.add.rectangle(x, y, size * 3.4, Math.max(1, size * .65), color, alpha)
            .setAngle(integer(scene, -35, 35));
    }
    if (shape === 'chip') {
        return scene.add.rectangle(x, y, Math.max(3, size * 1.9), Math.max(4, size * 2.7), color, alpha)
            .setAngle(integer(scene, -30, 30));
    }
    if (shape === 'star') {
        return scene.add.star(x, y, 4, Math.max(.8, size * .45), Math.max(1.8, size), color, alpha);
    }
    return scene.add.circle(x, y, Math.max(.7, size), color, alpha);
}

function addParticle(scene, mode, profile, index) {
    const { w, h } = sceneMetrics(scene);
    const colors = mode.colors?.length ? mode.colors : [0xffffff];
    const size = between(scene, profile.size[0], profile.size[1]);
    const x = between(scene, -w * .05, w * 1.05);
    const y = between(scene, -h * .05, h * 1.05);
    const shape = profile.shapes[index % profile.shapes.length];
    const alpha = between(scene, profile.alpha[0], profile.alpha[1]);
    const particle = makeParticle(scene, shape, x, y, size, colors[index % colors.length], alpha);
    trackThemeNode(particle, { additive: profile.additive !== false });

    if (scene.reducedMotion) return particle;

    const dx = between(scene, profile.dx[0], profile.dx[1]);
    const dy = between(scene, profile.dy[0], profile.dy[1]);
    const rotation = between(scene, profile.rotation?.[0] ?? -.08, profile.rotation?.[1] ?? .08) * 180 / Math.PI;
    const duration = between(scene, profile.duration[0], profile.duration[1]);
    const scaleSwing = between(scene, profile.scale?.[0] ?? 0, profile.scale?.[1] ?? .18);
    const alphaSwing = between(scene, profile.alphaSwing?.[0] ?? .01, profile.alphaSwing?.[1] ?? .08);

    addThemeTween(scene, {
        targets: particle,
        x: x + dx,
        y: y + dy,
        angle: particle.angle + rotation,
        scaleX: particle.scaleX + scaleSwing,
        scaleY: particle.scaleY + scaleSwing,
        alpha: Math.min(.6, alpha + alphaSwing),
        duration,
        delay: between(scene, 0, profile.delayMax ?? 1600),
        yoyo: true,
        repeat: -1,
        ease: profile.ease || 'Sine.InOut'
    });
    return particle;
}

function buildParticleField(scene, mode, profile) {
    const count = particleCount(scene, profile.count);
    for (let i = 0; i < count; i++) addParticle(scene, mode, profile, i);
}

function buildPartyAurora(scene, mode) {
    buildParticleField(scene, mode, {
        count: 46,
        shapes: ['dot', 'dot', 'star', 'dash'],
        size: [1.1, 3.4],
        alpha: [.05, .18],
        dx: [-18, 18],
        dy: [-28, -8],
        duration: [5200, 10500],
        rotation: [-.12, .12],
        scale: [0, .16],
        alphaSwing: [.02, .08]
    });
}

function buildSuspectRadar(scene, mode, variant = 'calm') {
    buildParticleField(scene, mode, {
        count: variant === 'mystery' ? 40 : 48,
        shapes: ['dot', 'dot', 'dash', 'dot', 'dash'],
        size: [.9, 2.7],
        alpha: [.045, .17],
        dx: variant === 'mystery' ? [-10, 10] : [-22, 22],
        dy: [-8, 8],
        duration: variant === 'mystery' ? [7200, 12800] : [5200, 9800],
        rotation: [-.04, .04],
        scale: [0, .12],
        alphaSwing: [.02, .09]
    });
}

function buildDialogueNetwork(scene, mode) {
    buildParticleField(scene, mode, {
        count: 50,
        shapes: ['dot', 'dash', 'dot', 'dot'],
        size: [1.0, 2.8],
        alpha: [.05, .17],
        dx: [-34, 34],
        dy: [-16, 16],
        duration: [4200, 8200],
        rotation: [-.05, .05],
        scale: [0, .10],
        alphaSwing: [.02, .07]
    });
}

function buildVerdictField(scene, mode) {
    buildParticleField(scene, mode, {
        count: 44,
        shapes: ['dash', 'dot', 'dash', 'dot'],
        size: [1.1, 2.5],
        alpha: [.045, .16],
        dx: [-10, 10],
        dy: [-30, -8],
        duration: [3600, 7200],
        rotation: [-.02, .02],
        scale: [0, .12],
        alphaSwing: [.02, .08]
    });
}

function buildVictoryRings(scene, mode) {
    buildParticleField(scene, mode, {
        count: 62,
        shapes: ['dot', 'star', 'dash', 'star', 'dot'],
        size: [1.1, 3.4],
        alpha: [.07, .24],
        dx: [-28, 28],
        dy: [-36, 12],
        duration: [2800, 6500],
        rotation: [-.22, .22],
        scale: [.02, .22],
        alphaSwing: [.04, .12]
    });
}

function buildFuseSparks(scene, mode, alert = false) {
    const { w, h } = sceneMetrics(scene);
    const cx = w * .52;
    const cy = h * .48;
    const count = particleCount(scene, alert ? 62 : 48);
    const colors = mode.colors?.length ? mode.colors : [0xffffff];

    for (let i = 0; i < count; i++) {
        const angle = between(scene, 0, Math.PI * 2);
        const distance = between(scene, 8, Math.min(w, h) * .38);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance;
        const size = between(scene, 1, alert ? 3.2 : 2.5);
        const spark = makeParticle(scene, i % 4 === 0 ? 'dash' : 'dot', x, y, size, colors[i % colors.length], between(scene, .06, alert ? .26 : .19));
        if (spark.setRotation && i % 4 === 0) spark.setRotation(angle);
        trackThemeNode(spark, { additive: true });

        if (!scene.reducedMotion) {
            const push = between(scene, alert ? 28 : 12, alert ? 74 : 38);
            addThemeTween(scene, {
                targets: spark,
                x: x + Math.cos(angle) * push,
                y: y + Math.sin(angle) * push,
                alpha: Math.min(.55, (spark.alpha || .1) + (alert ? .16 : .08)),
                scaleX: spark.scaleX + (alert ? .24 : .10),
                scaleY: spark.scaleY + (alert ? .24 : .10),
                duration: between(scene, alert ? 700 : 1600, alert ? 2400 : 5200),
                delay: between(scene, 0, 1600),
                yoyo: true,
                repeat: -1,
                ease: alert ? 'Quad.Out' : 'Sine.InOut'
            });
        }
    }
}

function buildOrbitField(scene, mode, fast = false, celebrate = false) {
    buildParticleField(scene, mode, {
        count: celebrate ? 58 : fast ? 52 : 44,
        shapes: celebrate ? ['dot', 'dash', 'star', 'dot'] : ['dot', 'dash', 'dot', 'dash'],
        size: [.9, celebrate ? 3.0 : 2.4],
        alpha: [.045, celebrate ? .22 : .16],
        dx: fast ? [-56, 56] : [-30, 30],
        dy: fast ? [-22, 22] : [-14, 14],
        duration: fast ? [2800, 6200] : [5200, 9800],
        rotation: [-.08, .08],
        scale: [0, celebrate ? .18 : .10],
        alphaSwing: [.02, celebrate ? .10 : .07]
    });
}

function buildThoughtField(scene, mode, celebrate = false) {
    buildParticleField(scene, mode, {
        count: celebrate ? 58 : 46,
        shapes: celebrate ? ['dot', 'dot', 'star'] : ['dot', 'dot', 'dot', 'dash'],
        size: [1.0, celebrate ? 3.3 : 2.8],
        alpha: [.045, celebrate ? .22 : .16],
        dx: [-18, 18],
        dy: [-34, -8],
        duration: [4600, 9200],
        rotation: [-.04, .04],
        scale: [.01, celebrate ? .20 : .14],
        alphaSwing: [.025, celebrate ? .11 : .08]
    });
}

function buildGyroField(scene, mode) {
    buildParticleField(scene, mode, {
        count: 58,
        shapes: ['dash', 'dot', 'dash', 'dot', 'dot'],
        size: [.9, 2.5],
        alpha: [.05, .19],
        dx: [-64, 64],
        dy: [-8, 8],
        duration: [2400, 5600],
        rotation: [-.02, .02],
        scale: [0, .10],
        alphaSwing: [.03, .09]
    });
}

function buildWildCards(scene, mode) {
    buildParticleField(scene, mode, {
        count: 38,
        shapes: ['chip', 'dot', 'chip', 'star'],
        size: [1.4, 3.0],
        alpha: [.045, .16],
        dx: [-22, 22],
        dy: [-26, 16],
        duration: [5200, 9800],
        rotation: [-.12, .12],
        scale: [0, .12],
        alphaSwing: [.02, .07]
    });
}

function disableLegacyPhaserDecor(scene) {
    if (!scene || scene.__partyjniakParticleOnly) return;
    scene.__partyjniakParticleOnly = true;
    scene.rebuildDecor = function particleOnlyDecor() {
        this.clearDecor?.();
    };
    scene.clearDecor?.();
}

function renderPartyjniakThemeMotifs(modeName, { force = false } = {}) {
    const scene = typeof backgroundScene !== 'undefined' ? backgroundScene : null;
    const mode = BACKGROUND_MODES[modeName];
    const motif = mode?.overlayMotif || null;
    if (!scene || !scene.add || !mode) return;
    if (!force && motifMode === modeName) return;

    motifMode = modeName;
    disableLegacyPhaserDecor(scene);
    clearPartyjniakThemeMotifs();
    if (!motif) return;

    const builders = {
        'party-aurora': () => buildPartyAurora(scene, mode),
        'suspect-radar': () => buildSuspectRadar(scene, mode, modeName === 'mystery' ? 'mystery' : 'calm'),
        'dialogue-network': () => buildDialogueNetwork(scene, mode),
        verdict: () => buildVerdictField(scene, mode),
        'victory-rings': () => buildVictoryRings(scene, mode),
        'fuse-sparks': () => buildFuseSparks(scene, mode, false),
        shockwave: () => buildFuseSparks(scene, mode, true),
        'orbit-words': () => buildOrbitField(scene, mode, false, false),
        'orbit-fast': () => buildOrbitField(scene, mode, true, false),
        'orbit-celebrate': () => buildOrbitField(scene, mode, false, true),
        'thought-field': () => buildThoughtField(scene, mode, false),
        gyro: () => buildGyroField(scene, mode),
        'thought-celebrate': () => buildThoughtField(scene, mode, true),
        'wild-cards': () => buildWildCards(scene, mode)
    };
    builders[motif]?.();
    bindPartyjniakThemeResize(scene);
}

function schedulePartyjniakThemeMotifs(modeName, { force = false } = {}) {
    const token = ++motifRenderToken;
    queueMicrotask(() => {
        if (token !== motifRenderToken) return;
        renderPartyjniakThemeMotifs(modeName, { force });
    });
}

function bindPartyjniakThemeResize(scene) {
    if (scene.__partyjniakThemeResizeBound || !scene.scale?.on) return;
    scene.__partyjniakThemeResizeBound = true;
    scene.scale.on('resize', () => {
        motifMode = null;
        schedulePartyjniakThemeMotifs(backgroundMode, { force: true });
    });
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
    schedulePartyjniakThemeMotifs(backgroundMode);
};

function initializePartyjniakThemes() {
    if (themesInitialized) return;
    themesInitialized = true;
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

window.addEventListener('load', () => {
    motifMode = null;
    schedulePartyjniakThemeMotifs(backgroundMode, { force: true });
}, { once: true });
