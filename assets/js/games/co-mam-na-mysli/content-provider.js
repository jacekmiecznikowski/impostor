let CO_MAM_NA_MYSLI_CATEGORIES = [];

const CO_MAM_NA_MYSLI_FALLBACK_CONTENT = {
    schemaVersion: 1,
    game: 'co-mam-na-mysli',
    locale: 'pl',
    categories: [
        {
            id: 'start',
            name: 'Na start',
            desc: 'Awaryjny zestaw lokalny.',
            icon: 'fa-bolt',
            words: [
                { word: 'Pingwin' }, { word: 'Pizza' }, { word: 'Lotnisko' }, { word: 'Parasol' },
                { word: 'Strażak' }, { word: 'Kichanie' }, { word: 'Delfin' }, { word: 'Walizka' }
            ]
        }
    ]
};

function normalizeCoMamNaMysliContent(payload) {
    if (!payload || payload.game !== 'co-mam-na-mysli' || !Array.isArray(payload.categories)) {
        throw new Error('Nieprawidłowa baza Co mam na myśli?.');
    }

    const categoryIds = new Set();
    const categories = payload.categories.map(category => {
        const id = String(category?.id || '').trim();
        const name = String(category?.name || '').trim();
        const desc = String(category?.desc || '').trim();
        const icon = String(category?.icon || 'fa-layer-group').trim();
        if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || categoryIds.has(id)) throw new Error('Nieprawidłowa kategoria Co mam na myśli?.');
        if (!name || !Array.isArray(category.words) || category.words.length === 0) throw new Error('Pusta kategoria Co mam na myśli?.');
        categoryIds.add(id);

        const words = category.words.map(entry => {
            const word = String(entry?.word || '').trim().slice(0, 80);
            if (!word) throw new Error('Puste hasło Co mam na myśli?.');
            return { word };
        });

        return { id, name: name.slice(0, 60), desc: desc.slice(0, 160), icon, words };
    });

    return { schemaVersion: 1, game: 'co-mam-na-mysli', locale: 'pl', categories };
}

async function initializeCoMamNaMysliContent() {
    let content = CO_MAM_NA_MYSLI_FALLBACK_CONTENT;
    try {
        const response = await fetch('./content/co-mam-na-mysli.pl.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    } catch (error) {
        console.warn('Nie udało się załadować pełnej bazy Co mam na myśli?. Używam paczki awaryjnej.', error);
    }

    try {
        CO_MAM_NA_MYSLI_CATEGORIES = normalizeCoMamNaMysliContent(content).categories;
    } catch (error) {
        console.warn('Baza Co mam na myśli? ma nieprawidłowy format. Używam paczki awaryjnej.', error);
        CO_MAM_NA_MYSLI_CATEGORIES = normalizeCoMamNaMysliContent(CO_MAM_NA_MYSLI_FALLBACK_CONTENT).categories;
    }
    return CO_MAM_NA_MYSLI_CATEGORIES;
}
