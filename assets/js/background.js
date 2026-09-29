let phaserGame = null;

if (window.Phaser) {
    class BackgroundScene extends Phaser.Scene {
        constructor() {
            super({ key: 'BackgroundScene' });
        }

        create() {
            this.particles = [];
            const numParticles = 45;
            for (let i = 0; i < numParticles; i++) {
                const color = i % 3 === 0 ? 0x14b8a6 : (i % 3 === 1 ? 0x06b6d4 : 0x10b981);
                const circle = this.add.circle(
                    Phaser.Math.Between(0, this.scale.width),
                    Phaser.Math.Between(0, this.scale.height),
                    Phaser.Math.Between(2, 6),
                    color,
                    Phaser.Math.FloatBetween(0.2, 0.5)
                );
                circle.speedX = Phaser.Math.FloatBetween(-0.25, 0.25);
                circle.speedY = Phaser.Math.FloatBetween(-0.4, -0.15);
                this.particles.push(circle);
            }

            this.input.on('pointerdown', pointer => {
                const ring = this.add.circle(pointer.x, pointer.y, 5, 0x14b8a6, 0.8);
                this.tweens.add({
                    targets: ring,
                    scale: 6,
                    alpha: 0,
                    duration: 600,
                    onComplete: () => ring.destroy()
                });
            });
        }

        update() {
            this.particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;
                if (particle.y < -15) particle.y = this.scale.height + 15;
                if (particle.x < -15) particle.x = this.scale.width + 15;
                if (particle.x > this.scale.width + 15) particle.x = -15;
            });
        }
    }

    window.addEventListener('load', () => {
        const config = {
            type: Phaser.AUTO,
            parent: 'phaser-bg',
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            scene: BackgroundScene,
            render: { antialias: true }
        };
        phaserGame = new Phaser.Game(config);

        window.addEventListener('resize', () => {
            if (phaserGame?.scale) phaserGame.scale.resize(window.innerWidth, window.innerHeight);
        });
    });
} else {
    console.warn('Phaser nie został załadowany. Gra działa bez animowanego tła.');
}
