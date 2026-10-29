async function initializeImpostorRemoteContent() {
    const repository = window.PartyjniakContent?.repository;
    if (!repository) return false;
    if (!repository.partyjniakMultiHints) {
        const validate = repository.validate.bind(repository);
        repository.validate = (source, game, locale) => {
            const result = validate(source, game, locale);
            if (game === 'impostor' && Array.isArray(source?.categories)) {
                result.categories.forEach((category, index) => {
                    const entries = source.categories[index]?.words || [];
                    category.words.forEach((entry, entryIndex) => {
                        const hints = entries[entryIndex]?.hints;
                        entry.hints = Array.isArray(hints) && hints.length
                            ? hints.filter(value => typeof value === 'string' && value.trim()).slice(0, 8)
                            : [entry.hint].filter(Boolean);
                    });
                });
            }
            return result;
        };
        repository.partyjniakMultiHints = true;
    }

    const payload = await repository.loadRemote('impostor', 'pl');
    if (!payload) return false;

    const nextWordDatabase = {};
    const nextCategoryNames = {};

    payload.categories.forEach(category => {
        nextCategoryNames[category.id] = {
            name: category.name,
            icon: category.icon,
            desc: category.desc
        };
        nextWordDatabase[category.id] = category.words.map(entry => ({
            word: entry.word,
            hint: entry.hint || entry.hints?.[0] || 'Brak podpowiedzi',
            hints: entry.hints || [entry.hint || 'Brak podpowiedzi']
        }));
    });

    Object.keys(WORD_DATABASE).forEach(key => delete WORD_DATABASE[key]);
    Object.assign(WORD_DATABASE, nextWordDatabase);
    Object.keys(CATEGORY_NAMES).forEach(key => delete CATEGORY_NAMES[key]);
    Object.assign(CATEGORY_NAMES, nextCategoryNames);

    if (payload.discussionTips.length > 0) {
        DISCUSSION_TIPS.splice(0, DISCUSSION_TIPS.length, ...payload.discussionTips);
    }

    if (typeof normalizeActiveCategories === 'function') normalizeActiveCategories();
    return true;
}
