import { registerImpostorGame } from './impostor/integration.js?v=2';
import { registerTickingBombGame } from './ticking-bomb/integration.js?v=2';
import { registerNaokoloGame } from './naokolo/integration.js?v=1';
import { registerCoMamNaMysliGame } from './co-mam-na-mysli/integration.js?v=1';
import { registerThreeFiveGame } from './trzy-w-piec/integration.js?v=1';
import { registerSynchronizacjaGame } from './synchronizacja/integration.js?v=1';
import { registerTrzyRundyGame } from './trzy-rundy/integration.js?v=1';
import { registerDzikaKartaGame } from './dzika-karta/integration.js?v=1';

const LEGACY_INITIALIZERS = Object.freeze({
    impostor: 'initializeImpostorRemoteContent',
    'ticking-bomb': 'initializeTickingBombContent',
    naokolo: 'initializeNaokoloContent'
});

function attachLegacyInitializer(gameModule) {
    if (!gameModule || typeof gameModule.initialize === 'function') return gameModule;
    const initializerName = LEGACY_INITIALIZERS[gameModule.id];
    if (!initializerName) return gameModule;
    gameModule.initialize = () => {
        const initializer = globalThis[initializerName];
        return typeof initializer === 'function' ? initializer() : undefined;
    };
    return gameModule;
}

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
    ].map(attachLegacyInitializer);
}
