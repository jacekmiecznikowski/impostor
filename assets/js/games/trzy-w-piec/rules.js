(function exposeThreeFiveRules(root) {
    const TARGET_SCORES = Object.freeze([5, 10, 15]);
    const TURN_SECONDS = 5;
    const RECENT_PROMPT_LIMIT = 36;

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

    function normalizeTargetScore(value, fallback = 10) {
        const score = Number(value);
        return TARGET_SCORES.includes(score) ? score : fallback;
    }

    function buildPromptDeck(categories, activeCategoryIds, recentPromptIds = [], random = Math.random) {
        const active = new Set(Array.isArray(activeCategoryIds) ? activeCategoryIds : []);
        const recent = new Set(Array.isArray(recentPromptIds) ? recentPromptIds : []);
        const all = [];

        (Array.isArray(categories) ? categories : []).forEach(category => {
            if (!category || !active.has(category.id) || !Array.isArray(category.prompts)) return;
            category.prompts.forEach(prompt => {
                if (!prompt?.id || !prompt?.text) return;
                all.push({
                    id: String(prompt.id),
                    text: String(prompt.text),
                    categoryId: String(category.id),
                    categoryName: String(category.name || '')
                });
            });
        });

        const fresh = all.filter(prompt => !recent.has(prompt.id));
        return shuffle(fresh.length ? fresh : all, random);
    }

    function rememberPrompt(recentPromptIds, promptId, limit = RECENT_PROMPT_LIMIT) {
        const id = String(promptId || '').trim();
        const previous = Array.isArray(recentPromptIds) ? recentPromptIds.map(String) : [];
        if (!id) return previous.slice(-Math.max(1, limit));
        const unique = previous.filter(item => item !== id);
        unique.push(id);
        return unique.slice(-Math.max(1, Number(limit) || RECENT_PROMPT_LIMIT));
    }

    function scoreVerdict(success) {
        return success ? 1 : 0;
    }

    function hasWinner(score, targetScore) {
        return Math.max(0, Number(score) || 0) >= normalizeTargetScore(targetScore, 10);
    }

    const api = {
        TARGET_SCORES,
        TURN_SECONDS,
        RECENT_PROMPT_LIMIT,
        shuffle,
        nextPlayerIndex,
        normalizeTargetScore,
        buildPromptDeck,
        rememberPrompt,
        scoreVerdict,
        hasWinner
    };

    root.ThreeFiveRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
