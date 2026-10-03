const BACKGROUND_MODES = {
    party: {
        family: 'home',
        colors: [0x950f26, 0xd9465f, 0x8b5cf6, 0xf8fafc],
        alpha: [0.04, 0.16], speed: 0.82, confetti: false,
        motif: 'party', overlayMotif: 'party-aurora'
    },
    impostor: {
        family: 'impostor',
        colors: [0x14b8a6, 0x06b6d4, 0x8b5cf6, 0x334155],
        alpha: [0.05, 0.15], speed: 0.62, confetti: false,
        motif: 'impostor', overlayMotif: 'suspect-radar'
    },
    mystery: {
        family: 'impostor',
        colors: [0x14b8a6, 0x6366f1, 0x64748b, 0x0f172a],
        alpha: [0.04, 0.12], speed: 0.48, confetti: false,
        motif: 'impostor', overlayMotif: 'suspect-radar'
    },
    discussion: {
        family: 'impostor',
        colors: [0x06b6d4, 0x14b8a6, 0x22c55e, 0x334155],
        alpha: [0.04, 0.13], speed: 0.58, confetti: false,
        motif: 'discussion', overlayMotif: 'dialogue-network'
    },
    vote: {
        family: 'impostor',
        colors: [0x64748b, 0x14b8a6, 0x06b6d4, 0x1e293b],
        alpha: [0.04, 0.12], speed: 0.54, confetti: false,
        motif: 'vote', overlayMotif: 'verdict'
    },
    celebrate: {
        family: 'impostor',
        colors: [0x14b8a6, 0x8b5cf6, 0xec4899, 0xf8fafc],
        alpha: [0.07, 0.20], speed: 0.92, confetti: true,
        motif: 'celebrate', overlayMotif: 'victory-rings'
    },
    'ticking-bomb': {
        family: 'ticking-bomb',
        colors: [0xf97316, 0xfbbf24, 0xef4444, 0xfb923c],
        alpha: [0.06, 0.18], speed: 0.55, confetti: false,
        motif: 'ticking-bomb', overlayMotif: 'fuse-sparks'
    },
    'bomb-alert': {
        family: 'ticking-bomb',
        colors: [0xf97316, 0xfb923c, 0xfbbf24, 0xef4444],
        alpha: [0.09, 0.23], speed: 0.55, confetti: false,
        motif: 'bomb-alert', overlayMotif: 'shockwave'
    }
};

let backgroundMode = 'party';
let phaserGame = null;
let backgroundScene = null;

function setBackgroundMode(modeName) {
    backgroundMode = BACKGROUND_MODES[modeName] ? modeName : 'party';
    backgroundScene?.setMode(backgroundMode);
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
            this.halos = [];
            this.accents = [];
            this.dust = [];
            this.pointerTarget = { x: 0, y: 0 };
            this.visualFamily = null;
            this.profile = null;
            this.mode = null;
            this.modeName = 'party';
        }

        create() {
            backgroundScene = this;
            this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
            this.setMode(backgroundMode, { force: true });

            this.input.on('pointermove', pointer => {
                this.pointerTarget.x = (pointer.x / Math.max(1, this.scale.width) - 0.5) * 18;
                this.pointerTarget.y = (pointer.y / Math.max(1, this.scale.height) - 0.5) * 18;
            });

            this.input.on('pointerdown', pointer => {
                if (!this.reducedMotion) this.spawnBurst(pointer.x, pointer.y, 11);
            });
        }

        sceneMetrics() {
            const width = Math.max(1, this.scale.width);
            const height = Math.max(1, this.scale.height);
            const short = Math.max(240, Math.min(width, height));
            const uiScale = PhaserLib.Math.Clamp(short / 390, .90, 2.45);
            const densityScale = PhaserLib.Math.Clamp(Math.sqrt((width * height) / (390 * 844)), .86, 1.9);
            return { width, height, short, uiScale, densityScale };
        }

        resolveFamily(modeName, mode) {
            if (mode?.family) return mode.family;
            if (modeName === 'party') return 'home';
            if (['impostor', 'mystery', 'discussion', 'vote', 'celebrate'].includes(modeName)) return 'impostor';
            if (['ticking-bomb', 'bomb-alert'].includes(modeName)) return 'ticking-bomb';
            return modeName;
        }

        resolveVisualProfile(family) {
            const profiles = {
                home: {
                    behavior: 'party',
                    halos: [
                        [.18, .15, .78, .13, 0, 22, 18],
                        [.82, .30, .88, .11, 1, -18, 16],
                        [.50, .86, .98, .09, 2, 22, -14]
                    ],
                    accent: { count: 22, shapes: ['orb', 'star', 'spark'], size: [4.0, 9.0], alpha: [.14, .34], speed: [.16, .36], drift: 28 },
                    dust: { count: 58, size: [1.2, 2.9], alpha: [.08, .22], speed: [.08, .22] }
                },
                impostor: {
                    behavior: 'scan',
                    halos: [
                        [.20, .22, .72, .11, 0, 18, 12],
                        [.82, .72, .78, .09, 1, -16, -12]
                    ],
                    accent: { count: 24, shapes: ['spark', 'shard', 'orb', 'spark'], size: [3.8, 8.6], alpha: [.13, .32], speed: [.22, .50], drift: 18 },
                    dust: { count: 50, size: [1.15, 2.7], alpha: [.07, .20], speed: [.10, .25] }
                },
                'ticking-bomb': {
                    behavior: 'embers',
                    halos: [
                        [.50, .76, .88, .13, 0, 0, -20],
                        [.78, .28, .62, .09, 1, -12, 14]
                    ],
                    accent: { count: 24, shapes: ['spark', 'orb', 'spark', 'star'], size: [3.8, 8.4], alpha: [.14, .32], speed: [.14, .34], drift: 12 },
                    dust: { count: 52, size: [1.15, 2.7], alpha: [.07, .19], speed: [.06, .17] }
                },
                naokolo: {
                    behavior: 'ribbon',
                    halos: [
                        [.16, .24, .72, .11, 0, 24, 12],
                        [.84, .70, .78, .10, 1, -24, -14]
                    ],
                    accent: { count: 27, shapes: ['capsule', 'orb', 'spark', 'capsule'], size: [4.0, 9.2], alpha: [.15, .34], speed: [.24, .54], drift: 32 },
                    dust: { count: 56, size: [1.2, 2.9], alpha: [.08, .22], speed: [.13, .28] }
                },
                'co-mam-na-mysli': {
                    behavior: 'tilt',
                    halos: [
                        [.08, .48, .74, .11, 0, 28, 0],
                        [.92, .52, .78, .10, 1, -28, 0]
                    ],
                    accent: { count: 27, shapes: ['spark', 'orb', 'spark', 'capsule'], size: [4.0, 9.4], alpha: [.16, .38], speed: [.30, .72], drift: 19 },
                    dust: { count: 55, size: [1.2, 2.9], alpha: [.08, .22], speed: [.15, .32] }
                },
                'dzika-karta': {
                    behavior: 'cards',
                    halos: [
                        [.20, .22, .70, .10, 0, 20, 14],
                        [.82, .74, .78, .09, 1, -18, -14]
                    ],
                    accent: { count: 20, shapes: ['chip', 'chip', 'star', 'orb'], size: [4.3, 9.0], alpha: [.14, .33], speed: [.14, .34], drift: 30 },
                    dust: { count: 46, size: [1.2, 2.7], alpha: [.07, .19], speed: [.09, .22] }
                }
            };
            return profiles[family] || profiles.home;
        }

        clearVisuals() {
            this.halos.forEach(node => node?.destroy(true));
            [...this.accents, ...this.dust].forEach(node => node?.destroy());
            this.halos = [];
            this.accents = [];
            this.dust = [];
        }

        createHalo(definition, index) {
            const { width, height, short } = this.sceneMetrics();
            const [xr, yr, sizeRatio, alpha, colorIndex, driftX, driftY] = definition;
            const diameter = short * sizeRatio;
            const radius = diameter * .5;
            const color = this.mode.colors[colorIndex % this.mode.colors.length];
            const container = this.add.container(width * xr, height * yr);
            const rings = [
                [1.00, .10], [.84, .12], [.68, .14], [.52, .18], [.38, .22], [.25, .28]
            ];

            rings.forEach(([ratio, weight]) => {
                const circle = this.add.circle(0, 0, radius * ratio, color, alpha * weight);
                try { circle.setBlendMode?.('ADD'); } catch (_) {}
                container.add(circle);
            });

            container.baseX = container.x;
            container.baseY = container.y;
            container.phase = index * 1.7 + PhaserLib.Math.FloatBetween(0, 1);
            container.driftX = driftX;
            container.driftY = driftY;
            container.parallax = .08 + index * .025;
            this.halos.push(container);
        }

        createShape(shape, x, y, size, color, alpha) {
            if (shape === 'spark') {
                return this.add.rectangle(x, y, size * 3.2, Math.max(1.4, size * .38), color, 1)
                    .setAlpha(alpha)
                    .setAngle(PhaserLib.Math.Between(-34, 34));
            }
            if (shape === 'capsule') {
                return this.add.ellipse(x, y, size * 2.25, size * .82, color, 1)
                    .setAlpha(alpha)
                    .setAngle(PhaserLib.Math.Between(-28, 28));
            }
            if (shape === 'shard') {
                return this.add.triangle(x, y, 0, size, size * .85, 0, size * 1.7, size, color, 1)
                    .setAlpha(alpha)
                    .setAngle(PhaserLib.Math.Between(0, 359));
            }
            if (shape === 'chip') {
                return this.add.rectangle(x, y, size * 1.35, size * 1.9, color, 1)
                    .setAlpha(alpha)
                    .setAngle(PhaserLib.Math.Between(-30, 30));
            }
            if (shape === 'star') {
                return this.add.star(x, y, 4, Math.max(1.1, size * .38), size, color, 1)
                    .setAlpha(alpha)
                    .setAngle(45);
            }
            return this.add.circle(x, y, size, color, 1).setAlpha(alpha);
        }

        seedParticle(node, layer, index) {
            const { width, height } = this.sceneMetrics();
            const config = this.profile[layer];
            const speed = PhaserLib.Math.FloatBetween(config.speed[0], config.speed[1]);
            const angle = PhaserLib.Math.FloatBetween(0, Math.PI * 2);

            node.layer = layer;
            node.baseAlpha = node.alpha;
            node.phase = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
            node.twinkleSpeed = PhaserLib.Math.FloatBetween(.0010, .0024);
            node.vx = Math.cos(angle) * speed;
            node.vy = Math.sin(angle) * speed;
            node.wave = PhaserLib.Math.FloatBetween(5, config.drift || 18);
            node.spin = PhaserLib.Math.FloatBetween(-.004, .004);
            node.parallax = layer === 'accent' ? PhaserLib.Math.FloatBetween(.10, .24) : PhaserLib.Math.FloatBetween(.03, .10);
            node.direction = index % 2 ? 1 : -1;
            node.baseY = node.y;
            node.centerX = width * .5;
            node.centerY = height * .52;
        }

        createParticleLayer(layer) {
            const { width, height, uiScale, densityScale } = this.sceneMetrics();
            const config = this.profile[layer];
            const count = this.reducedMotion
                ? Math.max(6, Math.round(config.count * .32))
                : Math.round(config.count * densityScale);
            const target = layer === 'accent' ? this.accents : this.dust;
            const shapes = layer === 'accent' ? config.shapes : ['orb'];

            for (let i = 0; i < count; i++) {
                const shape = shapes[i % shapes.length];
                const size = PhaserLib.Math.FloatBetween(config.size[0], config.size[1]) * uiScale;
                const alpha = PhaserLib.Math.FloatBetween(config.alpha[0], config.alpha[1]);
                const x = PhaserLib.Math.FloatBetween(-width * .04, width * 1.04);
                const y = PhaserLib.Math.FloatBetween(-height * .04, height * 1.04);
                const color = this.mode.colors[i % this.mode.colors.length];
                const node = this.createShape(shape, x, y, size, color, alpha);
                try { node.setBlendMode?.('ADD'); } catch (_) {}
                this.seedParticle(node, layer, i);
                target.push(node);
            }
        }

        rebuildVisuals() {
            if (!this.mode || !this.profile) return;
            this.clearVisuals();
            this.profile.halos.forEach((definition, index) => this.createHalo(definition, index));
            this.createParticleLayer('accent');
            this.createParticleLayer('dust');
        }

        setMode(modeName, { force = false } = {}) {
            const nextMode = BACKGROUND_MODES[modeName] || BACKGROUND_MODES.party;
            const nextFamily = this.resolveFamily(modeName, nextMode);
            this.modeName = modeName;

            // A game's background is intentionally continuous. Screen changes inside the
            // same game must not destroy/reseed particles or change the visual composition.
            if (!force && this.visualFamily === nextFamily && this.profile && this.mode) return;

            this.visualFamily = nextFamily;
            this.mode = nextMode;
            this.profile = this.resolveVisualProfile(nextFamily);
            this.rebuildVisuals();
        }

        resetParticle(node, behavior) {
            const { width, height } = this.sceneMetrics();
            if (behavior === 'embers') {
                node.x = PhaserLib.Math.FloatBetween(-20, width + 20);
                node.y = height + PhaserLib.Math.Between(12, 80);
                return;
            }
            if (['scan', 'ribbon', 'tilt'].includes(behavior)) {
                node.x = node.direction > 0 ? -60 : width + 60;
                node.y = PhaserLib.Math.FloatBetween(-10, height + 10);
                return;
            }
            node.x = PhaserLib.Math.FloatBetween(-20, width + 20);
            node.y = PhaserLib.Math.FloatBetween(-20, height + 20);
        }

        wrapParticle(node, margin = 80) {
            const { width, height } = this.sceneMetrics();
            if (node.x < -margin) node.x = width + margin;
            if (node.x > width + margin) node.x = -margin;
            if (node.y < -margin) node.y = height + margin;
            if (node.y > height + margin) node.y = -margin;
        }

        updateParticle(node, behavior, time, dt, speedMultiplier) {
            const { width, uiScale } = this.sceneMetrics();
            const layerFactor = node.layer === 'accent' ? 1 : .58;
            const baseSpeed = speedMultiplier * layerFactor * uiScale;

            if (behavior === 'embers') {
                node.y -= Math.max(.08, Math.abs(node.vy)) * baseSpeed * dt * .92;
                node.x += Math.sin(time * .00075 + node.phase) * .065 * node.wave;
                if (node.y < -80) this.resetParticle(node, behavior);
            } else if (behavior === 'scan') {
                const directionSpeed = Math.max(.22, Math.abs(node.vx)) * node.direction;
                node.x += directionSpeed * baseSpeed * dt;
                node.y += Math.sin(time * .0013 + node.phase) * .045 * node.wave;
                if (node.x < -100 || node.x > width + 100) this.resetParticle(node, behavior);
            } else if (behavior === 'ribbon' || behavior === 'tilt') {
                const multiplier = behavior === 'tilt' ? 1.45 : 1.0;
                const directionSpeed = Math.max(.20, Math.abs(node.vx)) * node.direction;
                node.x += directionSpeed * baseSpeed * dt * multiplier;
                node.y += Math.sin(time * (behavior === 'tilt' ? .0019 : .00145) + node.phase) * .07 * node.wave;
                if (node.x < -110 || node.x > width + 110) this.resetParticle(node, behavior);
            } else if (behavior === 'cards') {
                node.x += node.vx * baseSpeed * dt * .72;
                node.y += node.vy * baseSpeed * dt * .72;
                node.rotation += node.spin * dt;
                this.wrapParticle(node);
            } else {
                node.x += node.vx * baseSpeed * dt;
                node.y += node.vy * baseSpeed * dt;
                node.x += Math.sin(time * .0009 + node.phase) * .035 * node.wave;
                this.wrapParticle(node);
            }

            node.x += this.pointerTarget.x * node.parallax * .012;
            node.y += this.pointerTarget.y * node.parallax * .012;
            node.alpha = PhaserLib.Math.Clamp(
                node.baseAlpha + Math.sin(time * node.twinkleSpeed + node.phase) * (node.layer === 'accent' ? .055 : .032),
                .035,
                .55
            );
            if (node.layer === 'accent' && 'rotation' in node) node.rotation += node.spin * dt * .35;
        }

        updateHalos(time) {
            this.halos.forEach(halo => {
                if (!halo?.active) return;
                const wave = time * .00025 + halo.phase;
                halo.x = halo.baseX + Math.sin(wave) * halo.driftX + this.pointerTarget.x * halo.parallax;
                halo.y = halo.baseY + Math.cos(wave * 1.17) * halo.driftY + this.pointerTarget.y * halo.parallax;
                const pulse = 1 + Math.sin(wave * 1.35) * .045;
                halo.setScale(pulse);
            });
        }

        spawnBurst(x, y, count = 10) {
            if (!this.mode) return;
            const { uiScale } = this.sceneMetrics();
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + PhaserLib.Math.FloatBetween(-.12, .12);
                const distance = PhaserLib.Math.Between(42, 118) * uiScale;
                const size = PhaserLib.Math.FloatBetween(2.2, 4.8) * uiScale;
                const node = this.createShape(i % 3 === 0 ? 'spark' : 'orb', x, y, size, this.mode.colors[i % this.mode.colors.length], .56);
                try { node.setBlendMode?.('ADD'); } catch (_) {}
                this.tweens.add({
                    targets: node,
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    scaleX: .15,
                    scaleY: .15,
                    alpha: 0,
                    duration: PhaserLib.Math.Between(520, 880),
                    ease: 'Cubic.Out',
                    onComplete: () => node.destroy()
                });
            }
        }

        update(time, delta) {
            if (!this.mode || document.visibilityState !== 'visible') return;
            const dt = Math.min(32, delta) / 16.67;
            const speedMultiplier = this.reducedMotion ? .12 : Math.max(.55, this.mode.speed || 1);
            const behavior = this.profile?.behavior || 'party';

            this.updateHalos(time);
            this.accents.forEach(node => this.updateParticle(node, behavior, time, dt, speedMultiplier));
            this.dust.forEach(node => this.updateParticle(node, behavior, time, dt, speedMultiplier * .72));
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
        backgroundScene?.rebuildVisuals();
    });
}

window.addEventListener('load', initializePhaserBackground, { once: true });
