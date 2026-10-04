(function exposeSynchronizacjaRules(root) {
    const RECENT_SCALE_LIMIT = 24;
    const TARGET_MIN = 8;
    const TARGET_MAX = 92;

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

    function createTarget(random = Math.random) {
        const span = TARGET_MAX - TARGET_MIN + 1;
        return TARGET_MIN + Math.floor(normalizeRandomValue(random) * span);
    }

    function normalizePosition(value, fallback = 50) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(100, Math.max(0, Math.round(parsed)));
    }

    function scoreDistance(distance) {
        const value = Math.max(0, Number(distance) || 0);
        if (value <= 4) return 4;
        if (value <= 9) return 3;
        if (value <= 16) return 2;
        if (value <= 25) return 1;
        return 0;
    }

    function scoreGuess(target, guess) {
        const normalizedTarget = normalizePosition(target);
        const normalizedGuess = normalizePosition(guess);
        const distance = Math.abs(normalizedTarget - normalizedGuess);
        return { target: normalizedTarget, guess: normalizedGuess, distance, points: scoreDistance(distance) };
    }

    function buildScaleDeck(categories, activeCategoryIds, recentScaleIds = [], random = Math.random) {
        const active = new Set(Array.isArray(activeCategoryIds) ? activeCategoryIds : []);
        const recent = new Set(Array.isArray(recentScaleIds) ? recentScaleIds : []);
        const all = [];
        (Array.isArray(categories) ? categories : []).forEach(category => {
            if (!category || !active.has(category.id) || !Array.isArray(category.scales)) return;
            category.scales.forEach(scale => {
                if (!scale?.id || !scale?.left || !scale?.right) return;
                all.push({
                    id: String(scale.id),
                    left: String(scale.left),
                    right: String(scale.right),
                    categoryId: String(category.id),
                    categoryName: String(category.name || '')
                });
            });
        });
        const fresh = all.filter(scale => !recent.has(scale.id));
        return shuffle(fresh.length ? fresh : all, random);
    }

    function rememberScale(recentScaleIds, scaleId, limit = RECENT_SCALE_LIMIT) {
        const id = String(scaleId || '').trim();
        const previous = Array.isArray(recentScaleIds) ? recentScaleIds.map(String) : [];
        if (!id) return previous.slice(-Math.max(1, limit));
        const unique = previous.filter(item => item !== id);
        unique.push(id);
        return unique.slice(-Math.max(1, Number(limit) || RECENT_SCALE_LIMIT));
    }

    function sortStandings(players) {
        return [...(Array.isArray(players) ? players : [])].sort((a, b) =>
            (Number(b?.score) || 0) - (Number(a?.score) || 0)
            || (Number(a?.turns) || 0) - (Number(b?.turns) || 0)
            || String(a?.name || '').localeCompare(String(b?.name || ''), 'pl')
        );
    }

    function getLeaders(players) {
        const sorted = sortStandings(players);
        if (!sorted.length) return [];
        const topScore = Number(sorted[0]?.score) || 0;
        return sorted.filter(player => (Number(player?.score) || 0) === topScore);
    }

    const api = {
        RECENT_SCALE_LIMIT,
        TARGET_MIN,
        TARGET_MAX,
        shuffle,
        nextPlayerIndex,
        isRoundComplete,
        createTarget,
        normalizePosition,
        scoreDistance,
        scoreGuess,
        buildScaleDeck,
        rememberScale,
        sortStandings,
        getLeaders
    };

    root.SynchronizacjaRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
