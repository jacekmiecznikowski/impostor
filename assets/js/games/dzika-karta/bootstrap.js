import { registerDzikaKartaGame as registerBaseGame } from './integration.js?v=1';

export function registerDzikaKartaGame() {
    const gameModule = registerBaseGame();
    gameModule.assets = {
        styles: ['./assets/css/dzika-karta.css'],
        scripts: [
            './assets/js/games/dzika-karta/content-provider.js',
            './assets/js/games/dzika-karta/rules.js',
            './assets/js/games/dzika-karta/state.js',
            './assets/js/games/dzika-karta/setup.js',
            './assets/js/games/dzika-karta/game.js',
            './assets/js/games/dzika-karta/scoreboard.js'
        ]
    };
    return gameModule;
}
