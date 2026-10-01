let BOMB_CONTENT = { categories: [] };
let BOMB_CATEGORIES = [];

const BOMB_FALLBACK_CONTENT = {
    schemaVersion: 1,
    game: 'ticking-bomb',
    locale: 'pl',
    categories: [
        {
            id: 'quick',
            name: 'Szybkie skojarzenia',
            desc: 'Awaryjna lokalna paczka pytań.',
            icon: 'fa-bolt',
            words: [
                { word: 'Wymieniajcie zwierzęta.', hint: '' },
                { word: 'Wymieniajcie rzeczy w kolorze żółtym.', hint: '' },
                { word: 'Wymieniajcie owoce.', hint: '' },
                { word: 'Wymieniajcie rzeczy, które są zimne.', hint: '' }
            ]
        }
    ],
    discussionTips: []
};

async function initializeTickingBombContent() {
    let localContent = BOMB_FALLBACK_CONTENT;

    try {
        const response = await fetch('./content/ticking-bomb.pl.json', { cache: 'no-store' });
        if (response.ok) {
            const payload = await response.json();
            localContent = contentRepository.validate(payload, 'ticking-bomb', 'pl');
        }
    } catch (error) {
        console.warn('Nie udało się wczytać lokalnej bazy Tykającej Bomby.', error);
    }

    let remoteContent = null;
    try {
        remoteContent = await contentRepository.loadRemote('ticking-bomb', 'pl');
    } catch (_) {}

    BOMB_CONTENT = remoteContent || localContent;
    BOMB_CATEGORIES = BOMB_CONTENT.categories || [];
    normalizeBombActiveCategories?.();
}

function getBombCategoryById(id) {
    return BOMB_CATEGORIES.find(category => category.id === id) || null;
}
