import { registerImpostorGame } from './impostor/bootstrap.js?v=1';
import { registerTickingBombGame } from './ticking-bomb/bootstrap.js?v=1';
import { registerNaokoloGame } from './naokolo/bootstrap.js?v=1';
import { registerCoMamNaMysliGame } from './co-mam-na-mysli/bootstrap.js?v=1';
import { registerThreeFiveGame } from './trzy-w-piec/bootstrap.js?v=1';
import { registerSynchronizacjaGame } from './synchronizacja/bootstrap.js?v=1';
import { registerTrzyRundyGame } from './trzy-rundy/bootstrap.js?v=1';
import { registerDzikaKartaGame } from './dzika-karta/bootstrap.js?v=1';

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
