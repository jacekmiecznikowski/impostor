import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

const PROTOTYPE_GAMES = [
    {
        id: 'dzika-karta',
        catalog: {
            name: 'Dzika Karta',
            description: 'Dobieraj najzabawniejsze odpowiedzi do absurdalnych pytań.',
            icon: 'fa-clone',
            status: 'prototype',
            order: 40
        },
        theme: {
            palette: {
                accent: '#d946ef', strong: '#a21caf', alt: '#f472b6', text: '#f5d0fe', contrast: '#ffffff',
                rgb: '217, 70, 239', surfaceRgb: '74, 4, 78'
            },
            previewBackground: 'dzika-karta',
            backgrounds: {
                'dzika-karta': {
                    colors: [0xd946ef, 0xf472b6, 0xc084fc, 0xf8fafc],
                    alpha: [0.06, 0.19], speed: 0.78, confetti: false, motif: 'party', overlayMotif: 'wild-cards',
                    metaColor: '#701a75', pageBase: '#0b0610',
                    pageGlowRgb: '217, 70, 239', pageGlowAltRgb: '244, 114, 182',
                    pageGlowAlpha: '.16', pageGlowAltAlpha: '.055'
                }
            }
        }
    }
];

export function registerPrototypeGames() {
    return PROTOTYPE_GAMES.map(config => getGameModule(config.id) || registerGameModule(config));
}
