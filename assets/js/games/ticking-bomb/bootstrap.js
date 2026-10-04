import { registerTickingBombGame as registerBaseTickingBombGame } from './integration.js?v=2';

export function registerTickingBombGame() {
    const gameModule = registerBaseTickingBombGame();
    gameModule.assets = {
        styles: [
            './assets/css/ticking-bomb.css',
            './assets/css/ticking-bomb-mobile.css',
            './assets/css/ticking-bomb-visual.css?v=3'
        ],
        scripts: [
            './assets/js/games/ticking-bomb/content-provider.js',
            './assets/js/games/ticking-bomb/rules.js',
            './assets/js/games/ticking-bomb/state.js',
            './assets/js/games/ticking-bomb/audio.js',
            './assets/js/games/ticking-bomb/setup.js',
            './assets/js/games/ticking-bomb/game.js',
            './assets/js/games/ticking-bomb/scoreboard.js'
        ]
    };
    gameModule.initialize = async () => {
        await initializeTickingBombContent?.();
    };
    return gameModule;
}
