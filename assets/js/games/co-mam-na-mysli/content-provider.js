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
    // The historical 90-card file is preserved for the original seed.
    // A new build ships all nine curated categories as smaller, editable files.
    const offlineCategoryIds = [
        'zwierzeta', 'zawody', 'jedzenie', 'miejsca', 'przedmioty',
        'czynnosci', 'bohaterowie', 'sport_hobby', 'transport'
    ];
    try {
        const categories = await Promise.all(offlineCategoryIds.map(async id => {
            const response = await fetch(`./content/cmm-pack/${id}.json`, { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${id}`);
            const category = await response.json();
            if (category?.id !== id || !Array.isArray(category.words) || category.words.length < 150) {
                throw new Error(`Nieprawidłowy pakiet lokalny: ${id}`);
            }
            return category;
        }));
        content = { schemaVersion: 1, game: 'co-mam-na-mysli', locale: 'pl', categories };
    } catch (error) {
        console.warn('Nie udało się wczytać rozszerzonej paczki Co mam na myśli?.', error);
        try {
            const response = await fetch('./content/co-mam-na-mysli.pl.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            content = await response.json();
        } catch (fallbackError) {
            console.warn('Korzystam z awaryjnego zestawu 8 haseł.', fallbackError);
        }
    }

    // 18+ is delivered only inside builds that support conscious selection.
    // NEVER append it to the public Supabase document: older clients select
    // all remote categories automatically and have no adult opt-in support.
    let bundledAdult = null;
    try {
        const response = await fetch('./content/cmm-pack/adult.json', { cache: 'no-store' });
        if (response.ok) {
            const category = await response.json();
            if (category?.id === 'adult' && category.adult === true &&
                Array.isArray(category.words) && category.words.length >= 150) {
                bundledAdult = category;
            }
        }
    } catch (error) {
        console.warn('Pakiet kategorii 18+ Co mam na myśli? jest niedostępny.', error);
    }

    // Published remote content is optional. A missing server never breaks offline games.
    try {
        const published = await contentRepository.loadRemote('co-mam-na-mysli', 'pl');
        if (published) content = published;
    } catch (error) {
        console.warn('Nie udało się pobrać opublikowanej bazy co-mam-na-mysli.', error);
    }

    try {
        const chosen = normalizeCoMamNaMysliContent(content);
        // Do not trust category metadata received from remote content.
        // Only this application's bundled adult.json can mark a category 18+.
        const safeCategories = chosen.categories.filter(category => category.id !== 'adult');
        if (bundledAdult) {
            const adult = normalizeCoMamNaMysliContent({
                schemaVersion: 1, game: 'co-mam-na-mysli', locale: 'pl',
                categories: [bundledAdult]
            }).categories[0];
            adult.adult = true;
            safeCategories.push(adult);
        }
        CO_MAM_NA_MYSLI_CATEGORIES = safeCategories;
    } catch (error) {
        console.warn('Baza Co mam na myśli? ma nieprawidłowy format. Używam paczki awaryjnej.', error);
        CO_MAM_NA_MYSLI_CATEGORIES = normalizeCoMamNaMysliContent(CO_MAM_NA_MYSLI_FALLBACK_CONTENT).categories;
    }
    return CO_MAM_NA_MYSLI_CATEGORIES;
}
