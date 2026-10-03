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
    },
    {
        id: 'trzy-na-piec',
        catalog: {
            name: 'Trzy na Pięć',
            description: 'Wymień trzy rzeczy z zadanej kategorii, zanim minie pięć sekund.',
            icon: 'fa-stopwatch',
            status: 'prototype',
            order: 60
        },
        theme: {
            palette: {
                accent: '#eab308', strong: '#a16207', alt: '#fde047', text: '#fef08a', contrast: '#111827',
                rgb: '234, 179, 8', surfaceRgb: '66, 32, 6'
            },
            previewBackground: 'trzy-na-piec',
            backgrounds: {
                'trzy-na-piec': {
                    colors: [0xeab308, 0xfacc15, 0xfde047, 0xf8fafc],
                    alpha: [0.05, 0.16], speed: 0.72, confetti: false, motif: 'party', overlayMotif: 'three-in-five',
                    metaColor: '#713f12', pageBase: '#120d02',
                    pageGlowRgb: '234, 179, 8', pageGlowAltRgb: '253, 224, 71',
                    pageGlowAlpha: '.13', pageGlowAltAlpha: '.045'
                }
            }
        }
    },
    {
        id: 'synchronizacja',
        catalog: {
            name: 'Synchronizacja',
            description: 'Daj wskazówkę tak, żeby reszta ekipy trafiła w ukryty punkt na skali.',
            icon: 'fa-wave-square',
            status: 'prototype',
            order: 70
        },
        theme: {
            palette: {
                accent: '#8b5cf6', strong: '#6d28d9', alt: '#c4b5fd', text: '#ddd6fe', contrast: '#ffffff',
                rgb: '139, 92, 246', surfaceRgb: '46, 16, 101'
            },
            previewBackground: 'synchronizacja',
            backgrounds: {
                synchronizacja: {
                    colors: [0x8b5cf6, 0xa78bfa, 0xc4b5fd, 0xf8fafc],
                    alpha: [0.05, 0.16], speed: 0.58, confetti: false, motif: 'party', overlayMotif: 'sync-spectrum',
                    metaColor: '#4c1d95', pageBase: '#0b0614',
                    pageGlowRgb: '139, 92, 246', pageGlowAltRgb: '196, 181, 253',
                    pageGlowAlpha: '.13', pageGlowAltAlpha: '.045'
                }
            }
        }
    }
];

export function registerPrototypeGames() {
    return PROTOTYPE_GAMES.map(config => getGameModule(config.id) || registerGameModule(config));
}
