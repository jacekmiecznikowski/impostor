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
            this.pointerTarget = { x: 0, y: 0 };
            this.profile = null;
        }

        create() {
            backgroundScene = this;
            this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
            this.createConfetti();
            this.setMode(backgroundMode, { immediate: true });

            this.input.on('pointermove', pointer => {
                this.pointerTarget.x = (pointer.x / Math.max(1, this.scale.width) - 0.5) * 8;
                this.pointerTarget.y = (pointer.y / Math.max(1, this.scale.height) - 0.5) * 8;
            });

            this.input.on('pointerdown', pointer => {
                if (!this.reducedMotion) this.spawnBurst(pointer.x, pointer.y, 9);
            });
        }

        resolveParticleProfile(modeName, mode) {
            const key = mode.overlayMotif || mode.motif || modeName;
            const profiles = {
                'party-aurora': { behavior: 'rise', count: 68, shapes: ['dot','dot','star','dash'], size: [1.2,3.7], alpha: [.13,.34], vx: [-.11,.11], vy: [-.34,-.10], twinkle: .08 },
                'suspect-radar': { behavior: 'scan', count: 64, shapes: ['dot','dash','dot','dash'], size: [1.0,3.1], alpha: [.12,.32], vx: [.18,.46], vy: [-.035,.035], twinkle: .09 },
                'dialogue-network': { behavior: 'drift', count: 72, shapes: ['dot','dot','dash'], size: [1.0,3.0], alpha: [.12,.31], vx: [-.24,.24], vy: [-.16,.16], twinkle: .07 },
                verdict: { behavior: 'vote', count: 64, shapes: ['dash','dot','dash'], size: [1.1,3.0], alpha: [.12,.31], vx: [-.06,.06], vy: [-.38,-.14], twinkle: .08 },
                'victory-rings': { behavior: 'celebrate', count: 82, shapes: ['dot','star','dash','star'], size: [1.2,4.0], alpha: [.16,.42], vx: [-.28,.28], vy: [-.42,.10], twinkle: .12 },
                'fuse-sparks': { behavior: 'radial', count: 76, shapes: ['dot','dash','dot'], size: [1.0,3.3], alpha: [.16,.39], radial: [.10,.32], twinkle: .10 },
                shockwave: { behavior: 'radial', count: 92, shapes: ['dash','dot','star'], size: [1.2,4.1], alpha: [.20,.48], radial: [.28,.68], twinkle: .13 },
                'orbit-words': { behavior: 'flow', count: 66, shapes: ['dot','dash','dot'], size: [1.0,3.1], alpha: [.12,.33], vx: [.16,.40], vy: [-.08,.08], wave: [8,22], twinkle: .08 },
                'orbit-fast': { behavior: 'flow', count: 78, shapes: ['dash','dot','dash','dot'], size: [1.0,3.3], alpha: [.15,.38], vx: [.32,.72], vy: [-.10,.10], wave: [10,28], twinkle: .10 },
                'orbit-celebrate': { behavior: 'celebrate', count: 84, shapes: ['dot','star','dash'], size: [1.1,4.0], alpha: [.17,.43], vx: [-.32,.32], vy: [-.44,.12], twinkle: .12 },
                'thought-field': { behavior: 'float', count: 66, shapes: ['dot','dot','dash'], size: [1.0,3.4], alpha: [.12,.33], vx: [-.12,.12], vy: [-.28,-.08], twinkle: .09 },
                gyro: { behavior: 'gyro', count: 82, shapes: ['dash','dot','dash','dot'], size: [1.0,3.2], alpha: [.16,.40], vx: [.34,.82], vy: [-.025,.025], wave: [5,16], twinkle: .10 },
                'thought-celebrate': { behavior: 'celebrate', count: 84, shapes: ['dot','star','dot','dash'], size: [1.2,4.0], alpha: [.17,.43], vx: [-.30,.30], vy: [-.42,.12], twinkle: .12 },
                'wild-cards': { behavior: 'drift', count: 58, shapes: ['chip','dot','chip','star'], size: [1.2,3.4], alpha: [.13,.34], vx: [-.20,.20], vy: [-.22,.12], twinkle: .08 },
                party: { behavior: 'rise', count: 64, shapes: ['dot','dot','star'], size: [1.2,3.5], alpha: [.12,.32], vx: [-.10,.10], vy: [-.30,-.08], twinkle: .08 },
                impostor: { behavior: 'scan', count: 64, shapes: ['dot','dash'], size: [1.0,3.0], alpha: [.12,.31], vx: [.16,.42], vy: [-.04,.04], twinkle: .08 },
                discussion: { behavior: 'drift', count: 70, shapes: ['dot','dash','dot'], size: [1.0,3.0], alpha: [.12,.31], vx: [-.22,.22], vy: [-.15,.15], twinkle: .08 },
                vote: { behavior: 'vote', count: 64, shapes: ['dash','dot'], size: [1.0,3.0], alpha: [.12,.31], vx: [-.05,.05], vy: [-.34,-.12], twinkle: .08 },
                celebrate: { behavior: 'celebrate', count: 82, shapes: ['dot','star','dash'], size: [1.2,4.0], alpha: [.16,.42], vx: [-.28,.28], vy: [-.42,.10], twinkle: .12 },
                'ticking-bomb': { behavior: 'radial', count: 76, shapes: ['dot','dash'], size: [1.0,3.3], alpha: [.16,.39], radial: [.10,.32], twinkle: .10 },
                'bomb-alert': { behavior: 'radial', count: 92, shapes: ['dash','dot','star'], size: [1.2,4.1], alpha: [.20,.48], radial: [.28,.68], twinkle: .13 }
            };
            return profiles[key] || profiles.party;
        }

        createParticle(shape, x, y, size, color, alpha) {
            if (shape === 'dash') {
                return this.add.rectangle(x, y, size * 4.2, Math.max(1, size * .6), color, alpha)
                    .setAngle(PhaserLib.Math.Between(-24, 24));
            }
            if (shape === 'chip') {
                return this.add.rectangle(x, y, Math.max(3, size * 1.8), Math.max(4, size * 2.6), color, alpha)
                    .setAngle(PhaserLib.Math.Between(-28, 28));
            }
            if (shape === 'star') {
                return this.add.star(x, y, 4, Math.max(.8, size * .45), Math.max(1.8, size), color, alpha);
            }
            return this.add.circle(x, y, Math.max(.8, size), color, alpha);
        }

        rebuildMotes() {
            this.motes.forEach(mote => mote?.destroy());
            this.motes = [];

            const profile = this.profile;
            const w = Math.max(1, this.scale.width);
            const h = Math.max(1, this.scale.height);
            const areaScale = PhaserLib.Math.Clamp(Math.sqrt((w * h) / (390 * 844)), .82, 1.45);
            const count = this.reducedMotion ? Math.max(14, Math.round(profile.count * .34)) : Math.round(profile.count * areaScale);
            const colors = this.mode.colors;
            const cx = w * .5;
            const cy = h * .5;

            for (let i = 0; i < count; i++) {
                const x = PhaserLib.Math.FloatBetween(-12, w + 12);
                const y = PhaserLib.Math.FloatBetween(-12, h + 12);
                const size = PhaserLib.Math.FloatBetween(profile.size[0], profile.size[1]);
                const alpha = PhaserLib.Math.FloatBetween(profile.alpha[0], profile.alpha[1]);
                const shape = profile.shapes[i % profile.shapes.length];
                const mote = this.createParticle(shape, x, y, size, colors[i % colors.length], alpha);
                try { mote.setBlendMode?.('ADD'); } catch (_) {}

                mote.baseAlpha = alpha;
                mote.phase = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
                mote.twinkleSpeed = PhaserLib.Math.FloatBetween(.0010, .0028);
                mote.vx = PhaserLib.Math.FloatBetween(profile.vx?.[0] ?? -.08, profile.vx?.[1] ?? .08);
                mote.vy = PhaserLib.Math.FloatBetween(profile.vy?.[0] ?? -.12, profile.vy?.[1] ?? .12);
                mote.wave = PhaserLib.Math.FloatBetween(profile.wave?.[0] ?? 0, profile.wave?.[1] ?? 0);
                mote.baseY = y;
                mote.radialAngle = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
                mote.radialRadius = PhaserLib.Math.FloatBetween(8, Math.min(w, h) * .48);
                mote.radialSpeed = PhaserLib.Math.FloatBetween(profile.radial?.[0] ?? .08, profile.radial?.[1] ?? .18);
                mote.cx = cx;
                mote.cy = cy;
                mote.parallax = PhaserLib.Math.FloatBetween(.05, .24);
                this.motes.push(mote);
            }
        }

        createConfetti() {
            const count = this.reducedMotion ? 0 : 14;
            for (let i = 0; i < count; i++) {
                const rect = this.add.rectangle(
                    PhaserLib.Math.Between(0, this.scale.width),
                    PhaserLib.Math.Between(0, this.scale.height),
                    PhaserLib.Math.Between(2, 4),
                    PhaserLib.Math.Between(6, 11),
                    0x8b5cf6,
                    PhaserLib.Math.FloatBetween(.10, .22)
                );
                rect.speedY = PhaserLib.Math.FloatBetween(.10, .24);
                rect.speedX = PhaserLib.Math.FloatBetween(-.06, .06);
                rect.rotationSpeed = PhaserLib.Math.FloatBetween(-.008, .008);
                rect.setVisible(false);
                this.confetti.push(rect);
            }
        }

        setMode(modeName, { immediate = false } = {}) {
            const mode = BACKGROUND_MODES[modeName] || BACKGROUND_MODES.party;
            this.modeName = modeName;
            this.mode = mode;
            this.profile = this.resolveParticleProfile(modeName, mode);
            this.rebuildMotes();

            this.confetti.forEach((rect, index) => {
                rect.setVisible(Boolean(mode.confetti));
                if (mode.confetti) rect.setFillStyle(mode.colors[index % mode.colors.length], PhaserLib.Math.FloatBetween(.10, .24));
            });

            if (!immediate && mode.confetti && !this.reducedMotion) {
                this.spawnBurst(this.scale.width * .5, this.scale.height * .34, 16);
            }
        }

        wrapParticle(mote, margin = 24) {
            if (mote.x < -margin) mote.x = this.scale.width + margin;
            if (mote.x > this.scale.width + margin) mote.x = -margin;
            if (mote.y < -margin) mote.y = this.scale.height + margin;
            if (mote.y > this.scale.height + margin) mote.y = -margin;
        }

        resetRadialParticle(mote) {
            mote.radialAngle = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
            mote.radialRadius = PhaserLib.Math.FloatBetween(6, 34);
            mote.baseAlpha = PhaserLib.Math.FloatBetween(this.profile.alpha[0], this.profile.alpha[1]);
        }

        spawnBurst(x, y, count = 8) {
            const mode = this.mode || BACKGROUND_MODES.party;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + PhaserLib.Math.FloatBetween(-.15, .15);
                const distance = PhaserLib.Math.Between(32, 96);
                const dot = this.add.circle(x, y, PhaserLib.Math.FloatBetween(1.8, 3.8), mode.colors[i % mode.colors.length], .52);
                try { dot.setBlendMode?.('ADD'); } catch (_) {}
                this.tweens.add({
                    targets: dot,
                    x: x + Math.cos(angle) * distance,
                    y: y + Math.sin(angle) * distance,
                    scale: .2,
                    alpha: 0,
                    duration: PhaserLib.Math.Between(420, 760),
                    ease: 'Cubic.Out',
                    onComplete: () => dot.destroy()
                });
            }
        }

        update(time, delta) {
            if (!this.mode || document.visibilityState !== 'visible') return;
            const dt = Math.min(32, delta) / 16.67;
            const speed = this.reducedMotion ? .16 : Math.max(.45, this.mode.speed || 1);
            const behavior = this.profile?.behavior || 'rise';
            const short = Math.min(this.scale.width, this.scale.height);

            this.motes.forEach(mote => {
                if (!mote?.active) return;

                if (behavior === 'radial') {
                    mote.radialRadius += mote.radialSpeed * speed * dt * 3.2;
                    if (mote.radialRadius > short * .58) this.resetRadialParticle(mote);
                    mote.x = mote.cx + Math.cos(mote.radialAngle) * mote.radialRadius + this.pointerTarget.x * mote.parallax;
                    mote.y = mote.cy + Math.sin(mote.radialAngle) * mote.radialRadius + this.pointerTarget.y * mote.parallax;
                    if ('rotation' in mote) mote.rotation = mote.radialAngle;
                } else if (behavior === 'gyro') {
                    mote.x += mote.vx * speed * dt * 2.2;
                    mote.y += mote.vy * speed * dt;
                    mote.y += Math.sin(time * .0022 + mote.phase) * .16 * mote.wave;
                    this.wrapParticle(mote);
                } else if (behavior === 'flow') {
                    mote.x += mote.vx * speed * dt * 1.8;
                    mote.y += mote.vy * speed * dt;
                    mote.y += Math.sin(time * .0015 + mote.phase) * .06 * mote.wave;
                    this.wrapParticle(mote);
                } else {
                    const multiplier = behavior === 'scan' ? 1.7 : behavior === 'celebrate' ? 1.45 : 1;
                    mote.x += mote.vx * speed * dt * multiplier;
                    mote.y += mote.vy * speed * dt * multiplier;
                    if (behavior === 'scan') mote.y += Math.sin(time * .0014 + mote.phase) * .08;
                    if (behavior === 'drift') mote.x += Math.cos(time * .0011 + mote.phase) * .07;
                    this.wrapParticle(mote);
                }

                mote.alpha = PhaserLib.Math.Clamp(
                    mote.baseAlpha + Math.sin(time * mote.twinkleSpeed + mote.phase) * (this.profile.twinkle || .08),
                    .06,
                    .56
                );
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
        if (backgroundScene?.mode) backgroundScene.setMode(backgroundScene.modeName, { immediate: true });
    });
}

window.addEventListener('load', initializePhaserBackground, { once: true });
