const BACKGROUND_MODES = {
    party: { colors: [0x950f26, 0xd9465f, 0x8b5cf6, 0xf8fafc], alpha: [0.04, 0.16], speed: 0.82, confetti: false, motif: 'party' },
    impostor: { colors: [0x14b8a6, 0x06b6d4, 0x8b5cf6, 0x334155], alpha: [0.05, 0.15], speed: 0.62, confetti: false, motif: 'impostor' },
    mystery: { colors: [0x14b8a6, 0x6366f1, 0x64748b, 0x0f172a], alpha: [0.04, 0.12], speed: 0.48, confetti: false, motif: 'impostor' },
    discussion: { colors: [0x06b6d4, 0x14b8a6, 0x22c55e, 0x334155], alpha: [0.04, 0.13], speed: 0.58, confetti: false, motif: 'discussion' },
    vote: { colors: [0x64748b, 0x14b8a6, 0x06b6d4, 0x1e293b], alpha: [0.04, 0.12], speed: 0.54, confetti: false, motif: 'vote' },
    celebrate: { colors: [0x14b8a6, 0x8b5cf6, 0xec4899, 0xf8fafc], alpha: [0.07, 0.20], speed: 0.92, confetti: true, motif: 'celebrate' },
    'ticking-bomb': { colors: [0xf97316, 0xfbbf24, 0xef4444, 0xfb923c], alpha: [0.06, 0.18], speed: 0.74, confetti: false, motif: 'ticking-bomb' },
    'bomb-alert': { colors: [0xf97316, 0xfb923c, 0xfbbf24, 0xef4444], alpha: [0.09, 0.23], speed: 1.02, confetti: false, motif: 'bomb-alert' }
};

let backgroundMode = 'party';
let phaserGame = null;
let backgroundScene = null;

function setBackgroundMode(modeName) {
    backgroundMode = BACKGROUND_MODES[modeName] ? modeName : 'party';
    backgroundScene?.setMode(backgroundMode);

    // Tykająca Bomba ma teraz własny pełny motyw w BackgroundScene.
    // Stare dodatkowe motywy z warstwy integracyjnej czyścimy po zakończeniu
    // bieżącego stosu wywołań, aby dwa systemy nie nakładały się na siebie.
    if (['ticking-bomb', 'bomb-alert'].includes(backgroundMode)) {
        queueMicrotask(() => {
            if (typeof clearPartyjniakThemeMotifs === 'function') clearPartyjniakThemeMotifs();
        });
    }
}

function initializePhaserBackground() {
    const PhaserLib = window.Phaser;
    if (!PhaserLib) {
        console.warn('Phaser nie został załadowany. Partyjniak działa bez animowanego tła.');
        return;
    }

    const container = document.getElementById('phaser-bg');
    if (!container) return;

    class BackgroundScene extends PhaserLib.Scene {
        constructor() {
            super({ key: 'BackgroundScene' });
            this.motes = [];
            this.confetti = [];
            this.decor = [];
            this.floaters = [];
            this.pointerTarget = { x: 0, y: 0 };
        }

        create() {
            backgroundScene = this;
            this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
            this.createMotes();
            this.createConfetti();
            this.setMode(backgroundMode, { immediate: true });

            this.input.on('pointermove', pointer => {
                this.pointerTarget.x = (pointer.x / Math.max(1, this.scale.width) - 0.5) * 12;
                this.pointerTarget.y = (pointer.y / Math.max(1, this.scale.height) - 0.5) * 12;
            });

            this.input.on('pointerdown', pointer => {
                if (!this.reducedMotion) this.spawnBurst(pointer.x, pointer.y, 7);
            });
        }

        createMotes() {
            const count = this.reducedMotion ? 12 : 24;
            for (let i = 0; i < count; i++) {
                const mote = this.add.circle(
                    PhaserLib.Math.Between(0, this.scale.width),
                    PhaserLib.Math.Between(0, this.scale.height),
                    PhaserLib.Math.FloatBetween(1.1, 3.2),
                    0xffffff,
                    PhaserLib.Math.FloatBetween(.035, .10)
                );
                mote.depthFactor = PhaserLib.Math.FloatBetween(.35, 1);
                mote.speedX = PhaserLib.Math.FloatBetween(-.07, .07) * mote.depthFactor;
                mote.speedY = PhaserLib.Math.FloatBetween(-.18, -.05) * mote.depthFactor;
                mote.phase = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
                mote.twinkleSpeed = PhaserLib.Math.FloatBetween(.0004, .0012);
                mote.baseAlpha = mote.fillAlpha || .07;
                this.motes.push(mote);
            }
        }

        createConfetti() {
            const count = this.reducedMotion ? 0 : 12;
            for (let i = 0; i < count; i++) {
                const rect = this.add.rectangle(
                    PhaserLib.Math.Between(0, this.scale.width),
                    PhaserLib.Math.Between(0, this.scale.height),
                    PhaserLib.Math.Between(2, 4),
                    PhaserLib.Math.Between(7, 13),
                    0x8b5cf6,
                    PhaserLib.Math.FloatBetween(.08, .18)
                );
                rect.speedY = PhaserLib.Math.FloatBetween(.09, .22);
                rect.speedX = PhaserLib.Math.FloatBetween(-.05, .05);
                rect.rotationSpeed = PhaserLib.Math.FloatBetween(-.006, .006);
                this.confetti.push(rect);
            }
        }

        setMode(modeName, { immediate = false } = {}) {
            const mode = BACKGROUND_MODES[modeName] || BACKGROUND_MODES.party;
            this.modeName = modeName;
            this.mode = mode;
            this.motif = mode.motif || modeName;

            this.motes.forEach((mote, index) => {
                const alpha = PhaserLib.Math.FloatBetween(mode.alpha[0], mode.alpha[1]);
                mote.baseAlpha = alpha;
                mote.setFillStyle(mode.colors[index % mode.colors.length], alpha);
            });

            this.confetti.forEach((rect, index) => {
                rect.setVisible(Boolean(mode.confetti));
                if (mode.confetti) rect.setFillStyle(mode.colors[index % mode.colors.length], PhaserLib.Math.FloatBetween(.08, .18));
            });

            this.rebuildDecor();

            if (!immediate && modeName === 'celebrate' && !this.reducedMotion) {
                this.spawnBurst(this.scale.width * .5, this.scale.height * .34, 18);
            }
        }

        clearDecor() {
            this.decor.forEach(node => node?.destroy());
            this.decor = [];
            this.floaters = [];
        }

        addFloater(node, options = {}) {
            const item = {
                node,
                baseX: options.x ?? node.x,
                baseY: options.y ?? node.y,
                dx: options.dx ?? 14,
                dy: options.dy ?? 12,
                duration: options.duration ?? 7000,
                rotate: options.rotate ?? 0,
                alphaSwing: options.alphaSwing ?? .03,
                baseAlpha: options.baseAlpha ?? node.alpha ?? 1,
                depthFactor: options.depthFactor ?? .2,
                phase: PhaserLib.Math.FloatBetween(0, Math.PI * 2)
            };
            this.decor.push(node);
            this.floaters.push(item);
            return node;
        }

        rebuildDecor() {
            this.clearDecor();
            const builder = {
                party: () => this.buildPartyBackdrop(),
                impostor: () => this.buildImpostorBackdrop(),
                discussion: () => this.buildDiscussionBackdrop(),
                vote: () => this.buildVoteBackdrop(),
                celebrate: () => this.buildCelebrateBackdrop(),
                'ticking-bomb': () => this.buildBombBackdrop(false),
                'bomb-alert': () => this.buildBombBackdrop(true)
            }[this.motif] || (() => this.buildPartyBackdrop());
            builder();
        }

        buildPartyBackdrop() {
            const w = this.scale.width;
            const h = this.scale.height;
            const colors = this.mode.colors;
            [
                [.13, .19, 300, 165, -18],
                [.88, .30, 345, 185, 17],
                [.48, .87, 410, 210, -7]
            ].forEach(([xr, yr, width, height, angle], index) => {
                const blob = this.add.ellipse(w * xr, h * yr, width, height, colors[index % colors.length], .045).setAngle(angle);
                this.addFloater(blob, { dx: 18, dy: 13, duration: 9000 + index * 700, rotate: .0015 * (index % 2 ? 1 : -1), alphaSwing: .018, depthFactor: .14 });
            });

            for (let i = 0; i < 11; i++) {
                const card = this.add.rectangle(
                    PhaserLib.Math.Between(10, w - 10),
                    PhaserLib.Math.Between(10, h - 10),
                    PhaserLib.Math.Between(22, 46),
                    PhaserLib.Math.Between(7, 13),
                    colors[i % colors.length],
                    .09
                ).setAngle(PhaserLib.Math.Between(-42, 42));
                card.setStrokeStyle(1, 0xffffff, .06);
                this.addFloater(card, { dx: PhaserLib.Math.Between(-16, 16), dy: PhaserLib.Math.Between(-16, 16), duration: PhaserLib.Math.Between(6200, 9800), rotate: PhaserLib.Math.FloatBetween(-.003, .003), alphaSwing: .025, depthFactor: .24 });
            }

            for (let i = 0; i < 7; i++) {
                const star = this.add.star(PhaserLib.Math.Between(18, w - 18), PhaserLib.Math.Between(18, h - 18), 4, 2.5, 7, colors[(i + 1) % colors.length], .12).setAngle(45);
                this.addFloater(star, { dx: 10, dy: 12, duration: 5000 + i * 280, rotate: .009, alphaSwing: .05, depthFactor: .31 });
            }
        }

        buildImpostorBackdrop() {
            const w = this.scale.width;
            const h = this.scale.height;
            const colors = this.mode.colors;
            [
                [.16, .22, 205],
                [.84, .33, 280],
                [.52, .84, 325]
            ].forEach(([xr, yr, size], index) => {
                const diamond = this.add.rectangle(w * xr, h * yr, size, size, colors[index % 3], .028).setAngle(45);
                diamond.setStrokeStyle(1, colors[(index + 1) % 3], .10);
                this.addFloater(diamond, { dx: 12, dy: 10, duration: 9400 + index * 600, rotate: .0014 * (index % 2 ? 1 : -1), alphaSwing: .014, depthFactor: .12 });
            });

            for (let i = 0; i < 13; i++) {
                const slash = this.add.rectangle(
                    PhaserLib.Math.Between(-20, w + 20),
                    PhaserLib.Math.Between(0, h),
                    PhaserLib.Math.Between(42, 118),
                    2,
                    colors[i % 3],
                    .13
                ).setAngle(-32);
                this.addFloater(slash, { dx: PhaserLib.Math.Between(-18, 18), dy: PhaserLib.Math.Between(-10, 10), duration: PhaserLib.Math.Between(5000, 8200), rotate: .002, alphaSwing: .04, depthFactor: .34 });
            }

            for (let i = 0; i < 8; i++) {
                const shard = this.add.triangle(
                    PhaserLib.Math.Between(18, w - 18),
                    PhaserLib.Math.Between(18, h - 18),
                    0, 22, 22, 0, 44, 22,
                    colors[(i + 2) % 3],
                    .075
                ).setAngle(PhaserLib.Math.Between(0, 360));
                this.addFloater(shard, { dx: PhaserLib.Math.Between(-14, 14), dy: PhaserLib.Math.Between(-14, 14), duration: PhaserLib.Math.Between(7000, 10400), rotate: PhaserLib.Math.FloatBetween(-.003, .003), alphaSwing: .025, depthFactor: .26 });
            }
        }

        buildDiscussionBackdrop() {
            const w = this.scale.width;
            const h = this.scale.height;
            const colors = this.mode.colors;
            for (let i = 0; i < 9; i++) {
                const x = w * (.12 + (i % 3) * .38);
                const y = h * (.16 + Math.floor(i / 3) * .32);
                const capsule = this.add.ellipse(x, y, PhaserLib.Math.Between(105, 145), PhaserLib.Math.Between(38, 58), colors[i % colors.length], .048).setAngle(PhaserLib.Math.Between(-22, 22));
                capsule.setStrokeStyle(1, colors[(i + 1) % colors.length], .08);
                this.addFloater(capsule, { dx: 10, dy: 8, duration: 7200 + i * 220, rotate: .0015, alphaSwing: .02, depthFactor: .20 });
            }
        }

        buildVoteBackdrop() {
            const w = this.scale.width;
            const h = this.scale.height;
            const colors = this.mode.colors;
            for (let i = 0; i < 15; i++) {
                const bar = this.add.rectangle(
                    PhaserLib.Math.Between(10, w - 10),
                    PhaserLib.Math.Between(10, h - 10),
                    PhaserLib.Math.Between(54, 118),
                    PhaserLib.Math.Between(7, 11),
                    colors[i % colors.length],
                    .07
                ).setAngle(-18);
                this.addFloater(bar, { dx: PhaserLib.Math.Between(-11, 11), dy: PhaserLib.Math.Between(-9, 9), duration: PhaserLib.Math.Between(6500, 9300), rotate: PhaserLib.Math.FloatBetween(-.002, .002), alphaSwing: .018, depthFactor: .25 });
            }
        }

        buildCelebrateBackdrop() {
            this.buildPartyBackdrop();
            if (this.reducedMotion) return;
            const w = this.scale.width;
            const h = this.scale.height;
            const colors = this.mode.colors;
            for (let i = 0; i < 9; i++) {
                const star = this.add.star(PhaserLib.Math.Between(16, w - 16), PhaserLib.Math.Between(16, h - 16), 5, 3.5, 10, colors[i % colors.length], .14);
                this.addFloater(star, { dx: PhaserLib.Math.Between(-16, 16), dy: PhaserLib.Math.Between(-16, 16), duration: PhaserLib.Math.Between(4300, 7400), rotate: PhaserLib.Math.FloatBetween(-.009, .009), alphaSwing: .07, depthFactor: .38 });
            }
        }

        buildBombBackdrop(alertMode = false) {
            const w = this.scale.width;
            const h = this.scale.height;
            const colors = this.mode.colors;
            const centers = alertMode
                ? [[.10, .20, 72], [.86, .28, 90], [.24, .78, 82], [.78, .83, 64]]
                : [[.10, .20, 56], [.86, .29, 72], [.22, .78, 68], [.77, .84, 52]];

            centers.forEach(([xr, yr, radius], index) => {
                const x = w * xr;
                const y = h * yr;
                const burst = this.add.star(x, y, 10, radius * .34, radius, colors[index % colors.length], alertMode ? .028 : .018);
                burst.setStrokeStyle(1.2, colors[(index + 1) % colors.length], alertMode ? .21 : .13);
                this.addFloater(burst, { x, y, dx: 14, dy: 13, duration: 6000 + index * 430, rotate: .006 * (index % 2 ? 1 : -1), alphaSwing: .018, depthFactor: .17 });

                const ring = this.add.circle(x, y, radius * .72, colors[(index + 2) % colors.length], .004);
                ring.setStrokeStyle(alertMode ? 2 : 1.4, colors[(index + 2) % colors.length], alertMode ? .19 : .11);
                this.addFloater(ring, { x, y, dx: 10, dy: 11, duration: 6900 + index * 500, alphaSwing: .016, depthFactor: .13 });
            });

            for (let i = 0; i < 17; i++) {
                const spark = this.add.rectangle(
                    PhaserLib.Math.Between(8, w - 8),
                    PhaserLib.Math.Between(8, h - 8),
                    PhaserLib.Math.Between(11, 25),
                    2.2,
                    colors[i % colors.length],
                    alertMode ? .19 : .12
                ).setAngle(PhaserLib.Math.Between(0, 180));
                this.addFloater(spark, { dx: PhaserLib.Math.Between(-17, 17), dy: PhaserLib.Math.Between(-17, 17), duration: PhaserLib.Math.Between(4500, 7800), rotate: PhaserLib.Math.FloatBetween(-.006, .006), alphaSwing: .035, depthFactor: .34 });
            }
        }

        spawnBurst(x, y, count = 8) {
            const mode = this.mode || BACKGROUND_MODES.party;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + PhaserLib.Math.FloatBetween(-.15, .15);
                const distance = PhaserLib.Math.Between(28, 82);
                const dot = this.add.circle(x, y, PhaserLib.Math.FloatBetween(1.8, 3.5), mode.colors[i % mode.colors.length], .40);
                this.tweens.add({
                    targets: dot,
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    scale: .25,
                    alpha: 0,
                    duration: PhaserLib.Math.Between(420, 720),
                    ease: 'Cubic.Out',
                    onComplete: () => dot.destroy()
                });
            }
        }

        update(time, delta) {
            if (!this.mode || document.visibilityState !== 'visible') return;
            const speed = this.reducedMotion ? .18 : this.mode.speed;
            const dt = Math.min(32, delta) / 16.67;

            this.motes.forEach(mote => {
                mote.x += mote.speedX * speed * dt;
                mote.y += mote.speedY * speed * dt;
                mote.alpha = PhaserLib.Math.Clamp(mote.baseAlpha + Math.sin(time * mote.twinkleSpeed + mote.phase) * .025, .015, .26);

                if (mote.y < -16) mote.y = this.scale.height + 16;
                if (mote.x < -16) mote.x = this.scale.width + 16;
                if (mote.x > this.scale.width + 16) mote.x = -16;
            });

            this.floaters.forEach(item => {
                const node = item.node;
                if (!node?.active) return;
                const t = time / item.duration + item.phase;
                node.x = item.baseX + Math.sin(t) * item.dx + this.pointerTarget.x * item.depthFactor;
                node.y = item.baseY + Math.cos(t * 1.13) * item.dy + this.pointerTarget.y * item.depthFactor;
                node.alpha = PhaserLib.Math.Clamp(item.baseAlpha + Math.sin(t * 1.37) * item.alphaSwing, .012, .32);
                if (item.rotate) node.rotation += item.rotate * speed * dt;
            });

            this.confetti.forEach(rect => {
                if (!rect.visible) return;
                rect.y += rect.speedY * speed * dt;
                rect.x += rect.speedX * speed * dt;
                rect.rotation += rect.rotationSpeed * speed * dt;
                if (rect.y > this.scale.height + 20) {
                    rect.y = -20;
                    rect.x = PhaserLib.Math.Between(0, this.scale.width);
                }
            });
        }
    }

    phaserGame = new PhaserLib.Game({
        type: PhaserLib.AUTO,
        parent: 'phaser-bg',
        width: window.innerWidth,
        height: window.innerHeight,
        transparent: true,
        scene: BackgroundScene,
        render: { antialias: true, powerPreference: 'low-power' },
        fps: { target: 45, forceSetTimeOut: false }
    });

    window.addEventListener('resize', () => {
        phaserGame?.scale?.resize(window.innerWidth, window.innerHeight);
        backgroundScene?.rebuildDecor?.();
    });
}

window.addEventListener('load', initializePhaserBackground, { once: true });
