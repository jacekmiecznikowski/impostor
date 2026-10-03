const BACKGROUND_MODES = {
    party: {
        colors: [0x950f26, 0xd9465f, 0x8b5cf6, 0xf8fafc],
        alpha: [0.04, 0.16],
        speed: 0.82,
        confetti: false,
        motif: 'party',
        overlayMotif: 'party-aurora'
    },
    impostor: {
        colors: [0x14b8a6, 0x06b6d4, 0x8b5cf6, 0x334155],
        alpha: [0.05, 0.15],
        speed: 0.62,
        confetti: false,
        motif: 'impostor',
        overlayMotif: 'suspect-radar'
    },
    mystery: {
        colors: [0x14b8a6, 0x6366f1, 0x64748b, 0x0f172a],
        alpha: [0.04, 0.12],
        speed: 0.48,
        confetti: false,
        motif: 'impostor',
        overlayMotif: 'suspect-radar'
    },
    discussion: {
        colors: [0x06b6d4, 0x14b8a6, 0x22c55e, 0x334155],
        alpha: [0.04, 0.13],
        speed: 0.58,
        confetti: false,
        motif: 'discussion',
        overlayMotif: 'dialogue-network'
    },
    vote: {
        colors: [0x64748b, 0x14b8a6, 0x06b6d4, 0x1e293b],
        alpha: [0.04, 0.12],
        speed: 0.54,
        confetti: false,
        motif: 'vote',
        overlayMotif: 'verdict'
    },
    celebrate: {
        colors: [0x14b8a6, 0x8b5cf6, 0xec4899, 0xf8fafc],
        alpha: [0.07, 0.20],
        speed: 0.92,
        confetti: true,
        motif: 'celebrate',
        overlayMotif: 'victory-rings'
    },
    'ticking-bomb': {
        colors: [0xf97316, 0xfbbf24, 0xef4444, 0xfb923c],
        alpha: [0.06, 0.18],
        speed: 0.74,
        confetti: false,
        motif: 'ticking-bomb',
        overlayMotif: 'fuse-sparks'
    },
    'bomb-alert': {
        colors: [0xf97316, 0xfb923c, 0xfbbf24, 0xef4444],
        alpha: [0.09, 0.23],
        speed: 1.02,
        confetti: false,
        motif: 'bomb-alert',
        overlayMotif: 'shockwave'
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
            this.glows = [];
            this.accents = [];
            this.dust = [];
            this.pointerTarget = { x: 0, y: 0 };
            this.profile = null;
            this.mode = null;
            this.modeName = 'party';
        }

        create() {
            backgroundScene = this;
            this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
            this.ensureGlowTexture();
            this.setMode(backgroundMode, { immediate: true });

            this.input.on('pointermove', pointer => {
                this.pointerTarget.x = (pointer.x / Math.max(1, this.scale.width) - 0.5) * 18;
                this.pointerTarget.y = (pointer.y / Math.max(1, this.scale.height) - 0.5) * 18;
            });

            this.input.on('pointerdown', pointer => {
                if (!this.reducedMotion) this.spawnBurst(pointer.x, pointer.y, 11);
            });
        }

        ensureGlowTexture() {
            const key = 'partyjniak-soft-glow-v2';
            if (this.textures.exists(key)) {
                this.glowTextureKey = key;
                return;
            }

            const texture = this.textures.createCanvas(key, 256, 256);
            const context = texture.getContext();
            const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128);
            gradient.addColorStop(0, 'rgba(255,255,255,1)');
            gradient.addColorStop(.22, 'rgba(255,255,255,.68)');
            gradient.addColorStop(.56, 'rgba(255,255,255,.20)');
            gradient.addColorStop(1, 'rgba(255,255,255,0)');
            context.clearRect(0, 0, 256, 256);
            context.fillStyle = gradient;
            context.fillRect(0, 0, 256, 256);
            texture.refresh();
            this.glowTextureKey = key;
        }

        sceneMetrics() {
            const width = Math.max(1, this.scale.width);
            const height = Math.max(1, this.scale.height);
            const short = Math.max(240, Math.min(width, height));
            const uiScale = PhaserLib.Math.Clamp(short / 390, .90, 2.45);
            const densityScale = PhaserLib.Math.Clamp(Math.sqrt((width * height) / (390 * 844)), .86, 1.9);
            return { width, height, short, uiScale, densityScale };
        }

        resolveVisualProfile(modeName, mode) {
            const key = mode.overlayMotif || mode.motif || modeName;
            const profiles = {
                'party-aurora': {
                    behavior: 'party',
                    glows: [
                        [.18, .14, .78, .12, 0, 22, 18],
                        [.82, .28, .90, .10, 1, -18, 16],
                        [.48, .86, 1.04, .08, 2, 24, -14]
                    ],
                    accent: { count: 18, shapes: ['orb','star','spark'], size: [4.2, 9.2], alpha: [.14,.34], speed: [.16,.36], drift: 28 },
                    dust: { count: 54, size: [1.25, 2.9], alpha: [.08,.22], speed: [.08,.22] }
                },
                'suspect-radar': {
                    behavior: modeName === 'mystery' ? 'stealth' : 'scan',
                    glows: [
                        [.24, .20, .72, .10, 0, 18, 12],
                        [.82, .72, .82, .08, 1, -16, -12]
                    ],
                    accent: { count: modeName === 'mystery' ? 14 : 20, shapes: ['spark','shard','orb'], size: [3.8, 8.4], alpha: [.12,.31], speed: [.22,.50], drift: 18 },
                    dust: { count: 46, size: [1.15, 2.6], alpha: [.07,.19], speed: [.10,.25] }
                },
                'dialogue-network': {
                    behavior: 'crossflow',
                    glows: [
                        [.16, .34, .70, .09, 0, 20, 16],
                        [.86, .58, .74, .08, 2, -22, -18]
                    ],
                    accent: { count: 22, shapes: ['capsule','orb','capsule'], size: [4.0, 8.6], alpha: [.12,.30], speed: [.16,.40], drift: 24 },
                    dust: { count: 50, size: [1.2, 2.7], alpha: [.07,.20], speed: [.09,.24] }
                },
                verdict: {
                    behavior: 'lift',
                    glows: [
                        [.50, .78, .80, .09, 0, 0, -18],
                        [.52, .18, .64, .07, 1, 0, 16]
                    ],
                    accent: { count: 20, shapes: ['diamond','spark','orb'], size: [3.8, 8.0], alpha: [.12,.30], speed: [.18,.44], drift: 12 },
                    dust: { count: 44, size: [1.15, 2.5], alpha: [.07,.18], speed: [.10,.23] }
                },
                'victory-rings': {
                    behavior: 'celebrate',
                    glows: [
                        [.24, .22, .78, .12, 0, 20, 18],
                        [.76, .32, .86, .11, 1, -18, 16],
                        [.52, .82, .94, .09, 2, 14, -14]
                    ],
                    accent: { count: 30, shapes: ['star','chip','spark','orb'], size: [4.0, 9.5], alpha: [.18,.42], speed: [.20,.50], drift: 34 },
                    dust: { count: 62, size: [1.3, 3.1], alpha: [.09,.24], speed: [.12,.28] }
                },
                'fuse-sparks': {
                    behavior: 'embers',
                    glows: [
                        [.50, .74, .92, .12, 0, 0, -20],
                        [.76, .28, .64, .08, 1, -12, 14]
                    ],
                    accent: { count: 25, shapes: ['spark','orb','spark','star'], size: [4.2, 9.0], alpha: [.18,.40], speed: [.24,.60], drift: 20 },
                    dust: { count: 56, size: [1.2, 3.0], alpha: [.09,.23], speed: [.12,.30] }
                },
                shockwave: {
                    behavior: 'blast',
                    glows: [
                        [.50, .52, 1.02, .17, 0, 0, 0],
                        [.50, .52, .66, .12, 1, 0, 0]
                    ],
                    accent: { count: 34, shapes: ['spark','star','orb'], size: [4.5, 10.2], alpha: [.22,.48], speed: [.42,.92], drift: 0 },
                    dust: { count: 68, size: [1.35, 3.4], alpha: [.11,.28], speed: [.22,.50] }
                },
                'orbit-words': {
                    behavior: 'ribbon',
                    glows: [
                        [.18, .22, .72, .10, 0, 22, 12],
                        [.82, .72, .78, .09, 1, -22, -14]
                    ],
                    accent: { count: 22, shapes: ['capsule','orb','spark'], size: [4.0, 9.0], alpha: [.14,.32], speed: [.20,.46], drift: 30 },
                    dust: { count: 52, size: [1.2, 2.8], alpha: [.08,.21], speed: [.12,.26] }
                },
                'orbit-fast': {
                    behavior: 'rush',
                    glows: [
                        [.14, .28, .74, .10, 0, 28, 10],
                        [.88, .66, .82, .10, 2, -28, -10]
                    ],
                    accent: { count: 28, shapes: ['spark','capsule','orb'], size: [4.0, 9.4], alpha: [.16,.37], speed: [.34,.76], drift: 36 },
                    dust: { count: 60, size: [1.2, 3.0], alpha: [.09,.24], speed: [.18,.36] }
                },
                'orbit-celebrate': {
                    behavior: 'celebrate',
                    glows: [
                        [.20, .20, .78, .12, 0, 22, 18],
                        [.80, .32, .82, .11, 1, -20, 18],
                        [.52, .82, .92, .09, 2, 16, -16]
                    ],
                    accent: { count: 30, shapes: ['star','capsule','spark','orb'], size: [4.0, 9.4], alpha: [.18,.42], speed: [.22,.52], drift: 34 },
                    dust: { count: 62, size: [1.3, 3.1], alpha: [.09,.25], speed: [.14,.30] }
                },
                'thought-field': {
                    behavior: 'bokeh',
                    glows: [
                        [.24, .20, .78, .10, 0, 20, 18],
                        [.82, .68, .82, .09, 1, -18, -16]
                    ],
                    accent: { count: 18, shapes: ['orb','orb','capsule'], size: [5.0, 11.5], alpha: [.10,.26], speed: [.12,.30], drift: 26 },
                    dust: { count: 46, size: [1.25, 2.8], alpha: [.07,.19], speed: [.09,.22] }
                },
                gyro: {
                    behavior: 'tilt',
                    glows: [
                        [.08, .50, .78, .11, 0, 28, 0],
                        [.92, .50, .82, .10, 1, -28, 0]
                    ],
                    accent: { count: 26, shapes: ['spark','spark','orb'], size: [4.0, 9.2], alpha: [.16,.39], speed: [.34,.82], drift: 18 },
                    dust: { count: 54, size: [1.2, 2.9], alpha: [.08,.22], speed: [.16,.34] }
                },
                'thought-celebrate': {
                    behavior: 'celebrate',
                    glows: [
                        [.20, .22, .76, .12, 0, 20, 18],
                        [.82, .30, .84, .11, 1, -18, 18],
                        [.54, .82, .90, .09, 2, 16, -16]
                    ],
                    accent: { count: 30, shapes: ['star','orb','spark'], size: [4.2, 9.6], alpha: [.18,.42], speed: [.22,.50], drift: 34 },
                    dust: { count: 60, size: [1.3, 3.1], alpha: [.09,.24], speed: [.13,.29] }
                },
                'wild-cards': {
                    behavior: 'cards',
                    glows: [
                        [.22, .20, .72, .10, 0, 20, 14],
                        [.82, .74, .80, .08, 1, -18, -14]
                    ],
                    accent: { count: 18, shapes: ['chip','chip','star','orb'], size: [4.4, 9.0], alpha: [.13,.32], speed: [.14,.34], drift: 30 },
                    dust: { count: 44, size: [1.2, 2.7], alpha: [.07,.19], speed: [.09,.22] }
                }
            };

            return profiles[key] || profiles['party-aurora'];
        }

        clearVisuals() {
            [...this.glows, ...this.accents, ...this.dust].forEach(node => node?.destroy());
            this.glows = [];
            this.accents = [];
            this.dust = [];
        }

        createGlow(definition, index) {
            const { width, height, short } = this.sceneMetrics();
            const [xr, yr, sizeRatio, alpha, colorIndex, driftX, driftY] = definition;
            const size = short * sizeRatio;
            const node = this.add.image(width * xr, height * yr, this.glowTextureKey)
                .setDisplaySize(size, size)
                .setTint(this.mode.colors[colorIndex % this.mode.colors.length])
                .setAlpha(alpha);

            try { node.setBlendMode?.('ADD'); } catch (_) {}
            node.baseX = node.x;
            node.baseY = node.y;
            node.baseScaleX = node.scaleX;
            node.baseScaleY = node.scaleY;
            node.phase = index * 1.7 + PhaserLib.Math.FloatBetween(0, 1);
            node.driftX = driftX;
            node.driftY = driftY;
            node.parallax = .08 + index * .025;
            this.glows.push(node);
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
            if (shape === 'diamond') {
                return this.add.rectangle(x, y, size * 1.25, size * 1.25, color, 1)
                    .setAlpha(alpha)
                    .setAngle(45);
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

        seedParticle(node, layer, profile, index) {
            const { width, height } = this.sceneMetrics();
            const config = profile[layer];
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
            node.centerX = width * .5;
            node.centerY = height * .52;
            node.radialAngle = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
            node.radialRadius = PhaserLib.Math.FloatBetween(14, Math.min(width, height) * .46);
            node.radialSpeed = speed;
            node.direction = index % 2 ? 1 : -1;
            node.baseY = node.y;
        }

        createParticleLayer(layer) {
            const { width, height, uiScale, densityScale } = this.sceneMetrics();
            const config = this.profile[layer];
            const baseCount = config.count;
            const count = this.reducedMotion
                ? Math.max(6, Math.round(baseCount * .32))
                : Math.round(baseCount * densityScale);
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
                this.seedParticle(node, layer, this.profile, i);
                target.push(node);
            }
        }

        rebuildVisuals() {
            this.clearVisuals();
            this.profile.glows.forEach((definition, index) => this.createGlow(definition, index));
            this.createParticleLayer('accent');
            this.createParticleLayer('dust');
        }

        setMode(modeName, { immediate = false } = {}) {
            const mode = BACKGROUND_MODES[modeName] || BACKGROUND_MODES.party;
            this.modeName = modeName;
            this.mode = mode;
            this.profile = this.resolveVisualProfile(modeName, mode);
            this.rebuildVisuals();

            if (!immediate && ['shockwave', 'victory-rings', 'orbit-celebrate', 'thought-celebrate'].includes(mode.overlayMotif) && !this.reducedMotion) {
                this.spawnBurst(this.scale.width * .5, this.scale.height * .46, 18);
            }
        }

        resetParticle(node, behavior) {
            const { width, height } = this.sceneMetrics();
            if (behavior === 'blast') {
                node.radialAngle = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
                node.radialRadius = PhaserLib.Math.FloatBetween(8, 36);
                node.centerX = width * .5;
                node.centerY = height * .52;
                return;
            }
            if (behavior === 'embers' || behavior === 'lift' || behavior === 'celebrate') {
                node.x = PhaserLib.Math.FloatBetween(-20, width + 20);
                node.y = height + PhaserLib.Math.Between(12, 80);
                return;
            }
            if (['scan', 'stealth', 'ribbon', 'rush', 'tilt'].includes(behavior)) {
                node.x = node.direction > 0 ? -40 : width + 40;
                node.y = PhaserLib.Math.FloatBetween(-10, height + 10);
                return;
            }
            node.x = PhaserLib.Math.FloatBetween(-20, width + 20);
            node.y = PhaserLib.Math.FloatBetween(-20, height + 20);
        }

        wrapParticle(node, margin = 70) {
            const { width, height } = this.sceneMetrics();
            if (node.x < -margin) node.x = width + margin;
            if (node.x > width + margin) node.x = -margin;
            if (node.y < -margin) node.y = height + margin;
            if (node.y > height + margin) node.y = -margin;
        }

        updateParticle(node, behavior, time, dt, speedMultiplier) {
            const { width, short, uiScale } = this.sceneMetrics();
            const layerFactor = node.layer === 'accent' ? 1 : .58;
            const baseSpeed = speedMultiplier * layerFactor * uiScale;

            if (behavior === 'blast') {
                node.radialRadius += node.radialSpeed * baseSpeed * dt * 2.9;
                if (node.radialRadius > short * .72) this.resetParticle(node, behavior);
                node.x = node.centerX + Math.cos(node.radialAngle) * node.radialRadius;
                node.y = node.centerY + Math.sin(node.radialAngle) * node.radialRadius;
                node.rotation = node.radialAngle;
            } else if (behavior === 'embers') {
                node.y -= Math.abs(node.vy || node.radialSpeed) * baseSpeed * dt * 1.9;
                node.x += Math.sin(time * .0012 + node.phase) * .20 * node.wave;
                if (node.y < -70) this.resetParticle(node, behavior);
            } else if (behavior === 'lift' || behavior === 'celebrate') {
                node.y -= Math.max(.18, Math.abs(node.vy)) * baseSpeed * dt * (behavior === 'celebrate' ? 1.7 : 1.25);
                node.x += Math.sin(time * .0011 + node.phase) * .12 * node.wave;
                if (node.y < -70) this.resetParticle(node, behavior);
            } else if (behavior === 'scan' || behavior === 'stealth') {
                const directionSpeed = Math.max(.22, Math.abs(node.vx)) * node.direction;
                node.x += directionSpeed * baseSpeed * dt * (behavior === 'stealth' ? .62 : 1.0);
                node.y += Math.sin(time * .0013 + node.phase) * .045 * node.wave;
                if (node.x < -80 || node.x > width + 80) this.resetParticle(node, behavior);
            } else if (behavior === 'ribbon' || behavior === 'rush' || behavior === 'tilt') {
                const multiplier = behavior === 'rush' ? 1.55 : behavior === 'tilt' ? 1.8 : 1.0;
                const directionSpeed = Math.max(.20, Math.abs(node.vx)) * node.direction;
                node.x += directionSpeed * baseSpeed * dt * multiplier;
                node.y += Math.sin(time * (behavior === 'tilt' ? .0020 : .00145) + node.phase) * .07 * node.wave;
                if (node.x < -90 || node.x > width + 90) this.resetParticle(node, behavior);
            } else if (behavior === 'crossflow') {
                node.x += node.vx * baseSpeed * dt;
                node.y += node.vy * baseSpeed * dt;
                node.x += Math.cos(time * .0010 + node.phase) * .045 * node.wave;
                this.wrapParticle(node);
            } else if (behavior === 'cards') {
                node.x += node.vx * baseSpeed * dt * .7;
                node.y += node.vy * baseSpeed * dt * .7;
                node.rotation += node.spin * dt;
                this.wrapParticle(node);
            } else if (behavior === 'bokeh') {
                node.y -= Math.max(.06, Math.abs(node.vy)) * baseSpeed * dt * .65;
                node.x += Math.sin(time * .0009 + node.phase) * .055 * node.wave;
                if (node.y < -80) this.resetParticle(node, 'celebrate');
            } else {
                node.x += node.vx * baseSpeed * dt;
                node.y += node.vy * baseSpeed * dt;
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

        updateGlows(time) {
            this.glows.forEach(glow => {
                if (!glow?.active) return;
                const wave = time * .00025 + glow.phase;
                glow.x = glow.baseX + Math.sin(wave) * glow.driftX + this.pointerTarget.x * glow.parallax;
                glow.y = glow.baseY + Math.cos(wave * 1.17) * glow.driftY + this.pointerTarget.y * glow.parallax;
                const pulse = 1 + Math.sin(wave * 1.35) * .045;
                glow.setScale(glow.baseScaleX * pulse, glow.baseScaleY * pulse);
            });
        }

        spawnBurst(x, y, count = 10) {
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

            this.updateGlows(time);
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
        if (backgroundScene?.mode) backgroundScene.setMode(backgroundScene.modeName, { immediate: true });
    });
}

window.addEventListener('load', initializePhaserBackground, { once: true });
