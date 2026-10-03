(function exposeThreeFiveRules(root) {
    const DEFAULT_ANSWER_COUNT = 3;
    const DEFAULT_TURN_SECONDS = 5;
    const MAX_CHALLENGE_VALUE = 60;
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

    function isRoundComplete(turnNumber, playerCount) {
        const turns = Math.max(0, Number.parseInt(turnNumber, 10) || 0);
        const count = Math.max(0, Number.parseInt(playerCount, 10) || 0);
        return count > 0 && turns > 0 && turns % count === 0;
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
        const noun = count === 1 ? 'rzecz' : 'rzeczy';
        return source.replace(/^Wymień\s+\d+\s+rzeczy\b/i, `Wymień ${count} ${noun}`);
    }

    function getAnswerUnit(answerCount) {
        const count = normalizeChallengeValue(answerCount, DEFAULT_ANSWER_COUNT);
        if (count === 1) return 'odpowiedź';
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

    function sortStandings(players) {
        return (Array.isArray(players) ? [...players] : []).sort((a, b) => {
            const scoreDiff = (Number(b?.score) || 0) - (Number(a?.score) || 0);
            if (scoreDiff) return scoreDiff;
            const turnsDiff = (Number(a?.turns) || 0) - (Number(b?.turns) || 0);
            if (turnsDiff) return turnsDiff;
            return String(a?.name || '').localeCompare(String(b?.name || ''), 'pl');
        });
    }

    function getLeaders(players) {
        const standings = sortStandings(players);
        if (!standings.length) return [];
        const topScore = Math.max(0, Number(standings[0]?.score) || 0);
        return standings.filter(player => Math.max(0, Number(player?.score) || 0) === topScore);
    }

    const api = {
        DEFAULT_ANSWER_COUNT,
        DEFAULT_TURN_SECONDS,
        MAX_CHALLENGE_VALUE,
        RECENT_PROMPT_LIMIT,
        shuffle,
        nextPlayerIndex,
        isRoundComplete,
        normalizeChallengeValue,
        formatPrompt,
        getAnswerUnit,
        buildPromptDeck,
        rememberPrompt,
        scoreVerdict,
        sortStandings,
        getLeaders
    };

    root.ThreeFiveRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
