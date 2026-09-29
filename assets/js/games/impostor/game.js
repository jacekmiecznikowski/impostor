function setupDiscussionTimer() {
    const box = document.getElementById('timer-display-box');
    if (state.discussionTime === 0) {
        box.classList.add('hidden');
        return;
    }
    box.classList.remove('hidden');
    let timeLeft = state.discussionTime;
    const countdownEl = document.getElementById('timer-countdown');

    function updateDisplay() {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        countdownEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            playSound('alarm');
            showToast('Budzik!', 'Czas na dyskusję dobiegł końca!', 'fa-solid fa-bell');
        }
    }, 1000);
}

function startGameRound() {
    if (state.players.length < 3) {
        showToast('Gracze', 'Dodaj co najmniej 3 graczy przed rozpoczęciem rundy.');
        return;
    }
    if (state.activeCategories.length === 0) {
        showToast('Kategorie', 'Wybierz przynajmniej jedną kategorię.');
        return;
    }
    if (state.impostorCount >= state.players.length) {
        showToast('Impostorzy', 'Liczba impostorów nie może być równa lub większa niż liczba graczy.');
        return;
    }

    const catKey = state.activeCategories[Math.floor(Math.random() * state.activeCategories.length)];
    const wordsList = WORD_DATABASE[catKey];
    const wordObj = wordsList[Math.floor(Math.random() * wordsList.length)];
    state.secretWord = wordObj.word;
    state.secretHint = wordObj.hint;

    const shuffledPlayers = shuffleArray(state.players);
    state.impostorIds = shuffledPlayers.slice(0, state.impostorCount).map(p => p.id);

    state.playerRoles = {};
    state.players.forEach(player => {
        const isImpostor = state.impostorIds.includes(player.id);
        let giveHint = false;
        if (state.hintMode === 'always') giveHint = true;
        else if (state.hintMode === 'random') giveHint = Math.random() < 0.5;

        state.playerRoles[player.id] = {
            isImpostor,
            word: isImpostor ? (giveHint ? state.secretHint : 'Brak podpowiedzi') : state.secretWord
        };
    });

    state.currentTurnPlayerIndex = 0;
    state.selectedVotedPlayerId = null;
    playSound('success');
    showPassPhoneScreen();
}

function startNextRound() {
    startGameRound();
}

function showPassPhoneScreen() {
    const player = state.players[state.currentTurnPlayerIndex];
    if (!player) {
        showToast('Błąd rundy', 'Nie udało się wskazać kolejnego gracza.');
        goToScreen('menu');
        return;
    }
    document.getElementById('pass-player-name').innerText = player.name;
    goToScreen('pass');
}

function showSecretReveal() {
    playSound('reveal');
    const player = state.players[state.currentTurnPlayerIndex];
    const role = state.playerRoles[player.id];
    if (!role) {
        showToast('Błąd rundy', 'Nie znaleziono roli gracza. Rozpocznij rundę ponownie.');
        goToScreen('setup-options');
        return;
    }

    document.getElementById('reveal-player-title').innerText = `Rola dla: ${player.name}`;
    const cardInner = document.getElementById('secret-card-inner');
    cardInner.style.transform = 'rotateY(0deg)';

    const badge = document.getElementById('secret-badge');
    const wordDisplay = document.getElementById('secret-word-display');
    const labelType = document.getElementById('secret-label-type');
    const desc = document.getElementById('secret-desc');
    const finishBtn = document.getElementById('finish-reveal-btn');

    finishBtn.disabled = true;
    finishBtn.className = 'w-full max-w-xs bg-slate-900 text-slate-500 font-bold py-3.5 px-6 rounded-2xl cursor-not-allowed border border-slate-800';

    if (role.isImpostor) {
        badge.className = 'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30';
        badge.innerText = 'Jesteś Impostorem! 😈';
        if (role.word !== 'Brak podpowiedzi') {
            labelType.innerText = 'Podpowiedź do słowa';
            wordDisplay.innerText = role.word;
            desc.innerText = 'Nie znasz głównego hasła. Słuchaj innych i wtop się w tłum!';
        } else {
            labelType.innerText = 'Tajne słowo';
            wordDisplay.innerText = 'BRAK';
            desc.innerText = 'Nie masz żadnej podpowiedzi. Powodzenia!';
        }
    } else {
        badge.className = 'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30';
        badge.innerText = 'Zwykły gracz 👤';
        labelType.innerText = 'Tajne słowo';
        wordDisplay.innerText = role.word;
        desc.innerText = 'Znajdź impostora, który nie zna tego hasła!';
    }

    goToScreen('reveal');
}

function revealSecret(reveal) {
    const cardInner = document.getElementById('secret-card-inner');
    const finishBtn = document.getElementById('finish-reveal-btn');

    if (reveal) {
        cardInner.style.transform = 'rotateY(180deg)';
        playSound('click');
        clearTimeout(revealUnlockTimer);
        revealUnlockTimer = setTimeout(() => {
            finishBtn.disabled = false;
            finishBtn.className = 'w-full max-w-xs bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xl border border-teal-400/30';
            revealUnlockTimer = null;
        }, 300);
    } else {
        cardInner.style.transform = 'rotateY(0deg)';
        if (revealUnlockTimer) {
            clearTimeout(revealUnlockTimer);
            revealUnlockTimer = null;
        }
    }
}

function nextPlayerTurn() {
    playSound('click');
    state.currentTurnPlayerIndex++;
    if (state.currentTurnPlayerIndex < state.players.length) showPassPhoneScreen();
    else goToScreen('discussion');
}

function goToGroupVotingScreen() {
    state.selectedVotedPlayerId = null;
    const confirmBtn = document.getElementById('confirm-group-vote-btn');
    confirmBtn.disabled = true;
    confirmBtn.className = 'w-full bg-slate-900 text-slate-500 font-bold py-4 px-6 rounded-2xl cursor-not-allowed border border-slate-800';
    goToScreen('group-voting');
}

function renderGroupVotingScreen() {
    const grid = document.getElementById('group-voting-players-grid');
    grid.innerHTML = '';

    state.players.forEach(player => {
        const isSelected = state.selectedVotedPlayerId === player.id;
        const card = document.createElement('button');
        card.type = 'button';
        card.onclick = () => selectGroupVoteTarget(player.id);
        card.className = `w-full text-left p-4 rounded-2xl border flex items-center space-x-3 cursor-pointer transition-all ${isSelected ? 'bg-teal-950/50 border-teal-500 shadow-lg shadow-teal-500/20' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`;
        card.innerHTML = `
            <div class="w-12 h-12 rounded-xl ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300'} flex items-center justify-center font-bold text-lg shadow">${escapeHtml(player.name.charAt(0).toUpperCase())}</div>
            <div class="flex-1"><h4 class="font-bold text-white text-base">${escapeHtml(player.name)}</h4><span class="text-xs ${isSelected ? 'text-teal-300' : 'text-slate-500'}">${isSelected ? 'Wskazany przez większość' : 'Dotknij, aby wybrać'}</span></div>
            <div class="w-6 h-6 rounded-full border ${isSelected ? 'border-teal-500 bg-teal-500 text-slate-950' : 'border-slate-700'} flex items-center justify-center text-xs">${isSelected ? '<i class="fa-solid fa-check"></i>' : ''}</div>`;
        grid.appendChild(card);
    });
}

function selectGroupVoteTarget(id) {
    playSound('click');
    state.selectedVotedPlayerId = id;
    renderGroupVotingScreen();

    const confirmBtn = document.getElementById('confirm-group-vote-btn');
    confirmBtn.disabled = false;
    confirmBtn.className = 'w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl border border-teal-400/30';
}

function submitGroupVote() {
    if (!state.selectedVotedPlayerId) return;
    playSound('success');

    const votedPlayer = state.players.find(player => player.id === state.selectedVotedPlayerId);
    const isImpostorVoted = state.impostorIds.includes(state.selectedVotedPlayerId);

    if (isImpostorVoted) {
        state.players.forEach(player => {
            if (!state.impostorIds.includes(player.id)) player.score += 2;
        });
    } else {
        state.players.forEach(player => {
            if (state.impostorIds.includes(player.id)) player.score += 5;
        });
    }

    persistSession();
    goToScreen('results');
    renderResultsScreen(isImpostorVoted, votedPlayer);
}

function renderResultsScreen(isImpostorVoted, votedPlayer) {
    const iconContainer = document.getElementById('result-icon-container');
    const icon = document.getElementById('result-icon');
    const badge = document.getElementById('result-badge');
    const title = document.getElementById('result-title');
    const subtitle = document.getElementById('result-subtitle');
    const wordEl = document.getElementById('result-secret-word');
    const majoritySummaryEl = document.getElementById('majority-vote-summary');
    const impostorsListEl = document.getElementById('result-impostors-list');

    wordEl.textContent = state.secretWord;

    const strong = document.createElement('strong');
    strong.textContent = votedPlayer?.name || 'Nikt';
    majoritySummaryEl.replaceChildren(
        document.createTextNode('Większość grupy wskazała gracza: '),
        strong,
        document.createTextNode('.')
    );

    if (isImpostorVoted) {
        iconContainer.className = 'w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-2xl';
        icon.className = 'fa-solid fa-trophy text-4xl';
        badge.className = 'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
        badge.innerText = 'Zwycięstwo detektywów!';
        title.innerText = 'Złapaliście Impostora!';
        subtitle.textContent = 'Wskazana osoba była impostorem. +2 pkt dla zwykłych graczy.';
    } else {
        iconContainer.className = 'w-24 h-24 rounded-3xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center shadow-2xl';
        icon.className = 'fa-solid fa-user-secret text-4xl';
        badge.className = 'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30';
        badge.innerText = 'Zwycięstwo impostora!';
        title.innerText = 'Impostor przechytrzył grupę!';
        subtitle.textContent = 'Wskazano niewinną osobę. Każdy impostor dostaje +5 pkt.';
    }

    impostorsListEl.innerHTML = '';
    state.impostorIds.forEach(impostorId => {
        const impostor = state.players.find(player => player.id === impostorId);
        if (!impostor) return;
        const tag = document.createElement('span');
        tag.className = 'px-3 py-1 rounded-xl bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5';
        const tagIcon = document.createElement('i');
        tagIcon.className = 'fa-solid fa-user-secret';
        const name = document.createElement('span');
        name.textContent = impostor.name;
        tag.append(tagIcon, name);
        impostorsListEl.appendChild(tag);
    });
}
