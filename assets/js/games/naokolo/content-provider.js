let NAOKOLO_CATEGORIES = [];

const NAOKOLO_FALLBACK_CONTENT = {
    schemaVersion: 1,
    game: 'naokolo',
    locale: 'pl',
    categories: [
        {
            id: 'start',
            name: 'Na start',
            desc: 'Awaryjny zestaw lokalny.',
            icon: 'fa-bolt',
            cards: [
                { word: 'Rower', forbidden: ['koła', 'pedały', 'jechać', 'kierownica', 'rowerzysta'] },
                { word: 'Kawa', forbidden: ['pić', 'kubek', 'rano', 'kofeina', 'ziarna'] },
                { word: 'Kino', forbidden: ['film', 'ekran', 'popcorn', 'bilet', 'sala'] },
                { word: 'Walizka', forbidden: ['podróż', 'bagaż', 'pakować', 'lotnisko', 'ubrania'] },
                { word: 'Świeczka', forbidden: ['ogień', 'knot', 'płomień', 'tort', 'wosk'] },
                { word: 'Mapa', forbidden: ['droga', 'kraj', 'nawigacja', 'kierunek', 'papier'] }
            ]
        }
    ]
};

function normalizeNaokoloContent(payload) {
    if (!payload || payload.game !== 'naokolo' || !Array.isArray(payload.categories)) {
        throw new Error('Nieprawidłowa baza Naokoło.');
    }

    const categoryIds = new Set();
    const categories = payload.categories.map(category => {
        const id = String(category?.id || '').trim();
        const name = String(category?.name || '').trim();
        const desc = String(category?.desc || '').trim();
        const icon = String(category?.icon || 'fa-layer-group').trim();
        if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || categoryIds.has(id)) throw new Error('Nieprawidłowa kategoria Naokoło.');
        if (!name || !Array.isArray(category.cards) || category.cards.length === 0) throw new Error('Pusta kategoria Naokoło.');
        categoryIds.add(id);

        const cards = category.cards.map(card => {
            const word = String(card?.word || '').trim().slice(0, 80);
            const forbidden = Array.isArray(card?.forbidden)
                ? [...new Set(card.forbidden.map(item => String(item || '').trim()).filter(Boolean))].slice(0, 6)
                : [];
            if (!word || forbidden.length < 3) throw new Error('Nieprawidłowa karta Naokoło.');
            return { word, forbidden: forbidden.map(item => item.slice(0, 50)) };
        });

        return { id, name: name.slice(0, 60), desc: desc.slice(0, 160), icon, cards };
    });

    return { schemaVersion: 1, game: 'naokolo', locale: 'pl', categories };
}

async function initializeNaokoloContent() {
    let content = NAOKOLO_FALLBACK_CONTENT;
    try {
        const response = await fetch('./content/naokolo.pl.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    } catch (error) {
        console.warn('Nie udało się załadować pełnej bazy Naokoło. Używam paczki awaryjnej.', error);
    }

    try {
        NAOKOLO_CATEGORIES = normalizeNaokoloContent(content).categories;
    } catch (error) {
        console.warn('Baza Naokoło ma nieprawidłowy format. Używam paczki awaryjnej.', error);
        NAOKOLO_CATEGORIES = normalizeNaokoloContent(NAOKOLO_FALLBACK_CONTENT).categories;
    }
    return NAOKOLO_CATEGORIES;
}
