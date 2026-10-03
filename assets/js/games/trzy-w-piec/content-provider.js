let THREE_FIVE_CATEGORIES = [];

const THREE_FIVE_FALLBACK_CONTENT = {
    schemaVersion: 1,
    game: 'trzy-w-piec',
    locale: 'pl',
    categories: [
        {
            id: 'start',
            name: 'Na start',
            desc: 'Awaryjny zestaw lokalny.',
            icon: 'fa-bolt',
            prompts: [
                { id: 'start-01', text: 'Wymień 3 rzeczy, które zabierasz na wakacje.' },
                { id: 'start-02', text: 'Wymień 3 rzeczy, które można znaleźć w kuchni.' },
                { id: 'start-03', text: 'Wymień 3 zwierzęta, które żyją w wodzie.' },
                { id: 'start-04', text: 'Wymień 3 rzeczy, które robisz po przebudzeniu.' },
                { id: 'start-05', text: 'Wymień 3 rzeczy, które mają koła.' },
                { id: 'start-06', text: 'Wymień 3 rzeczy, które można zgubić.' }
            ]
        }
    ]
};

function normalizeThreeFiveContent(payload) {
    if (!payload || payload.game !== 'trzy-w-piec' || !Array.isArray(payload.categories)) {
        throw new Error('Nieprawidłowa baza Trzy w Pięć.');
    }

    const categoryIds = new Set();
    const promptIds = new Set();
    const categories = payload.categories.map(category => {
        const id = String(category?.id || '').trim();
        const name = String(category?.name || '').trim();
        const desc = String(category?.desc || '').trim();
        const icon = String(category?.icon || 'fa-layer-group').trim();
        if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(id) || categoryIds.has(id)) throw new Error('Nieprawidłowa kategoria Trzy w Pięć.');
        if (!name || !Array.isArray(category.prompts) || category.prompts.length === 0) throw new Error('Pusta kategoria Trzy w Pięć.');
        categoryIds.add(id);

        const prompts = category.prompts.map((prompt, index) => {
            const promptId = String(prompt?.id || `${id}-${String(index + 1).padStart(2, '0')}`).trim();
            const text = String(prompt?.text || '').trim().replace(/\s+/g, ' ').slice(0, 180);
            if (!/^[a-z0-9][a-z0-9_-]{0,59}$/.test(promptId) || promptIds.has(promptId) || !text) {
                throw new Error('Nieprawidłowy prompt Trzy w Pięć.');
            }
            promptIds.add(promptId);
            return { id: promptId, text };
        });

        return { id, name: name.slice(0, 60), desc: desc.slice(0, 160), icon, prompts };
    });

    return { schemaVersion: 1, game: 'trzy-w-piec', locale: 'pl', categories };
}

async function initializeThreeFiveContent() {
    let content = THREE_FIVE_FALLBACK_CONTENT;
    try {
        const response = await fetch('./content/trzy-w-piec.pl.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        content = await response.json();
    } catch (error) {
        console.warn('Nie udało się załadować pełnej bazy Trzy w Pięć. Używam paczki awaryjnej.', error);
    }

    try {
        THREE_FIVE_CATEGORIES = normalizeThreeFiveContent(content).categories;
    } catch (error) {
        console.warn('Baza Trzy w Pięć ma nieprawidłowy format. Używam paczki awaryjnej.', error);
        THREE_FIVE_CATEGORIES = normalizeThreeFiveContent(THREE_FIVE_FALLBACK_CONTENT).categories;
    }
    return THREE_FIVE_CATEGORIES;
}
