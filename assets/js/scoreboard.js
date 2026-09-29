function renderScoreboardModal() {
    const listEl = document.getElementById('scoreboard-list');
    listEl.replaceChildren();

    if (state.players.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-slate-500 text-center py-4';
        empty.textContent = 'Brak aktywnych graczy w tej sesji.';
        listEl.appendChild(empty);
        return;
    }

    const sorted = [...state.players].sort((a, b) => b.score - a.score);

    sorted.forEach((player, idx) => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner';

        const left = document.createElement('div');
        left.className = 'flex items-center space-x-3';

        const position = document.createElement('span');
        position.className = `w-7 h-7 rounded-full ${idx === 0 ? 'bg-amber-500 text-slate-950' : (idx === 1 ? 'bg-slate-300 text-slate-950' : (idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'))} flex items-center justify-center font-black text-xs`;
        position.textContent = String(idx + 1);

        const name = document.createElement('span');
        name.className = 'font-bold text-white text-sm';
        name.textContent = player.name;

        const score = document.createElement('span');
        score.className = 'font-extrabold text-teal-400 text-sm bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/20';
        score.textContent = `${player.score} pkt`;

        left.append(position, name);
        item.append(left, score);
        listEl.appendChild(item);
    });
}

function resetScores() {
    state.players.forEach(player => { player.score = 0; });
    persistSession();
    playSound('click');
    renderScoreboardModal();
    showToast('Zresetowano', 'Punkty sesji wszystkich graczy zostały wyzerowane.');
}
