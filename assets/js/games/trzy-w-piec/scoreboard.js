function renderThreeFiveScoreboardModal() {
    const list = document.getElementById('scoreboard-list');
    const title = document.getElementById('score-modal-title');
    if (!list) return;
    if (title) title.textContent = 'Wyniki • Trzy w Pięć';
    list.replaceChildren();

    if (!threeFiveState.players.length) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-slate-500 text-center py-4';
        empty.textContent = 'Brak zapisanych graczy w Trzy w Pięć.';
        list.appendChild(empty);
        return;
    }

    const sorted = [...threeFiveState.players].sort((a, b) => b.score - a.score || a.turns - b.turns || a.name.localeCompare(b.name, 'pl'));
    sorted.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'three-five-score-row';

        const position = document.createElement('span');
        position.className = 'three-five-score-position';
        position.textContent = String(index + 1);

        const copy = document.createElement('span');
        copy.className = 'three-five-score-copy';
        const name = document.createElement('strong');
        name.textContent = player.name;
        const turns = document.createElement('small');
        turns.textContent = `${player.turns || 0} ${(player.turns || 0) === 1 ? 'tura' : 'tur'}`;
        copy.append(name, turns);

        const score = document.createElement('span');
        score.className = 'three-five-score-points';
        score.textContent = `${player.score || 0} pkt`;
        row.append(position, copy, score);
        list.appendChild(row);
    });
}

function resetThreeFiveScores() {
    threeFiveState.players.forEach(player => {
        player.score = 0;
        player.turns = 0;
    });
    threeFiveState.currentPlayerIndex = 0;
    threeFiveState.turnNumber = 0;
    persistThreeFiveSession();
    renderThreeFiveScoreboardModal();
    showToast('Zresetowano', 'Punkty Trzy w Pięć zostały wyzerowane.');
}
