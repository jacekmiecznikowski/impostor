(function exposeCoMamNaMysliRules(root) {
    function shuffle(items, random = Math.random) {
        const copy = Array.isArray(items) ? [...items] : [];
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const unit = Math.min(0.999999, Math.max(0, Number(random()) || 0));
            const j = Math.floor(unit * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function buildDeck(categories, activeCategoryIds, random = Math.random) {
        const active = new Set(Array.isArray(activeCategoryIds) ? activeCategoryIds : []);
        const cards = [];
        (Array.isArray(categories) ? categories : []).forEach(category => {
            if (!category || !active.has(category.id) || !Array.isArray(category.words)) return;
            category.words.forEach(entry => {
                const word = String(entry?.word || '').trim();
                if (!word) return;
                cards.push({ categoryId: category.id, categoryName: category.name, word });
            });
        });
        return shuffle(cards, random);
    }

    function nextPlayerIndex(currentIndex, playerCount) {
        const count = Number(playerCount);
        if (!Number.isInteger(count) || count <= 0) return -1;
        const current = Number.isInteger(currentIndex) ? currentIndex : 0;
        return ((current % count) + count + 1) % count;
    }

    function scoreRound(correct, passed) {
        const safeCorrect = Math.max(0, Number(correct) || 0);
        const safePassed = Math.max(0, Number(passed) || 0);
        return { correct: safeCorrect, passed: safePassed, score: safeCorrect };
    }

    const api = { shuffle, buildDeck, nextPlayerIndex, scoreRound };
    root.CoMamNaMysliRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
