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
    },
    {
        id: 'trzy-rundy',
        catalog: {
            name: 'Trzy Rundy',
            description: 'Te same hasła: najpierw opisuj, potem pokazuj, na końcu użyj jednego słowa.',
            icon: 'fa-arrows-rotate',
            status: 'prototype',
            order: 50
        },
        theme: {
            palette: {
                accent: '#22c55e', strong: '#15803d', alt: '#86efac', text: '#bbf7d0', contrast: '#ffffff',
                rgb: '34, 197, 94', surfaceRgb: '5, 46, 22'
            },
            previewBackground: 'trzy-rundy',
            backgrounds: {
                'trzy-rundy': {
                    colors: [0x22c55e, 0x4ade80, 0x86efac, 0xf8fafc],
                    alpha: [0.05, 0.16], speed: 0.62, confetti: false, motif: 'party', overlayMotif: 'three-rounds',
                    metaColor: '#14532d', pageBase: '#03120a',
                    pageGlowRgb: '34, 197, 94', pageGlowAltRgb: '134, 239, 172',
                    pageGlowAlpha: '.13', pageGlowAltAlpha: '.045'
                }
            }
        }
    }
];

export function registerPrototypeGames() {
    return PROTOTYPE_GAMES.map(config => getGameModule(config.id) || registerGameModule(config));
}
