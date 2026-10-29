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

function formatBombPromptLabel(value) {
    return String(value || '')
        .trim()
        .replace(/^(wymieniajcie|mówcie)\s+/i, '')
        .replace(/[.!?]+$/g, '')
        .toLocaleUpperCase('pl-PL');
}

function normalizeBombPromptContent(content) {
    if (!content || !Array.isArray(content.categories)) return content;
    return {
        ...content,
        categories: content.categories.map(category => ({
            ...category,
            words: Array.isArray(category.words)
                ? category.words.map(entry => ({
                    ...entry,
                    word: formatBombPromptLabel(entry?.word)
                }))
                : []
        }))
    };
}

async function initializeTickingBombContent() {
    let localContent = BOMB_FALLBACK_CONTENT;

    // The complete curated pack ships with new builds. Keep the small original
    // pack as a fallback and as the unchanged historical Supabase seed.
    for (const source of ['./content/ticking-bomb-expanded.pl.json', './content/ticking-bomb.pl.json']) {
        try {
            const response = await fetch(source, { cache: 'no-store' });
            if (!response.ok) continue;
            const payload = await response.json();
            localContent = contentRepository.validate(payload, 'ticking-bomb', 'pl');
            break;
        } catch (error) {
            console.warn('Nie udało się wczytać lokalnej bazy Tykającej Bomby:', source, error);
        }
    }

    let remoteContent = null;
    try {
        remoteContent = await contentRepository.loadRemote('ticking-bomb', 'pl');
    } catch (_) {}

    // Ship adult prompts only with app builds that explicitly support opt-in.
    // Older installed clients still consume the safe, eight-category remote document.
    const chosen = remoteContent || localContent;
    const safeCategories = chosen.categories.filter(category => category.adult !== true && category.id !== 'adult');
    const localAdult = localContent.categories.find(category => category.id === 'adult' && category.adult === true);
    BOMB_CONTENT = normalizeBombPromptContent({
        ...chosen,
        categories: localAdult ? [...safeCategories, localAdult] : safeCategories
    });
    BOMB_CATEGORIES = BOMB_CONTENT.categories || [];
    normalizeBombActiveCategories?.();
}

function getBombCategoryById(id) {
    return BOMB_CATEGORIES.find(category => category.id === id) || null;
}
