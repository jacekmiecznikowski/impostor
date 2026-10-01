function renderBombScoreboardModal() {
    const listEl = document.getElementById('scoreboard-list');
    const title = document.getElementById('score-modal-title');
    if (!listEl) return;
    if (title) title.textContent = 'Wyniki • Tykająca Bomba';
    listEl.replaceChildren();

    if (!bombState.players.length) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-slate-500 text-center py-4';
        empty.textContent = 'Brak zapisanych graczy w Tykającej Bombie.';
        listEl.appendChild(empty);
        return;
    }

    const sorted = [...bombState.players].sort((a, b) => b.score - a.score || a.losses - b.losses || a.name.localeCompare(b.name, 'pl'));
    sorted.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'bomb-score-row';
        const position = document.createElement('span');
        position.className = 'bomb-score-position';
        position.textContent = String(index + 1);
        const copy = document.createElement('span');
        copy.className = 'bomb-score-copy';
        const name = document.createElement('strong');
        name.textContent = player.name;
        const losses = document.createElement('small');
        losses.textContent = `${player.losses} ${player.losses === 1 ? 'wybuch' : 'wybuchów'}`;
        copy.append(name, losses);
        const score = document.createElement('span');
        score.className = 'bomb-score-points';
        score.textContent = `${player.score} pkt`;
        item.append(position, copy, score);
        listEl.appendChild(item);
    });
}

function resetBombScores() {
    bombState.players.forEach(player => {
        player.score = 0;
        player.losses = 0;
    });
    persistBombSession();
    renderBombScoreboardModal();
    showToast('Zresetowano', 'Punkty Tykającej Bomby zostały wyzerowane.');
}
