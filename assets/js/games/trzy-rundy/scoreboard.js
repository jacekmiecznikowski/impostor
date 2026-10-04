function renderTrzyRundyScoreboardModal() {
    const list = document.getElementById('scoreboard-list');
    const title = document.getElementById('score-modal-title');
    if (!list) return;
    if (title) title.textContent = 'Wyniki • Trzy Rundy';
    list.replaceChildren();
    const teams = TrzyRundyRules.assignTeams(trzyRundyState.players);
    teams.forEach((team, index) => {
        const row = document.createElement('div');
        row.className = 'tr-score-row';
        const copy = document.createElement('span');
        copy.className = 'tr-score-copy';
        const name = document.createElement('strong');
        name.textContent = `Drużyna ${index === 0 ? 'A' : 'B'}`;
        const members = document.createElement('small');
        members.textContent = team.map(player => player.name).join(' • ') || 'Brak graczy';
        copy.append(name, members);
        const score = document.createElement('span');
        score.className = 'tr-score-points';
        score.textContent = `${trzyRundyState.teamScores[index] || 0} pkt`;
        row.append(copy, score);
        list.appendChild(row);
    });
}

function resetTrzyRundyScores() {
    trzyRundyState.teamScores = [0, 0];
    persistTrzyRundySession();
    renderTrzyRundyScoreboardModal();
    showToast('Zresetowano', 'Punkty Trzech Rund zostały wyzerowane.');
}
