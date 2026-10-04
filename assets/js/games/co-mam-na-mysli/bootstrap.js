import { registerCoMamNaMysliGame as registerBaseGame } from './integration.js?v=1';

export function registerCoMamNaMysliGame() {
    const gameModule = registerBaseGame();
    gameModule.assets = {
        styles: ['./assets/css/co-mam-na-mysli.css'],
        scripts: [
            './assets/js/games/co-mam-na-mysli/content-provider.js',
            './assets/js/games/co-mam-na-mysli/rules.js',
            './assets/js/games/co-mam-na-mysli/motion.js',
            './assets/js/games/co-mam-na-mysli/state.js',
            './assets/js/games/co-mam-na-mysli/setup.js',
            './assets/js/games/co-mam-na-mysli/game.js',
            './assets/js/games/co-mam-na-mysli/scoreboard.js'
        ]
    };
    return gameModule;
}
