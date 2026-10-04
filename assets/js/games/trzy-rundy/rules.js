(function exposeTrzyRundyRules(root) {
    const DEFAULT_POOL_SIZE = 24;
    const DEFAULT_TURN_SECONDS = 45;
    const POOL_MIN = 12;
    const POOL_MAX = 36;
    const TURN_MIN = 20;
    const TURN_MAX = 90;
    const ROUND_MODES = [
        { round: 1, id: 'describe', name: 'Opisz', instruction: 'Opisuj dowolnymi słowami, ale nie używaj hasła ani jego części.' },
        { round: 2, id: 'act', name: 'Pokaż', instruction: 'Tylko gesty i pantomima. Bez słów i dźwięków.' },
        { round: 3, id: 'one-word', name: 'Jedno słowo', instruction: 'Możesz powiedzieć dokładnie jedno słowo na każde hasło.' }
    ];

    function normalizeInt(value, min, max, fallback) {
        const parsed = Number.parseInt(value, 10);
        const safe = Number.isFinite(parsed) ? parsed : fallback;
        return Math.min(max, Math.max(min, safe));
    }
    function normalizePoolSize(value) { return normalizeInt(value, POOL_MIN, POOL_MAX, DEFAULT_POOL_SIZE); }
    function normalizeTurnSeconds(value) { return normalizeInt(value, TURN_MIN, TURN_MAX, DEFAULT_TURN_SECONDS); }
    function normalizeRandomValue(random = Math.random) {
        const value = Number(random());
        if (!Number.isFinite(value)) return 0;
        return Math.min(.999999999, Math.max(0, value));
    }
    function shuffle(items, random = Math.random) {
        const result = Array.isArray(items) ? [...items] : [];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(normalizeRandomValue(random) * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    function assignTeams(players) {
        const teams = [[], []];
        (Array.isArray(players) ? players : []).forEach((player, index) => teams[index % 2].push(player));
        return teams;
    }
    function buildWordDeck(categories, activeCategoryIds, random = Math.random) {
        const active = new Set(Array.isArray(activeCategoryIds) ? activeCategoryIds : []);
        const all = [];
        (Array.isArray(categories) ? categories : []).forEach(category => {
            if (!category || !active.has(category.id) || !Array.isArray(category.words)) return;
            category.words.forEach(word => {
                if (word?.id && word?.text) all.push({ id: String(word.id), text: String(word.text), categoryId: String(category.id), categoryName: String(category.name || '') });
            });
        });
        return shuffle(all, random);
    }
    function createPool(categories, activeCategoryIds, poolSize = DEFAULT_POOL_SIZE, random = Math.random) {
        const deck = buildWordDeck(categories, activeCategoryIds, random);
        return deck.slice(0, Math.min(normalizePoolSize(poolSize), deck.length));
    }
    function getRoundMode(round) { return ROUND_MODES.find(mode => mode.round === Number(round)) || ROUND_MODES[0]; }
    function nextTeam(team) { return Number(team) === 0 ? 1 : 0; }
    function nextClueOffset(current, teamSize) {
        const size = Math.max(1, Number(teamSize) || 1);
        return ((Number(current) || 0) + 1) % size;
    }
    function isGameComplete(round) { return Number(round) > ROUND_MODES.length; }
    function teamWinner(scores) {
        const a = Number(scores?.[0]) || 0;
        const b = Number(scores?.[1]) || 0;
        if (a === b) return -1;
        return a > b ? 0 : 1;
    }

    const api = { DEFAULT_POOL_SIZE, DEFAULT_TURN_SECONDS, POOL_MIN, POOL_MAX, TURN_MIN, TURN_MAX, ROUND_MODES, normalizePoolSize, normalizeTurnSeconds, shuffle, assignTeams, buildWordDeck, createPool, getRoundMode, nextTeam, nextClueOffset, isGameComplete, teamWinner };
    root.TrzyRundyRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
