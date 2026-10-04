import { registerImpostorGame } from './impostor/bootstrap.js?v=1';
import { registerTickingBombGame } from './ticking-bomb/bootstrap.js?v=1';
import { registerNaokoloGame } from './naokolo/bootstrap.js?v=1';
import { registerCoMamNaMysliGame } from './co-mam-na-mysli/integration.js?v=1';
import { registerThreeFiveGame } from './trzy-w-piec/integration.js?v=1';
import { registerSynchronizacjaGame } from './synchronizacja/integration.js?v=1';
import { registerTrzyRundyGame } from './trzy-rundy/integration.js?v=1';
import { registerDzikaKartaGame } from './dzika-karta/integration.js?v=1';

export function registerGameModules() {
    return [
        registerImpostorGame(),
        registerTickingBombGame(),
        registerNaokoloGame(),
        registerCoMamNaMysliGame(),
        registerThreeFiveGame(),
        registerSynchronizacjaGame(),
        registerTrzyRundyGame(),
        registerDzikaKartaGame()
    ];
}
