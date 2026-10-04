import { registerThreeFiveGame as registerBaseGame } from './integration.js?v=1';

export function registerThreeFiveGame() {
    const gameModule = registerBaseGame();
    gameModule.assets = {
        styles: [
            './assets/css/trzy-w-piec.css',
            './assets/css/trzy-w-piec-layout.css?v=4'
        ],
        scripts: [
            './assets/js/games/trzy-w-piec/content-provider.js',
            './assets/js/games/trzy-w-piec/rules.js',
            './assets/js/games/trzy-w-piec/state.js',
            './assets/js/games/trzy-w-piec/setup.js',
            './assets/js/games/trzy-w-piec/game.js',
            './assets/js/games/trzy-w-piec/scoreboard.js'
        ]
    };
    return gameModule;
}
