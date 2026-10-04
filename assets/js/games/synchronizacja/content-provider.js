let SYNCHRONIZACJA_CATEGORIES = [];

const SYNCHRONIZACJA_FALLBACK_CONTENT = {
    schemaVersion: 1,
    game: 'synchronizacja',
    locale: 'pl',
    categories: [
        {
            id: 'start',
            name: 'Na start',
            desc: 'Awaryjny zestaw lokalny.',
            icon: 'fa-wave-square',
            scales: [
                { id: 'start-1', left: 'Tani', right: 'Luksusowy' },
                { id: 'start-2', left: 'Spokojny', right: 'Chaotyczny' },
                { id: 'start-3', left: 'Praktyczny', right: 'Efektowny' },
                { id: 'start-4', left: 'Niszowy', right: 'Mainstreamowy' }
            ]
        }
    ]
};

function normalizeSynchronizacjaContent(payload) {
    if (!payload || payload.game !== 'synchronizacja' || !Array.isArray(payload.categories)) {
        throw new Error('Nieprawidłowa baza Synchronizacji.');
    }

    const categoryIds = new Set();
    const scaleIds = new Set();
    const categories = payload.categories.map(category => {
        const id = String(category?.id || '').trim();
        const name = String(category?.name || '').trim();
        const desc = String(category?.desc || '').trim();
        const icon = String(category?.icon || 'fa-wave-square').trim();
        if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || categoryIds.has(id)) throw new Error('Nieprawidłowa kategoria Synchronizacji.');
        if (!name || !Array.isArray(category.scales) || category.scales.length === 0) throw new Error('Pusta kategoria Synchronizacji.');
        categoryIds.add(id);

        const scales = category.scales.map(scale => {
            const scaleId = String(scale?.id || '').trim();
            const left = String(scale?.left || '').trim().slice(0, 80);
            const right = String(scale?.right || '').trim().slice(0, 80);
            if (!scaleId || scaleIds.has(scaleId) || !left || !right || left === right) throw new Error('Nieprawidłowa skala Synchronizacji.');
            scaleIds.add(scaleId);
            return { id: scaleId, left, right };
        });

        return { id, name: name.slice(0, 60), desc: desc.slice(0, 160), icon, scales };
    });

    return { schemaVersion: 1, game: 'synchronizacja', locale: 'pl', categories };
}

async function initializeSynchronizacjaContent() {
    let content = SYNCHRONIZACJA_FALLBACK_CONTENT;
    try {
        const response = await fetch('./content/synchronizacja.pl.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    } catch (error) {
        console.warn('Nie udało się załadować pełnej bazy Synchronizacji. Używam paczki awaryjnej.', error);
    }

    try {
        SYNCHRONIZACJA_CATEGORIES = normalizeSynchronizacjaContent(content).categories;
    } catch (error) {
        console.warn('Baza Synchronizacji ma nieprawidłowy format. Używam paczki awaryjnej.', error);
        SYNCHRONIZACJA_CATEGORIES = normalizeSynchronizacjaContent(SYNCHRONIZACJA_FALLBACK_CONTENT).categories;
    }
    return SYNCHRONIZACJA_CATEGORIES;
}
