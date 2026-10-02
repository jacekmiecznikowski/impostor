(function exposeTickingBombRules(root) {
    const FUSE_PRESETS = Object.freeze({
        unstable: Object.freeze({
            id: 'unstable',
            label: 'Niestabilny ładunek',
            minSeconds: 5,
            maxSeconds: 120,
            description: 'Pełny chaos — wybuch może nadejść niemal od razu albo bardzo późno'
        }),
        short: Object.freeze({
            id: 'short',
            label: 'Krótki lont',
            minSeconds: 5,
            maxSeconds: 30,
            description: 'Krótka, szybka runda z dużą presją'
        }),
        long: Object.freeze({
            id: 'long',
            label: 'Długi lont',
            minSeconds: 30,
            maxSeconds: 120,
            description: 'Więcej czasu na odpowiedzi i podawanie telefonu'
        })
    });

    function randomBetween(min, max, random = Math.random) {
        const lower = Number(min);
        const upper = Number(max);
        if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
            throw new Error('Granice losowania muszą być liczbami.');
        }
        if (upper <= lower) return lower;
        const unit = Number(random());
        const normalized = Number.isFinite(unit) ? Math.min(1, Math.max(0, unit)) : 0;
        return lower + normalized * (upper - lower);
    }

    function pickRandomIndex(length, random = Math.random) {
        const size = Number(length);
        if (!Number.isInteger(size) || size <= 0) return -1;
        return Math.min(size - 1, Math.floor(randomBetween(0, size, random)));
    }

    function choosePrompt(categories, activeCategoryIds, random = Math.random) {
        const categoryList = Array.isArray(categories) ? categories : [];
        const active = new Set(Array.isArray(activeCategoryIds) ? activeCategoryIds : []);
        const available = categoryList.filter(category => (
            category
            && active.has(category.id)
            && Array.isArray(category.words)
            && category.words.length > 0
        ));
        const categoryIndex = pickRandomIndex(available.length, random);
        if (categoryIndex < 0) return null;
        const category = available[categoryIndex];
        const promptIndex = pickRandomIndex(category.words.length, random);
        const entry = category.words[promptIndex];
        if (!entry) return null;
        return {
            categoryId: category.id,
            categoryName: category.name,
            prompt: entry.word
        };
    }

    function chooseStartingPlayerIndex(playerCount, random = Math.random) {
        return pickRandomIndex(playerCount, random);
    }

    function getFuseDurationMs(presetId, random = Math.random, presets = FUSE_PRESETS) {
        const source = presets && typeof presets === 'object' ? presets : FUSE_PRESETS;
        const fallback = source.unstable || FUSE_PRESETS.unstable;
        const preset = source[presetId] || fallback;
        if (!preset) throw new Error('Brak konfiguracji lontu.');
        return Math.round(randomBetween(preset.minSeconds, preset.maxSeconds, random) * 1000);
    }

    function nextPlayerIndex(currentIndex, playerCount) {
        const count = Number(playerCount);
        if (!Number.isInteger(count) || count <= 0) return -1;
        const current = Number.isInteger(currentIndex) ? currentIndex : 0;
        return ((current % count) + count + 1) % count;
    }

    function scoreLoss(players, loserId) {
        if (!Array.isArray(players)) return null;
        const loserExists = players.some(player => player?.id === loserId);
        if (!loserExists) return null;

        return {
            loserId,
            players: players.map(player => {
                const isLoser = player.id === loserId;
                return {
                    ...player,
                    score: (Number(player.score) || 0) + (isLoser ? 0 : 1),
                    losses: (Number(player.losses) || 0) + (isLoser ? 1 : 0)
                };
            })
        };
    }

    const api = {
        FUSE_PRESETS,
        randomBetween,
        pickRandomIndex,
        choosePrompt,
        chooseStartingPlayerIndex,
        getFuseDurationMs,
        nextPlayerIndex,
        scoreLoss
    };

    root.TickingBombRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
