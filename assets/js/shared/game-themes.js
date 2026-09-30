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
    'heads-up': {
        id: 'heads-up',
        accent: '#8b5cf6',
        rgb: '139, 92, 246',
        backgroundMode: 'heads-up'
    },
    taboo: {
        id: 'taboo',
        accent: '#f59e0b',
        rgb: '245, 158, 11',
        backgroundMode: 'taboo'
    }
});

Object.assign(BACKGROUND_MODES, {
    party: { colors: [0x950f26, 0xc61d3a, 0xffffff, 0xf59e0b], alpha: [0.08, 0.22], speed: 0.86, confetti: true },
    impostor: { colors: [0x14b8a6, 0x06b6d4, 0x5eead4, 0x64748b], alpha: [0.07, 0.19], speed: 0.72, confetti: false },
    mystery: { colors: [0x14b8a6, 0x0f766e, 0x38bdf8, 0x475569], alpha: [0.055, 0.15], speed: 0.46, confetti: false },
    discussion: { colors: [0x14b8a6, 0x06b6d4, 0x22c55e, 0x94a3b8], alpha: [0.065, 0.18], speed: 0.62, confetti: false },
    vote: { colors: [0x14b8a6, 0xf59e0b, 0x0ea5e9, 0x64748b], alpha: [0.06, 0.17], speed: 0.54, confetti: false },
    celebrate: { colors: [0x14b8a6, 0x5eead4, 0xf59e0b, 0xffffff], alpha: [0.08, 0.24], speed: 0.95, confetti: true },
    'heads-up': { colors: [0x8b5cf6, 0xc084fc, 0xec4899, 0x38bdf8], alpha: [0.07, 0.21], speed: 0.78, confetti: false },
    taboo: { colors: [0xf59e0b, 0xfb923c, 0xef4444, 0xfef3c7], alpha: [0.07, 0.20], speed: 0.70, confetti: false }
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

function renderPartyjniakThemeMotifs(modeName) {
    const scene = typeof backgroundScene !== 'undefined' ? backgroundScene : null;
    if (!scene || !scene.add || motifMode === modeName) return;

    motifMode = modeName;
    clearPartyjniakThemeMotifs();

    if (scene.reducedMotion) return;
    const w = scene.scale.width;
    const h = scene.scale.height;

    if (modeName === 'party') {
        const cards = [
            [w * .08, h * .24, -12], [w * .90, h * .18, 16], [w * .16, h * .78, 12], [w * .84, h * .72, -18]
        ];
        cards.forEach(([x, y, angle], index) => {
            const color = index % 2 ? 0xc61d3a : 0x950f26;
            const card = scene.add.rectangle(x, y, 46, 66, color, .018).setStrokeStyle(1, color, .13).setAngle(angle);
            const pip = scene.add.circle(x, y, 3.2, 0xffffff, .13);
            addFloatingMotif(scene, card, { x, y, dx: index % 2 ? -16 : 13, dy: 22, duration: 6800 + index * 500, rotation: .08 });
            addFloatingMotif(scene, pip, { x, y, dx: index % 2 ? -16 : 13, dy: 22, duration: 6800 + index * 500 });
        });
    } else if (['impostor', 'mystery', 'discussion', 'vote', 'celebrate'].includes(modeName)) {
        [[.13, .20, 44], [.88, .34, 64], [.72, .82, 38]].forEach(([xr, yr, radius], index) => {
            const ring = scene.add.circle(w * xr, h * yr, radius, 0x14b8a6, .003).setStrokeStyle(1.1, 0x14b8a6, .10);
            addFloatingMotif(scene, ring, { x: w * xr, y: h * yr, dx: index % 2 ? -12 : 12, dy: 14, duration: 7200 + index * 800 });
        });
    } else if (modeName === 'heads-up') {
        [[.12, .24, 34], [.83, .18, 54], [.75, .78, 42], [.18, .72, 24]].forEach(([xr, yr, radius], index) => {
            const bubble = scene.add.circle(w * xr, h * yr, radius, index % 2 ? 0xc084fc : 0x8b5cf6, .012)
                .setStrokeStyle(1, index % 2 ? 0xec4899 : 0x8b5cf6, .12);
            addFloatingMotif(scene, bubble, { x: w * xr, y: h * yr, dx: index % 2 ? -20 : 18, dy: -20, duration: 5600 + index * 650 });
        });
    } else if (modeName === 'taboo') {
        [[.12, .22, -24], [.82, .18, 28], [.78, .76, -18], [.14, .70, 32]].forEach(([xr, yr, angle], index) => {
            const color = index % 2 ? 0xfb923c : 0xf59e0b;
            const slash = scene.add.rectangle(w * xr, h * yr, 92, 3, color, .13).setAngle(angle);
            addFloatingMotif(scene, slash, { x: w * xr, y: h * yr, dx: index % 2 ? -18 : 16, dy: 14, duration: 6200 + index * 550, rotation: .04 });
        });
    }
}

function applyPartyjniakThemeMeta(modeName) {
    const meta = document.querySelector('meta[name="theme-color"]');
    const colors = {
        party: '#950f26',
        impostor: '#063b38', mystery: '#062e2c', discussion: '#063b38', vote: '#063b38', celebrate: '#063b38',
        'heads-up': '#4c1d95', taboo: '#7c2d12'
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
        const gameId = name === 'Impostor' ? 'impostor' : name === 'Czółko' ? 'heads-up' : name === 'Tabu' ? 'taboo' : null;
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
