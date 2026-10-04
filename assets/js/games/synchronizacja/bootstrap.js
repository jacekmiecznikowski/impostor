import { registerSynchronizacjaGame as registerBaseGame } from './integration.js?v=1';

export function registerSynchronizacjaGame() {
    const gameModule = registerBaseGame();
    gameModule.assets = {
        styles: ['./assets/css/synchronizacja.css'],
        scripts: [
            './assets/js/games/synchronizacja/content-provider.js',
            './assets/js/games/synchronizacja/rules.js',
            './assets/js/games/synchronizacja/state.js',
            './assets/js/games/synchronizacja/setup.js',
            './assets/js/games/synchronizacja/game.js',
            './assets/js/games/synchronizacja/scoreboard.js'
        ]
    };
    return gameModule;
}
