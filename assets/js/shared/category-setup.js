/* Shared search and selection summary for the Partyjniak category menus.
   Categories are rendered by each game; this helper never changes selections. */
function syncPartyCategoryGrid(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const input = document.getElementById(`${gridId}-search`);
    const summary = document.getElementById(`${gridId}-summary`);
    const normalize = value => String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pl-PL').trim();
    const query = normalize(input?.value);
    const cards = [...grid.querySelectorAll('.party-category-card')];
    let visible = 0;
    let selected = 0;
    cards.forEach(card => {
        const matches = !query || normalize(card.textContent).includes(query);
        card.hidden = !matches;
        if (matches) visible += 1;
        if (card.classList.contains('is-selected')) selected += 1;
    });
    if (summary) {
        const selection = `${selected} z ${cards.length} zaznaczonych · min. 1`;
        summary.textContent = visible === 0 ? `Brak pasujących kategorii · ${selection}` : selection;
    }
}
