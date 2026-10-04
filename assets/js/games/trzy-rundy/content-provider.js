let TRZY_RUNDY_CATEGORIES = [];

const TRZY_RUNDY_FALLBACK_CONTENT = {
    schemaVersion: 1,
    game: 'trzy-rundy',
    locale: 'pl',
    categories: [{
        id: 'start', name: 'Na start', icon: 'fa-bolt',
        words: ['Parasol', 'Karaoke', 'Astronauta', 'Pierogi', 'Detektyw', 'Walizka', 'Sushi', 'Pirata']
    }]
};

function normalizeTrzyRundyContent(payload) {
    if (!payload || payload.game !== 'trzy-rundy' || !Array.isArray(payload.categories)) throw new Error('Nieprawidłowa baza Trzech Rund.');
    const ids = new Set();
    const wordsSeen = new Set();
    const categories = payload.categories.map(category => {
        const id = String(category?.id || '').trim();
        const name = String(category?.name || '').trim();
        const icon = String(category?.icon || 'fa-layer-group').trim();
        if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || ids.has(id) || !name) throw new Error('Nieprawidłowa kategoria Trzech Rund.');
        ids.add(id);
        const words = Array.isArray(category.words) ? category.words.map((word, index) => {
            const text = String(word || '').trim().slice(0, 70);
            const key = text.toLocaleLowerCase('pl-PL');
            if (!text || wordsSeen.has(key)) throw new Error('Powtórzone lub puste hasło Trzech Rund.');
            wordsSeen.add(key);
            return { id: `${id}-${index + 1}`, text };
        }) : [];
        if (!words.length) throw new Error('Pusta kategoria Trzech Rund.');
        return { id, name: name.slice(0, 60), icon, words };
    });
    return { schemaVersion: 1, game: 'trzy-rundy', locale: 'pl', categories };
}

async function initializeTrzyRundyContent() {
    let content = TRZY_RUNDY_FALLBACK_CONTENT;
    try {
        const response = await fetch('./content/trzy-rundy.pl.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    } catch (error) {
        console.warn('Nie udało się załadować pełnej bazy Trzech Rund. Używam paczki awaryjnej.', error);
    }
    try {
        TRZY_RUNDY_CATEGORIES = normalizeTrzyRundyContent(content).categories;
    } catch (error) {
        console.warn('Baza Trzech Rund ma nieprawidłowy format. Używam paczki awaryjnej.', error);
        TRZY_RUNDY_CATEGORIES = normalizeTrzyRundyContent(TRZY_RUNDY_FALLBACK_CONTENT).categories;
    }
    return TRZY_RUNDY_CATEGORIES;
}
