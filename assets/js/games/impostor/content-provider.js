async function initializeImpostorRemoteContent() {
    const repository = window.PartyjniakContent?.repository;
    if (!repository) return false;

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
            hint: entry.hint || 'Brak podpowiedzi'
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
