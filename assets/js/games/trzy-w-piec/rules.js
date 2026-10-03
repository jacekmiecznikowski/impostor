(function exposeThreeFiveRules(root) {
    const DEFAULT_ANSWER_COUNT = 3;
    const DEFAULT_TURN_SECONDS = 5;
    const MAX_CHALLENGE_VALUE = 60;
    const MATCH_TARGET_SCORE = 10;
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

    function normalizeChallengeValue(value, fallback) {
        const parsed = Number.parseInt(value, 10);
        const safeFallback = Math.min(MAX_CHALLENGE_VALUE, Math.max(1, Number.parseInt(fallback, 10) || 1));
        if (!Number.isFinite(parsed)) return safeFallback;
        return Math.min(MAX_CHALLENGE_VALUE, Math.max(1, parsed));
    }

    function formatPrompt(text, answerCount = DEFAULT_ANSWER_COUNT) {
        const count = normalizeChallengeValue(answerCount, DEFAULT_ANSWER_COUNT);
        const source = String(text || 'Wymień 3 rzeczy.');
        return source.replace(/^Wymień\s+\d+\b/i, `Wymień ${count}`);
    }

    function getAnswerUnit(answerCount) {
        const count = normalizeChallengeValue(answerCount, DEFAULT_ANSWER_COUNT);
        const mod10 = count % 10;
        const mod100 = count % 100;
        if (count === 1) return 'odpowiedź';
        if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'odpowiedzi';
        return 'odpowiedzi';
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

    function hasWinner(score, targetScore = MATCH_TARGET_SCORE) {
        return Math.max(0, Number(score) || 0) >= Math.max(1, Number(targetScore) || MATCH_TARGET_SCORE);
    }

    const api = {
        DEFAULT_ANSWER_COUNT,
        DEFAULT_TURN_SECONDS,
        MAX_CHALLENGE_VALUE,
        MATCH_TARGET_SCORE,
        RECENT_PROMPT_LIMIT,
        shuffle,
        nextPlayerIndex,
        normalizeChallengeValue,
        formatPrompt,
        getAnswerUnit,
        buildPromptDeck,
        rememberPrompt,
        scoreVerdict,
        hasWinner
    };

    root.ThreeFiveRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
