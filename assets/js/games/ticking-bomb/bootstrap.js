import { registerTickingBombGame as registerBaseTickingBombGame } from './integration.js?v=2';

export function registerTickingBombGame() {
    const gameModule = registerBaseTickingBombGame();
    gameModule.initialize = async () => {
        await initializeTickingBombContent?.();
    };
    return gameModule;
}
