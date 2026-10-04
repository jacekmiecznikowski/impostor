import { registerNaokoloGame as registerBaseNaokoloGame } from './integration.js?v=1';

export function registerNaokoloGame() {
    const gameModule = registerBaseNaokoloGame();
    gameModule.initialize = async () => {
        await initializeNaokoloContent?.();
    };
    return gameModule;
}
