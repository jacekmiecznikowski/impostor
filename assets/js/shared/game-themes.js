const PARTYJNIAK_GAME_THEMES = Object.freeze({
    home: {
        id: 'home',
        accent: '#950f26',
        rgb: '149, 15, 38',
        backgroundMode: 'party'
    },
    impostor: {
        id: 'impostor',
        accent: '#14b8a6',
        rgb: '20, 184, 166',
        backgroundMode: 'impostor'
    },
    'ticking-bomb': {
        id: 'ticking-bomb',
        accent: '#f97316',
        rgb: '249, 115, 22',
        backgroundMode: 'ticking-bomb'
    },
    'heads-up': {
        id: 'heads-up',
        accent: '#8b5cf6',
        rgb: '139, 92, 246',
        backgroundMode: 'heads-up'
    },
    taboo: {
        id: 'taboo',
        accent: '#e11d48',
        rgb: '225, 29, 72',
        backgroundMode: 'taboo'
    }
});

/* Core Partyjniak backgrounds live in background.js.
   Only future game modes are extended here so existing palettes are never overwritten. */
Object.assign(BACKGROUND_MODES, {
    'heads-up': { colors: [0x8b5cf6, 0xc084fc, 0xec4899, 0x38bdf8], alpha: [0.07, 0.21], speed: 0.78, confetti: false, motif: 'heads-up' },
    taboo: { colors: [0xe11d48, 0xfb7185, 0xf43f5e, 0xfda4af], alpha: [0.07, 0.20], speed: 0.70, confetti: false, motif: 'taboo' }
});

let partyjniakThemeMotifs = [];
let motifMode = null;

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

const NATIVE_BACKGROUND_MOTIFS = new Set([
    'party',
    'impostor',
    'mystery',
    'discussion',
    'vote',
    'celebrate',
    'ticking-bomb',
    'bomb-alert'
]);

function renderPartyjniakThemeMotifs(modeName) {
    const scene = typeof backgroundScene !== 'undefined' ? backgroundScene : null;
    if (!scene || !scene.add || motifMode === modeName) return;

    motifMode = modeName;
    clearPartyjniakThemeMotifs();

    /* These modes already render their complete abstract language inside BackgroundScene.
       Do not stack the legacy motif layer over them. */
    if (NATIVE_BACKGROUND_MOTIFS.has(modeName) || scene.reducedMotion) return;

    const w = scene.scale.width;
    const h = scene.scale.height;

    if (modeName === 'heads-up') {
        [[.12, .24, 34], [.83, .18, 54], [.75, .78, 42], [.18, .72, 24]].forEach(([xr, yr, radius], index) => {
            const bubble = scene.add.circle(w * xr, h * yr, radius, index % 2 ? 0xc084fc : 0x8b5cf6, .012)
                .setStrokeStyle(1, index % 2 ? 0xec4899 : 0x8b5cf6, .12);
            addFloatingMotif(scene, bubble, { x: w * xr, y: h * yr, dx: index % 2 ? -20 : 18, dy: -20, duration: 5600 + index * 650 });
        });
    } else if (modeName === 'taboo') {
        [[.12, .22, -24], [.82, .18, 28], [.78, .76, -18], [.14, .70, 32]].forEach(([xr, yr, angle], index) => {
            const color = index % 2 ? 0xfb7185 : 0xe11d48;
            const slash = scene.add.rectangle(w * xr, h * yr, 92, 3, color, .13).setAngle(angle);
            addFloatingMotif(scene, slash, { x: w * xr, y: h * yr, dx: index % 2 ? -18 : 16, dy: 14, duration: 6200 + index * 550, rotation: .04 });
        });
    }
}

function applyPartyjniakThemeMeta(modeName) {
    const meta = document.querySelector('meta[name="theme-color"]');
    const colors = {
        party: '#950f26',
        impostor: '#063b38',
        mystery: '#062e2c',
        discussion: '#063b38',
        vote: '#063b38',
        celebrate: '#063b38',
        'ticking-bomb': '#7c2d12',
        'bomb-alert': '#7f1d1d',
        'heads-up': '#4c1d95',
        taboo: '#881337'
    };
    document.body.dataset.bgMode = modeName;
    if (meta) meta.setAttribute('content', colors[modeName] || '#020617');
}

const baseSetBackgroundMode = setBackgroundMode;
setBackgroundMode = function themedSetBackgroundMode(modeName) {
    baseSetBackgroundMode(modeName);
    applyPartyjniakThemeMeta(backgroundMode);
    renderPartyjniakThemeMotifs(backgroundMode);
};

function decorateGameCards() {
    const cards = [...document.querySelectorAll('.game-card-primary, .upcoming-card')];
    cards.forEach(card => {
        const name = card.querySelector('strong')?.textContent?.trim();
        const gameId = name === 'Impostor'
            ? 'impostor'
            : name === 'Tykająca Bomba'
                ? 'ticking-bomb'
                : name === 'Czółko'
                    ? 'heads-up'
                    : name === 'Tabu'
                        ? 'taboo'
                        : null;
        const theme = gameId ? PARTYJNIAK_GAME_THEMES[gameId] : null;
        if (!theme || card.dataset.themeReady === 'true') return;

        card.dataset.gameId = gameId;
        card.dataset.themeReady = 'true';
        card.style.setProperty('--game-accent', theme.accent);
        card.style.setProperty('--game-rgb', theme.rgb);

        const preview = () => {
            if (typeof getCurrentScreenName === 'function' && getCurrentScreenName() === 'home') setBackgroundMode(theme.backgroundMode);
        };
        const restore = () => {
            if (typeof getCurrentScreenName === 'function' && getCurrentScreenName() === 'home') setBackgroundMode('party');
        };
        card.addEventListener('pointerenter', preview);
        card.addEventListener('focus', preview);
        card.addEventListener('pointerleave', restore);
        card.addEventListener('blur', restore);
    });
}

const themeObserver = new MutationObserver(decorateGameCards);
themeObserver.observe(document.documentElement, { childList: true, subtree: true });

document.addEventListener('DOMContentLoaded', () => {
    applyPartyjniakThemeMeta('party');
    queueMicrotask(decorateGameCards);
}, { once: true });

window.addEventListener('load', () => {
    renderPartyjniakThemeMotifs(backgroundMode);
}, { once: true });
