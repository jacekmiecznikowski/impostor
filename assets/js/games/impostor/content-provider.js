async function initializeImpostorRemoteContent() {
    if (!window.PartyjniakContent?.repository) return false;
    const payload = await window.PartyjniakContent.repository.loadRemote('impostor', 'pl');
    if (!payload) return false;

    Object.keys(WORD_DATABASE).forEach(key => delete WORD_DATABASE[key]);
    Object.keys(CATEGORY_NAMES).forEach(key => delete CATEGORY_NAMES[key]);
    DISCUSSION_TIPS.splice(0, DISCUSSION_TIPS.length);

    payload.categories.forEach(category => {
        CATEGORY_NAMES[category.id] = {
            name: category.name,
            icon: category.icon || 'fa-layer-group',
            desc: category.desc || ''
        };
        WORD_DATABASE[category.id] = category.words.map(entry => ({
            word: entry.word,
            hint: entry.hint || 'Brak podpowiedzi'
        }));
    });

    if (Array.isArray(payload.discussionTips)) DISCUSSION_TIPS.push(...payload.discussionTips);
    return true;
}
