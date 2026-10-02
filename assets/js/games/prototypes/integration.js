import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

const PROTOTYPE_GAMES = [
    {
        id: 'naokolo',
        catalog: {
            name: 'Naokoło',
            description: 'Opisuj hasło bez używania zakazanych słów.',
            icon: 'fa-comments',
            status: 'prototype',
            order: 30
        }
    },
    {
        id: 'dzika-karta',
        catalog: {
            name: 'Dzika Karta',
            description: 'Dobieraj najzabawniejsze odpowiedzi do absurdalnych pytań.',
            icon: 'fa-clone',
            status: 'prototype',
            order: 40
        }
    },
    {
        id: 'co-mam-na-mysli',
        catalog: {
            name: 'Co mam na myśli?',
            description: 'Zgaduj hasło, które widzą wszyscy oprócz Ciebie.',
            icon: 'fa-face-grin-stars',
            status: 'prototype',
            order: 50
        }
    }
];

export function registerPrototypeGames() {
    return PROTOTYPE_GAMES.map(config => getGameModule(config.id) || registerGameModule(config));
}
