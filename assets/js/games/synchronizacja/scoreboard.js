function renderSynchronizacjaScoreboardModal() {
    const list = document.getElementById('scoreboard-list');
    const title = document.getElementById('score-modal-title');
    if (!list) return;
    if (title) title.textContent = 'Wyniki • Synchronizacja';
    list.replaceChildren();

    if (!synchronizacjaState.players.length) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-slate-500 text-center py-4';
        empty.textContent = 'Brak zapisanych graczy w Synchronizacji.';
        list.appendChild(empty);
        return;
    }

    const sorted = SynchronizacjaRules.sortStandings(synchronizacjaState.players);
    sorted.forEach((player, index) => {
        const row = document.createElement('div');
        row.className = 'sync-ranking-row';
        const position = document.createElement('span');
        position.className = 'sync-ranking-position';
        position.textContent = String(index + 1);
        const copy = document.createElement('span');
        copy.className = 'sync-ranking-copy';
        const name = document.createElement('strong');
        name.textContent = player.name;
        const turns = document.createElement('small');
        turns.textContent = `${player.turns || 0} ${(player.turns || 0) === 1 ? 'tura' : 'tur'}`;
        copy.append(name, turns);
        const score = document.createElement('span');
        score.className = 'sync-ranking-score';
        score.textContent = `${player.score || 0} pkt`;
        row.append(position, copy, score);
        list.appendChild(row);
    });
}

function resetSynchronizacjaScores() {
    resetSynchronizacjaMatchScores();
    persistSynchronizacjaSession();
    renderSynchronizacjaScoreboardModal();
    showToast('Zresetowano', 'Punkty Synchronizacji zostały wyzerowane.');
}
