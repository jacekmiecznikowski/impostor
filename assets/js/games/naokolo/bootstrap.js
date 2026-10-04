import { registerNaokoloGame as registerBaseNaokoloGame } from './integration.js?v=1';

export function registerNaokoloGame() {
    const gameModule = registerBaseNaokoloGame();
    gameModule.assets = {
        styles: ['./assets/css/naokolo.css'],
        scripts: [
            './assets/js/games/naokolo/content-provider.js',
            './assets/js/games/naokolo/rules.js',
            './assets/js/games/naokolo/state.js',
            './assets/js/games/naokolo/setup.js',
            './assets/js/games/naokolo/game.js',
            './assets/js/games/naokolo/scoreboard.js'
        ]
    };
    gameModule.initialize = async () => {
        await initializeNaokoloContent?.();
    };
    return gameModule;
}
