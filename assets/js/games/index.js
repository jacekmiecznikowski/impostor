import { registerImpostorGame } from './impostor/integration.js?v=2';
import { registerTickingBombGame } from './ticking-bomb/integration.js?v=2';
import { registerPrototypeGames } from './prototypes/integration.js?v=1';

export function registerGameModules() {
    registerImpostorGame();
    registerTickingBombGame();
    registerPrototypeGames();
}
