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

function addFloatingMotif(scene, item, {
    x,
    y,
    dx = 12,
    dy = 18,
    duration = 6500,
    rotation = 0.12,
    scale = 0,
    alphaSwing = 0,
    additive = false
} = {}) {
    item.setPosition(x, y);
    trackThemeNode(item, { additive });
    if (scene.reducedMotion) return item;
    addThemeTween(scene, {
        targets: item,
        x: x + dx,
        y: y + dy,
        angle: item.angle + rotation * 180 / Math.PI,
        scaleX: scale ? item.scaleX + scale : item.scaleX,
        scaleY: scale ? item.scaleY + scale : item.scaleY,
        alpha: alphaSwing ? Math.max(0, item.alpha + alphaSwing) : item.alpha,
        duration,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut'
    });
    return item;
}

function addPulseRing(scene, x, y, radius, color, {
    alpha = .16,
    duration = 3200,
    scale = 1.18,
    delay = 0,
    width = 1,
    additive = true
} = {}) {
    const ring = scene.add.circle(x, y, radius, color, 0).setStrokeStyle(width, color, alpha);
    trackThemeNode(ring, { additive });
    if (!scene.reducedMotion) {
        addThemeTween(scene, {
            targets: ring,
            scale,
            alpha: Math.max(.03, alpha * .35),
            duration,
            delay,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });
    }
    return ring;
}

function addOrbitingDot(scene, cx, cy, radiusX, radiusY, color, {
    phase = 0,
    duration = 6200,
    size = 3,
    alpha = .35,
    additive = true,
    clockwise = true
} = {}) {
    const dot = scene.add.circle(cx + Math.cos(phase) * radiusX, cy + Math.sin(phase) * radiusY, size, color, alpha);
    trackThemeNode(dot, { additive });
    if (scene.reducedMotion) return dot;
    const state = { angle: phase };
    const tween = scene.tweens.add({
        targets: state,
        angle: phase + (clockwise ? 1 : -1) * Math.PI * 2,
        duration,
        repeat: -1,
        ease: 'Linear',
        onUpdate: () => {
            if (!dot.active) return;
            dot.x = cx + Math.cos(state.angle) * radiusX;
            dot.y = cy + Math.sin(state.angle) * radiusY;
        }
    });
    trackThemeTween(tween);
    return dot;
}

function addSweep(scene, cx, cy, length, color, {
    alpha = .10,
    duration = 7200,
    angle = 0,
    width = 2
} = {}) {
    const sweep = scene.add.rectangle(cx, cy, length, width, color, alpha).setAngle(angle);
    trackThemeNode(sweep, { additive: true });
    if (!scene.reducedMotion) {
        addThemeTween(scene, {
            targets: sweep,
            angle: angle + 360,
            duration,
            repeat: -1,
            ease: 'Linear'
        });
    }
    return sweep;
}

function sceneMetrics(scene) {
    const w = Math.max(1, scene.scale.width);
    const h = Math.max(1, scene.scale.height);
    const short = Math.max(220, Math.min(w, h));
    return { w, h, short };
}

function buildPartyAurora(scene, mode) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    [
        [.18, .20, .56, .16, -18],
        [.84, .34, .70, .20, 20],
        [.48, .84, .82, .24, -7]
    ].forEach(([xr, yr, widthR, heightR, angle], index) => {
        const halo = scene.add.ellipse(w * xr, h * yr, short * widthR, short * heightR, colors[index % colors.length], .012)
            .setStrokeStyle(1, colors[(index + 1) % colors.length], .08)
            .setAngle(angle);
        addFloatingMotif(scene, halo, {
            x: w * xr,
            y: h * yr,
            dx: index % 2 ? -18 : 20,
            dy: index === 2 ? -12 : 14,
            duration: 9000 + index * 800,
            rotation: index % 2 ? -.025 : .02,
            scale: .035,
            alphaSwing: .012,
            additive: true
        });
    });

    for (let i = 0; i < (scene.reducedMotion ? 4 : 9); i++) {
        const color = colors[i % colors.length];
        const star = scene.add.star(
            w * (.08 + ((i * .137) % .84)),
            h * (.12 + ((i * .223) % .76)),
            4,
            1.8,
            5.5,
            color,
            .12
        ).setAngle(45);
        addFloatingMotif(scene, star, {
            x: star.x,
            y: star.y,
            dx: i % 2 ? -8 : 10,
            dy: -10,
            duration: 4300 + i * 280,
            rotation: .08,
            alphaSwing: .05,
            additive: true
        });
    }
}

function buildSuspectRadar(scene, mode, modeName) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const cx = w * (modeName === 'mystery' ? .50 : .56);
    const cy = h * .46;
    const base = short * .20;

    [1, 1.55, 2.12].forEach((factor, index) => {
        addPulseRing(scene, cx, cy, base * factor, colors[index % colors.length], {
            alpha: .14 - index * .025,
            duration: 4200 + index * 850,
            scale: 1.04 + index * .025,
            delay: index * 220
        });
    });
    addSweep(scene, cx, cy, base * 4.1, colors[1] || colors[0], {
        alpha: modeName === 'mystery' ? .08 : .11,
        duration: modeName === 'mystery' ? 9600 : 7600,
        angle: -18
    });

    for (let i = 0; i < 7; i++) {
        const radius = base * (1.15 + (i % 3) * .42);
        addOrbitingDot(scene, cx, cy, radius, radius * .58, colors[(i + 1) % colors.length], {
            phase: i * .91,
            duration: 5600 + i * 470,
            size: i % 3 === 0 ? 3.2 : 2.1,
            alpha: .28,
            clockwise: i % 2 === 0
        });
    }

    const brackets = [
        [.09, .18, 0], [.91, .21, 90], [.13, .80, 270], [.88, .78, 180]
    ];
    brackets.forEach(([xr, yr, angle], index) => {
        const color = colors[index % colors.length];
        const corner = scene.add.rectangle(w * xr, h * yr, short * .10, 2, color, .14).setAngle(angle);
        const corner2 = scene.add.rectangle(w * xr, h * yr, short * .07, 2, color, .10).setAngle(angle + 90);
        addFloatingMotif(scene, corner, { x: corner.x, y: corner.y, dx: 7, dy: -6, duration: 6400 + index * 300, rotation: 0, additive: true });
        addFloatingMotif(scene, corner2, { x: corner2.x, y: corner2.y, dx: -6, dy: 7, duration: 6900 + index * 330, rotation: 0, additive: true });
    });
}

function buildDialogueNetwork(scene, mode) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const points = [
        [.12, .24], [.36, .16], [.72, .22], [.88, .43], [.67, .72], [.34, .78], [.12, .58]
    ];
    const links = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0],[1,5],[2,4]];
    const graphics = scene.add.graphics();
    links.forEach(([a, b], index) => {
        graphics.lineStyle(1, colors[index % colors.length], .075);
        graphics.beginPath();
        graphics.moveTo(w * points[a][0], h * points[a][1]);
        graphics.lineTo(w * points[b][0], h * points[b][1]);
        graphics.strokePath();
    });
    trackThemeNode(graphics, { additive: true });

    points.forEach(([xr, yr], index) => {
        const color = colors[index % colors.length];
        const radius = short * (index % 2 ? .024 : .032);
        const node = scene.add.circle(w * xr, h * yr, radius, color, .035).setStrokeStyle(1, color, .18);
        addFloatingMotif(scene, node, {
            x: w * xr,
            y: h * yr,
            dx: index % 2 ? -9 : 10,
            dy: index % 3 ? 8 : -8,
            duration: 5200 + index * 410,
            rotation: 0,
            scale: .06,
            alphaSwing: .035,
            additive: true
        });
    });
}

function buildVerdictField(scene, mode) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const centerX = w * .50;
    const centerY = h * .46;
    addPulseRing(scene, centerX, centerY, short * .16, colors[0], { alpha: .13, duration: 3300, scale: 1.14 });
    addPulseRing(scene, centerX, centerY, short * .29, colors[1] || colors[0], { alpha: .08, duration: 4700, scale: 1.08 });

    const count = scene.reducedMotion ? 7 : 13;
    for (let i = 0; i < count; i++) {
        const x = w * (.08 + (i / Math.max(1, count - 1)) * .84);
        const maxHeight = short * .18;
        const height = maxHeight * (.35 + ((i * 37) % 65) / 100);
        const bar = scene.add.rectangle(x, h * .78, Math.max(3, short * .012), height, colors[i % colors.length], .09).setOrigin(.5, 1);
        trackThemeNode(bar, { additive: true });
        if (!scene.reducedMotion) {
            addThemeTween(scene, {
                targets: bar,
                scaleY: 1.25 + (i % 3) * .10,
                alpha: .16,
                duration: 1300 + i * 90,
                delay: i * 55,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    }
}

function buildVictoryRings(scene, mode) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const cx = w * .5;
    const cy = h * .40;
    [0,1,2].forEach(index => {
        addPulseRing(scene, cx, cy, short * (.14 + index * .09), colors[index % colors.length], {
            alpha: .18 - index * .035,
            duration: 2400 + index * 560,
            scale: 1.25,
            delay: index * 180,
            width: index === 0 ? 2 : 1
        });
    });
    for (let i = 0; i < (scene.reducedMotion ? 4 : 10); i++) {
        const star = scene.add.star(
            w * (.08 + ((i * .173) % .84)),
            h * (.10 + ((i * .291) % .80)),
            5,
            2.5,
            7,
            colors[i % colors.length],
            .14
        );
        addFloatingMotif(scene, star, {
            x: star.x,
            y: star.y,
            dx: i % 2 ? -12 : 12,
            dy: -14,
            duration: 3600 + i * 240,
            rotation: i % 2 ? -.10 : .10,
            alphaSwing: .06,
            additive: true
        });
    }
}

function buildFuseSparks(scene, mode, alert = false) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const cx = w * .52;
    const cy = h * .48;
    const radius = short * .22;

    [0,1,2].forEach(index => {
        const ellipse = scene.add.ellipse(cx, cy, radius * (1.7 + index * .58), radius * (.70 + index * .22), colors[index % colors.length], 0)
            .setStrokeStyle(alert ? 2 : 1, colors[index % colors.length], alert ? .13 : .08)
            .setAngle(-18 + index * 33);
        trackThemeNode(ellipse, { additive: true });
        if (!scene.reducedMotion) {
            addThemeTween(scene, {
                targets: ellipse,
                angle: ellipse.angle + (index % 2 ? -360 : 360),
                duration: (alert ? 4300 : 7600) + index * 1100,
                repeat: -1,
                ease: 'Linear'
            });
        }
    });

    const sparks = scene.reducedMotion ? 6 : (alert ? 18 : 12);
    for (let i = 0; i < sparks; i++) {
        const angle = (Math.PI * 2 * i) / sparks + (i % 3) * .18;
        const distance = radius * (1.0 + (i % 4) * .27);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance * .66;
        const spark = scene.add.rectangle(x, y, alert ? 3.5 : 2.5, alert ? 16 : 10, colors[i % colors.length], alert ? .18 : .13).setRotation(angle + Math.PI / 2);
        addFloatingMotif(scene, spark, {
            x,
            y,
            dx: Math.cos(angle) * (alert ? 16 : 8),
            dy: Math.sin(angle) * (alert ? 16 : 8),
            duration: alert ? 900 + (i % 4) * 170 : 2100 + (i % 4) * 320,
            rotation: .04,
            scale: alert ? .08 : .04,
            alphaSwing: alert ? .08 : .04,
            additive: true
        });
    }

    if (alert) {
        [0,1,2,3].forEach(index => addPulseRing(scene, cx, cy, radius * (.9 + index * .42), colors[index % colors.length], {
            alpha: .16 - index * .02,
            duration: 1250 + index * 260,
            scale: 1.34,
            delay: index * 110,
            width: index === 0 ? 2 : 1
        }));
    }
}

function buildOrbitField(scene, mode, variant = 'calm') {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const cx = w * .50;
    const cy = h * .48;
    const speed = variant === 'fast' ? .72 : variant === 'celebrate' ? .82 : 1;
    const ringDefs = [
        [short * .17, short * .10, -18],
        [short * .28, short * .16, 24],
        [short * .39, short * .23, -7]
    ];

    ringDefs.forEach(([rx, ry, angle], index) => {
        const ring = scene.add.ellipse(cx, cy, rx * 2, ry * 2, colors[index % colors.length], 0)
            .setStrokeStyle(index === 0 ? 2 : 1, colors[index % colors.length], .10 - index * .018)
            .setAngle(angle);
        trackThemeNode(ring, { additive: true });
        if (!scene.reducedMotion) {
            addThemeTween(scene, {
                targets: ring,
                angle: angle + (index % 2 ? -360 : 360),
                duration: (9200 + index * 2400) * speed,
                repeat: -1,
                ease: 'Linear'
            });
        }
        for (let dot = 0; dot < 2; dot++) {
            addOrbitingDot(scene, cx, cy, rx, ry, colors[(index + dot + 1) % colors.length], {
                phase: dot * Math.PI + index * .7,
                duration: (5200 + index * 1300) * speed,
                size: index === 0 ? 3.2 : 2.2,
                alpha: .30,
                clockwise: (index + dot) % 2 === 0
            });
        }
    });

    if (variant === 'celebrate') buildVictoryRings(scene, mode);
}

function buildThoughtField(scene, mode, celebrate = false) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const bubbles = [
        [.12,.24,.055], [.24,.16,.032], [.82,.20,.072], [.90,.38,.035], [.76,.74,.060], [.19,.76,.045]
    ];
    bubbles.forEach(([xr, yr, rr], index) => {
        const radius = short * rr;
        const bubble = scene.add.circle(w * xr, h * yr, radius, colors[index % colors.length], .018)
            .setStrokeStyle(index % 2 ? 1 : 2, colors[index % colors.length], .13);
        addFloatingMotif(scene, bubble, {
            x: w * xr,
            y: h * yr,
            dx: index % 2 ? -14 : 14,
            dy: -10 - (index % 3) * 3,
            duration: 5100 + index * 520,
            rotation: 0,
            scale: .06,
            alphaSwing: .025,
            additive: true
        });
    });
    if (celebrate) buildVictoryRings(scene, mode);
}

function buildGyroField(scene, mode) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const cx = w * .5;
    const cy = h * .48;
    [
        [short * .30, short * .12, 0],
        [short * .26, short * .15, 58],
        [short * .26, short * .15, -58]
    ].forEach(([rx, ry, angle], index) => {
        const ring = scene.add.ellipse(cx, cy, rx * 2, ry * 2, colors[index % colors.length], 0)
            .setStrokeStyle(index === 0 ? 2 : 1, colors[index % colors.length], .15 - index * .025)
            .setAngle(angle);
        trackThemeNode(ring, { additive: true });
        if (!scene.reducedMotion) {
            addThemeTween(scene, {
                targets: ring,
                angle: angle + (index === 1 ? -18 : 18),
                duration: 2800 + index * 400,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.InOut'
            });
        }
    });

    addPulseRing(scene, cx, cy, short * .055, colors[0], { alpha: .20, duration: 1900, scale: 1.35, width: 2 });
    for (let i = 0; i < 7; i++) {
        const y = h * (.16 + i * .105);
        const line = scene.add.rectangle(cx, y, w * .72, 1, colors[(i + 1) % colors.length], .055).setAngle(i % 2 ? 7 : -7);
        addFloatingMotif(scene, line, {
            x: cx,
            y,
            dx: i % 2 ? -20 : 20,
            dy: 0,
            duration: 2800 + i * 210,
            rotation: 0,
            alphaSwing: .035,
            additive: true
        });
    }
}

function buildWildCards(scene, mode) {
    const { w, h, short } = sceneMetrics(scene);
    const colors = mode.colors;
    const cardW = Math.max(34, short * .13);
    const cardH = cardW * 1.42;
    const cards = [
        [.12,.22,-24], [.28,.10,14], [.82,.18,28], [.88,.66,-18], [.69,.82,17], [.16,.74,32]
    ];
    cards.forEach(([xr, yr, angle], index) => {
        const color = colors[index % colors.length];
        const card = scene.add.rectangle(w * xr, h * yr, cardW, cardH, color, .025).setAngle(angle).setStrokeStyle(1, color, .18);
        addFloatingMotif(scene, card, {
            x: w * xr,
            y: h * yr,
            dx: index % 2 ? -14 : 15,
            dy: index % 3 ? 12 : -12,
            duration: 5300 + index * 430,
            rotation: index % 2 ? -.06 : .06,
            scale: .025,
            alphaSwing: .025,
            additive: true
        });
        const pip = scene.add.circle(w * xr, h * yr, Math.max(2, cardW * .055), colors[(index + 1) % colors.length], .22);
        addFloatingMotif(scene, pip, {
            x: w * xr,
            y: h * yr,
            dx: index % 2 ? -14 : 15,
            dy: index % 3 ? 12 : -12,
            duration: 5300 + index * 430,
            rotation: 0,
            additive: true
        });
    });
}

function renderPartyjniakThemeMotifs(modeName, { force = false } = {}) {
    const scene = typeof backgroundScene !== 'undefined' ? backgroundScene : null;
    const mode = BACKGROUND_MODES[modeName];
    const motif = mode?.overlayMotif || null;
    if (!scene || !scene.add || !mode) return;
    if (!force && motifMode === modeName) return;

    motifMode = modeName;
    clearPartyjniakThemeMotifs();
    if (!motif) return;

    const builders = {
        'party-aurora': () => buildPartyAurora(scene, mode),
        'suspect-radar': () => buildSuspectRadar(scene, mode, modeName),
        'dialogue-network': () => buildDialogueNetwork(scene, mode),
        verdict: () => buildVerdictField(scene, mode),
        'victory-rings': () => buildVictoryRings(scene, mode),
        'fuse-sparks': () => buildFuseSparks(scene, mode, false),
        shockwave: () => buildFuseSparks(scene, mode, true),
        'orbit-words': () => buildOrbitField(scene, mode, 'calm'),
        'orbit-fast': () => buildOrbitField(scene, mode, 'fast'),
        'orbit-celebrate': () => buildOrbitField(scene, mode, 'celebrate'),
        'thought-field': () => buildThoughtField(scene, mode, false),
        'thought-celebrate': () => buildThoughtField(scene, mode, true),
        gyro: () => buildGyroField(scene, mode),
        'wild-cards': () => buildWildCards(scene, mode)
    };
    const builder = builders[motif];
    if (builder) builder();
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
