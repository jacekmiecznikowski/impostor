import { registerImpostorGame as registerBaseImpostorGame } from './integration.js?v=2';

export function registerImpostorGame() {
    const gameModule = registerBaseImpostorGame();
    gameModule.assets = {
        styles: [
            './assets/css/impostor.css',
            './assets/css/impostor-reveal.css',
            './assets/css/impostor-role.css',
            './assets/css/impostor-reveal-layout.css'
        ],
        scripts: [
            './assets/js/games/impostor/data.js',
            './assets/js/games/impostor/content-provider.js',
            './assets/js/games/impostor/rules.js',
            './assets/js/games/impostor/state.js',
            './assets/js/games/impostor/setup.js',
            './assets/js/games/impostor/game.js',
            './assets/js/games/impostor/presentation.js',
            './assets/js/games/impostor/reveal-fit.js',
            './assets/js/games/impostor/scoreboard.js'
        ]
    };
    gameModule.initialize = async () => {
        await initializeImpostorRemoteContent?.();
        setupImpostorPresentation?.();
        setupRevealWordFitting?.();
    };
    return gameModule;
}
