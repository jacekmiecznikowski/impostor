let DZIKA_KARTA_PROMPTS = [];
let DZIKA_KARTA_ANSWERS = [];

const DZIKA_KARTA_FALLBACK = {
    schemaVersion: 1,
    game: 'dzika-karta',
    locale: 'pl',
    prompts: [
        'Najgorszy pomysł na prezent to ____.',
        'Nowa atrakcja w biurze: ____.',
        'W mojej lodówce znaleziono ____.'
    ],
    answers: [
        'nadmuchiwany ziemniak',
        'dramatyczne wejście',
        'kanapka bez przyszłości',
        'bardzo podejrzany paragon',
        'cisza pełna napięcia',
        'robot tańczący sambę',
        'słoik z planem awaryjnym',
        'trzy lewe skarpetki',
        'instrukcja bez obrazków',
        'gołąb z ambicjami'
    ]
};

function normalizeDzikaKartaContent(payload) {
    if (!payload || payload.game !== 'dzika-karta' || !Array.isArray(payload.prompts) || !Array.isArray(payload.answers)) {
        throw new Error('Nieprawidłowa baza Dzikiej Karty.');
    }

    const prompts = [...new Set(payload.prompts.map(value => String(value || '').trim()).filter(Boolean))]
        .map((text, index) => ({ id: `p-${index + 1}`, text: text.slice(0, 180) }));
    const answers = [...new Set(payload.answers.map(value => String(value || '').trim()).filter(Boolean))]
        .map((text, index) => ({ id: `a-${index + 1}`, text: text.slice(0, 120) }));

    if (prompts.length < 3 || answers.length < 10) throw new Error('Za mało kart Dzikiej Karty.');
    return { prompts, answers };
}

async function initializeDzikaKartaContent() {
    let payload = DZIKA_KARTA_FALLBACK;

    try {
        const response = await fetch('./content/dzika-karta.pl.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        payload = await response.json();
    } catch (error) {
        console.warn('Nie udało się załadować pełnej bazy Dzikiej Karty. Używam paczki awaryjnej.', error);
    }

    try {
        const normalized = normalizeDzikaKartaContent(payload);
        DZIKA_KARTA_PROMPTS = normalized.prompts;
        DZIKA_KARTA_ANSWERS = normalized.answers;
    } catch (error) {
        console.warn('Pełna baza Dzikiej Karty jest nieprawidłowa. Używam paczki awaryjnej.', error);
        const fallback = normalizeDzikaKartaContent(DZIKA_KARTA_FALLBACK);
        DZIKA_KARTA_PROMPTS = fallback.prompts;
        DZIKA_KARTA_ANSWERS = fallback.answers;
    }

    return { prompts: DZIKA_KARTA_PROMPTS, answers: DZIKA_KARTA_ANSWERS };
}
