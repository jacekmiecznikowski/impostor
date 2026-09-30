const BACKGROUND_MODES = {
    party: { colors: [0x8b5cf6, 0xd946ef, 0x14b8a6, 0xf59e0b], alpha: [0.12, 0.30], speed: 1, confetti: true },
    impostor: { colors: [0x14b8a6, 0x06b6d4, 0x8b5cf6], alpha: [0.09, 0.24], speed: 0.78, confetti: false },
    mystery: { colors: [0x14b8a6, 0x6366f1, 0x64748b], alpha: [0.07, 0.18], speed: 0.52, confetti: false },
    discussion: { colors: [0x06b6d4, 0x14b8a6, 0x22c55e], alpha: [0.08, 0.22], speed: 0.72, confetti: false },
    vote: { colors: [0xf59e0b, 0x14b8a6, 0x64748b], alpha: [0.07, 0.19], speed: 0.58, confetti: false },
    celebrate: { colors: [0x14b8a6, 0x8b5cf6, 0xf59e0b, 0xec4899], alpha: [0.11, 0.30], speed: 1.05, confetti: true }
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
            this.particles = [];
            this.orbs = [];
            this.confetti = [];
            this.pointerTarget = { x: 0, y: 0 };
        }

        create() {
            backgroundScene = this;
            this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
            this.createAmbientOrbs();
            this.createParticles();
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

        createAmbientOrbs() {
            const configs = [
                { x: .12, y: .18, radius: 170, alpha: .035 },
                { x: .86, y: .32, radius: 210, alpha: .028 },
                { x: .45, y: .84, radius: 240, alpha: .022 }
            ];

            configs.forEach((config, index) => {
                const orb = this.add.circle(this.scale.width * config.x, this.scale.height * config.y, config.radius, 0x8b5cf6, config.alpha);
                orb.depthFactor = .18 + index * .08;
                orb.baseAlpha = config.alpha;
                this.orbs.push(orb);
            });
        }

        createParticles() {
            const count = this.reducedMotion ? 18 : 34;
            for (let i = 0; i < count; i++) {
                const particle = this.add.circle(
                    PhaserLib.Math.Between(0, this.scale.width),
                    PhaserLib.Math.Between(0, this.scale.height),
                    PhaserLib.Math.FloatBetween(1.5, 4.5),
                    0x14b8a6,
                    PhaserLib.Math.FloatBetween(.09, .24)
                );
                particle.depthFactor = PhaserLib.Math.FloatBetween(.35, 1);
                particle.speedX = PhaserLib.Math.FloatBetween(-.10, .10) * particle.depthFactor;
                particle.speedY = PhaserLib.Math.FloatBetween(-.26, -.08) * particle.depthFactor;
                particle.phase = PhaserLib.Math.FloatBetween(0, Math.PI * 2);
                particle.twinkleSpeed = PhaserLib.Math.FloatBetween(.0005, .0015);
                particle.baseAlpha = particle.fillAlpha || .15;
                this.particles.push(particle);
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

            this.particles.forEach((particle, index) => {
                const alpha = PhaserLib.Math.FloatBetween(mode.alpha[0], mode.alpha[1]);
                particle.baseAlpha = alpha;
                particle.setFillStyle(mode.colors[index % mode.colors.length], alpha);
            });

            this.orbs.forEach((orb, index) => {
                const alpha = orb.baseAlpha * (modeName === 'party' || modeName === 'celebrate' ? 1.3 : 1);
                orb.setFillStyle(mode.colors[index % mode.colors.length], alpha);
            });

            this.confetti.forEach((rect, index) => {
                rect.setVisible(Boolean(mode.confetti));
                if (mode.confetti) rect.setFillStyle(mode.colors[index % mode.colors.length], PhaserLib.Math.FloatBetween(.08, .18));
            });

            if (!immediate && modeName === 'celebrate' && !this.reducedMotion) {
                this.spawnBurst(this.scale.width * .5, this.scale.height * .34, 18);
            }
        }

        spawnBurst(x, y, count = 8) {
            const mode = this.mode || BACKGROUND_MODES.party;
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + PhaserLib.Math.FloatBetween(-.15, .15);
                const distance = PhaserLib.Math.Between(28, 82);
                const dot = this.add.circle(x, y, PhaserLib.Math.FloatBetween(1.8, 3.5), mode.colors[i % mode.colors.length], .46);
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

            this.particles.forEach(particle => {
                particle.x += particle.speedX * speed * dt;
                particle.y += particle.speedY * speed * dt;
                particle.alpha = PhaserLib.Math.Clamp(particle.baseAlpha + Math.sin(time * particle.twinkleSpeed + particle.phase) * .035, .025, .34);

                if (particle.y < -16) particle.y = this.scale.height + 16;
                if (particle.x < -16) particle.x = this.scale.width + 16;
                if (particle.x > this.scale.width + 16) particle.x = -16;
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

            const baseX = [.12, .86, .45];
            const baseY = [.18, .32, .84];
            this.orbs.forEach((orb, index) => {
                const targetX = this.scale.width * (baseX[index] || .5) + this.pointerTarget.x * orb.depthFactor + Math.sin(time * .00008 + index * 2.1) * 18;
                const targetY = this.scale.height * (baseY[index] || .5) + this.pointerTarget.y * orb.depthFactor + Math.cos(time * .00007 + index) * 14;
                orb.x += (targetX - orb.x) * .008;
                orb.y += (targetY - orb.y) * .008;
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
    });
}

window.addEventListener('load', initializePhaserBackground, { once: true });
