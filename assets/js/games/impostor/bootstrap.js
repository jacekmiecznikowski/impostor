import { registerImpostorGame as registerBaseImpostorGame } from './integration.js?v=2';

export function registerImpostorGame() {
    const gameModule = registerBaseImpostorGame();
    gameModule.initialize = async () => {
        await initializeImpostorRemoteContent?.();
        setupImpostorPresentation?.();
        setupRevealWordFitting?.();
    };
    return gameModule;
}
