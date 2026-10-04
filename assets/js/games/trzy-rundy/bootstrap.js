import { registerTrzyRundyGame as registerBaseGame } from './integration.js?v=1';

export function registerTrzyRundyGame() {
    const gameModule = registerBaseGame();
    gameModule.assets = {
        styles: ['./assets/css/trzy-rundy.css'],
        scripts: [
            './assets/js/games/trzy-rundy/content-provider.js',
            './assets/js/games/trzy-rundy/rules.js',
            './assets/js/games/trzy-rundy/state.js',
            './assets/js/games/trzy-rundy/setup.js',
            './assets/js/games/trzy-rundy/game.js',
            './assets/js/games/trzy-rundy/scoreboard.js'
        ]
    };
    return gameModule;
}
