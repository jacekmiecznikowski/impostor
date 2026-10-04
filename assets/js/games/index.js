import { registerImpostorGame } from './impostor/integration.js?v=2';
import { registerTickingBombGame } from './ticking-bomb/integration.js?v=2';
import { registerNaokoloGame } from './naokolo/integration.js?v=1';
import { registerCoMamNaMysliGame } from './co-mam-na-mysli/integration.js?v=1';
import { registerThreeFiveGame } from './trzy-w-piec/integration.js?v=1';
import { registerSynchronizacjaGame } from './synchronizacja/integration.js?v=1';
import { registerPrototypeGames } from './prototypes/integration.js?v=4';

export function registerGameModules() {
    registerImpostorGame();
    registerTickingBombGame();
    registerNaokoloGame();
    registerCoMamNaMysliGame();
    registerThreeFiveGame();
    registerSynchronizacjaGame();
    registerPrototypeGames();
}
