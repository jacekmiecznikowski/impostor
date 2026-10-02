function renderNaokoloScoreboardModal() {
    const list = document.getElementById('scoreboard-list');
    const title = document.getElementById('score-modal-title');
    if (!list) return;
    if (title) title.textContent = 'Wyniki • Naokoło';
    list.replaceChildren();

    if (!naokoloState.players.length) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-slate-500 text-center py-4';
        empty.textContent = 'Brak zapisanych graczy w Naokoło.';
        list.appendChild(empty);
        return;
    }

    const sorted = [...naokoloState.players].sort((a, b) => b.score - a.score || b.turns - a.turns || a.name.localeCompare(b.name, 'pl'));
    sorted.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'naokolo-score-row';

        const position = document.createElement('span');
        position.className = 'naokolo-score-position';
        position.textContent = String(index + 1);

        const copy = document.createElement('span');
        copy.className = 'naokolo-score-copy';
        const name = document.createElement('strong');
        name.textContent = player.name;
        const turns = document.createElement('small');
        turns.textContent = `${player.turns || 0} ${(player.turns || 0) === 1 ? 'tura' : 'tur'}`;
        copy.append(name, turns);

        const score = document.createElement('span');
        score.className = 'naokolo-score-points';
        score.textContent = `${player.score || 0} pkt`;
        row.append(position, copy, score);
        list.appendChild(row);
    });
}

function resetNaokoloScores() {
    naokoloState.players.forEach(player => {
        player.score = 0;
        player.turns = 0;
    });
    persistNaokoloSession();
    renderNaokoloScoreboardModal();
    showToast('Zresetowano', 'Punkty Naokoło zostały wyzerowane.');
}
