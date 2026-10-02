(function exposeNaokoloRules(root) {
    const ROUND_TIMES = Object.freeze([30, 45, 60, 90]);

    function normalizeRandomValue(random = Math.random) {
        const value = Number(random());
        if (!Number.isFinite(value)) return 0;
        return Math.min(0.999999999, Math.max(0, value));
    }

    function shuffle(items, random = Math.random) {
        const result = Array.isArray(items) ? [...items] : [];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(normalizeRandomValue(random) * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function nextPlayerIndex(currentIndex, playerCount) {
        const count = Number(playerCount);
        if (!Number.isInteger(count) || count <= 0) return -1;
        const current = Number.isInteger(currentIndex) ? currentIndex : 0;
        return ((current % count) + count + 1) % count;
    }

    function normalizeRoundTime(seconds, fallback = 60) {
        const value = Number(seconds);
        return ROUND_TIMES.includes(value) ? value : fallback;
    }

    function scoreTurn({ guessed = 0, forbidden = 0, skipped = 0 } = {}) {
        const safeGuessed = Math.max(0, Number(guessed) || 0);
        const safeForbidden = Math.max(0, Number(forbidden) || 0);
        const safeSkipped = Math.max(0, Number(skipped) || 0);
        return {
            guessed: safeGuessed,
            forbidden: safeForbidden,
            skipped: safeSkipped,
            score: safeGuessed - safeForbidden
        };
    }

    function buildDeck(categories, activeCategoryIds, random = Math.random) {
        const active = new Set(Array.isArray(activeCategoryIds) ? activeCategoryIds : []);
        const cards = [];

        (Array.isArray(categories) ? categories : []).forEach(category => {
            if (!category || !active.has(category.id) || !Array.isArray(category.cards)) return;
            category.cards.forEach(card => {
                if (!card?.word || !Array.isArray(card.forbidden)) return;
                cards.push({
                    categoryId: category.id,
                    categoryName: category.name,
                    word: card.word,
                    forbidden: [...card.forbidden]
                });
            });
        });

        return shuffle(cards, random);
    }

    const api = {
        ROUND_TIMES,
        shuffle,
        nextPlayerIndex,
        normalizeRoundTime,
        scoreTurn,
        buildDeck
    };

    root.NaokoloRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
