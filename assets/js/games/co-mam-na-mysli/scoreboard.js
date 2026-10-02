function renderCoMamNaMysliScoreboardModal() {
    const list = document.getElementById('scoreboard-list');
    const title = document.getElementById('score-modal-title');
    if (!list) return;
    if (title) title.textContent = 'Wyniki • Co mam na myśli?';
    list.replaceChildren();

    if (!coMamNaMysliState.players.length) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-slate-500 text-center py-4';
        empty.textContent = 'Brak zapisanych graczy.';
        list.appendChild(empty);
        return;
    }

    const sorted = [...coMamNaMysliState.players].sort((a, b) => b.score - a.score || a.turns - b.turns || a.name.localeCompare(b.name, 'pl'));
    sorted.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'cmm-score-row';

        const position = document.createElement('span');
        position.className = 'cmm-score-position';
        position.textContent = String(index + 1);

        const copy = document.createElement('span');
        copy.className = 'cmm-score-copy';
        const name = document.createElement('strong');
        name.textContent = player.name;
        const turns = document.createElement('small');
        turns.textContent = `${player.turns} ${player.turns === 1 ? 'tura' : 'tur'}`;
        copy.append(name, turns);

        const score = document.createElement('span');
        score.className = 'cmm-score-points';
        score.textContent = `${player.score} pkt`;
        row.append(position, copy, score);
        list.appendChild(row);
    });
}

function resetCoMamNaMysliScores() {
    coMamNaMysliState.players.forEach(player => {
        player.score = 0;
        player.turns = 0;
    });
    coMamNaMysliState.roundNumber = 0;
    persistCoMamNaMysliSession();
    renderCoMamNaMysliScoreboardModal();
    showToast('Zresetowano', 'Punkty Co mam na myśli? zostały wyzerowane.');
}
