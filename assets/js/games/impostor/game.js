function setupDiscussionTimer() {
    const box = document.getElementById('timer-display-box');
    if (!box) return;

    if (state.discussionTime === 0) {
        box.classList.add('hidden');
        return;
    }

    box.classList.remove('hidden');
    let timeLeft = state.discussionTime;
    const countdownEl = document.getElementById('timer-countdown');

    const updateDisplay = () => {
        if (!countdownEl) return;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        countdownEl.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    updateDisplay();
    timerInterval = setInterval(() => {
        timeLeft = Math.max(0, timeLeft - 1);
        updateDisplay();
        if (timeLeft === 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            playSound('alarm');
            showToast('Czas minął', 'Czas na dyskusję dobiegł końca.', 'fa-solid fa-bell');
        }
    }, 1000);
}

function getRoundWord() {
    normalizeActiveCategories();
    const available = state.activeCategories
        .map(key => ({ key, words: WORD_DATABASE[key] }))
        .filter(entry => Array.isArray(entry.words) && entry.words.length > 0);

    if (available.length === 0) return null;
    const category = available[Math.floor(Math.random() * available.length)];
    const word = category.words[Math.floor(Math.random() * category.words.length)];
    return word?.word ? { categoryKey: category.key, word: word.word, hint: word.hint || 'Brak podpowiedzi' } : null;
}

function startGameRound() {
    if (state.players.length < 3) {
        showToast('Gracze', 'Dodaj co najmniej 3 graczy przed rozpoczęciem rundy.');
        return;
    }
    if (state.impostorCount >= state.players.length) {
        showToast('Impostorzy', 'Liczba impostorów nie może być równa lub większa niż liczba graczy.');
        return;
    }

    const roundWord = getRoundWord();
    if (!roundWord) {
        showToast('Kategorie', 'Nie znaleziono żadnych dostępnych haseł. Wybierz inną kategorię lub sprawdź źródło treści.');
        return;
    }

    state.secretWord = roundWord.word;
    state.secretHint = roundWord.hint;

    try {
        const assignment = ImpostorRules.assignRoles(
            state.players,
            state.impostorCount,
            state.hintMode,
            state.secretWord,
            state.secretHint
        );
        state.impostorIds = assignment.impostorIds;
        state.playerRoles = assignment.roles;
    } catch (error) {
        console.error('Nie udało się utworzyć rundy:', error);
        showToast('Błąd rundy', 'Nie udało się przygotować ról graczy. Sprawdź ustawienia i spróbuj ponownie.');
        return;
    }

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
    const name = document.getElementById('pass-player-name');
    if (name) name.innerText = player.name;
    goToScreen('pass');
}

function showSecretReveal() {
    playSound('reveal');
    const player = state.players[state.currentTurnPlayerIndex];
    const role = player ? state.playerRoles[player.id] : null;
    if (!player || !role) {
        showToast('Błąd rundy', 'Nie znaleziono roli gracza. Rozpocznij rundę ponownie.');
        goToScreen('setup-options');
        return;
    }

    const title = document.getElementById('reveal-player-title');
    if (title) title.innerText = `Rola dla: ${player.name}`;

    const badge = document.getElementById('secret-badge');
    const wordDisplay = document.getElementById('secret-word-display');
    const labelType = document.getElementById('secret-label-type');
    const desc = document.getElementById('secret-desc');
    const finishBtn = document.getElementById('finish-reveal-btn');
    if (finishBtn) finishBtn.disabled = true;

    if (role.isImpostor) {
        if (badge) badge.hidden = true;
        if (role.word !== 'Brak podpowiedzi') {
            if (labelType) labelType.innerText = 'PODPOWIEDŹ';
            if (wordDisplay) wordDisplay.innerText = role.word;
            if (desc) desc.innerText = 'Słuchaj innych i blefuj.';
        } else {
            if (labelType) labelType.innerText = 'BRAK PODPOWIEDZI';
            if (wordDisplay) wordDisplay.innerText = 'BRAK';
            if (desc) desc.innerText = 'Nie masz wskazówki. Słuchaj innych i blefuj.';
        }
    } else {
        if (badge) badge.hidden = true;
        if (labelType) labelType.innerText = 'HASŁO';
        if (wordDisplay) wordDisplay.innerText = role.word;
        if (desc) desc.innerText = 'Znajdź impostora.';
    }

    resetRevealCardPresentation?.();
    syncRevealRolePresentation?.();
    goToScreen('reveal');
}

function revealSecret(reveal) {
    const finishBtn = document.getElementById('finish-reveal-btn');
    if (!finishBtn) return;

    if (reveal) {
        playSound('click');
        clearTimeout(revealUnlockTimer);
        revealUnlockTimer = setTimeout(() => {
            finishBtn.disabled = false;
            revealUnlockTimer = null;
        }, 300);
    } else if (revealUnlockTimer) {
        clearTimeout(revealUnlockTimer);
        revealUnlockTimer = null;
    }
}

function nextPlayerTurn() {
    playSound('click');
    state.currentTurnPlayerIndex += 1;
    if (state.currentTurnPlayerIndex < state.players.length) showPassPhoneScreen();
    else goToScreen('discussion');
}

function goToGroupVotingScreen() {
    state.selectedVotedPlayerId = null;
    const confirmBtn = document.getElementById('confirm-group-vote-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    goToScreen('group-voting');
}

function selectGroupVoteTarget(id) {
    if (!state.players.some(player => player.id === id)) return;
    playSound('click');
    state.selectedVotedPlayerId = id;
    renderGroupVotingScreen();

    const confirmBtn = document.getElementById('confirm-group-vote-btn');
    if (confirmBtn) confirmBtn.disabled = false;
}

function submitGroupVote() {
    if (!state.selectedVotedPlayerId) return;
    const votedPlayer = state.players.find(player => player.id === state.selectedVotedPlayerId);
    if (!votedPlayer) return;

    playSound('success');
    const caughtImpostor = ImpostorRules.scoreVote(state.players, state.impostorIds, state.selectedVotedPlayerId);
    persistSession();
    goToScreen('results');
    renderResultsScreen(caughtImpostor, votedPlayer);
}

function renderResultsScreen(caughtImpostor, votedPlayer) {
    const iconContainer = document.getElementById('result-icon-container');
    const icon = document.getElementById('result-icon');
    const badge = document.getElementById('result-badge');
    const title = document.getElementById('result-title');
    const subtitle = document.getElementById('result-subtitle');
    const wordEl = document.getElementById('result-secret-word');
    const majoritySummaryEl = document.getElementById('majority-vote-summary');
    const impostorsListEl = document.getElementById('result-impostors-list');

    if (wordEl) wordEl.textContent = state.secretWord;

    if (majoritySummaryEl) {
        const strong = document.createElement('strong');
        strong.textContent = votedPlayer.name;
        majoritySummaryEl.replaceChildren(
            document.createTextNode('Większość grupy wskazała gracza: '),
            strong,
            document.createTextNode('.')
        );
    }

    if (caughtImpostor) {
        if (iconContainer) iconContainer.className = 'w-24 h-24 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center shadow-2xl';
        if (icon) icon.className = 'fa-solid fa-trophy text-4xl';
        if (badge) {
            badge.className = 'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            badge.innerText = 'Trafienie!';
        }
        if (title) title.innerText = 'Złapaliście Impostora!';
        if (subtitle) subtitle.textContent = 'Wskazana osoba była impostorem. Zwykli gracze dostają +2 pkt.';
    } else {
        if (iconContainer) iconContainer.className = 'w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-2xl';
        if (icon) icon.className = 'fa-solid fa-user-secret text-4xl';
        if (badge) {
            badge.className = 'px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-violet-500/20 text-violet-200 border border-violet-500/30';
            badge.innerText = 'Impostor uniknął głosu';
        }
        if (title) title.innerText = 'Impostor przechytrzył grupę';
        if (subtitle) subtitle.textContent = 'Wskazano niewinną osobę. Każdy impostor dostaje +5 pkt.';
    }

    if (impostorsListEl) {
        impostorsListEl.replaceChildren();
        state.impostorIds.forEach(impostorId => {
            const impostor = state.players.find(player => player.id === impostorId);
            if (!impostor) return;
            const tag = document.createElement('span');
            tag.className = 'px-3 py-1 rounded-xl bg-violet-950/60 border border-violet-500/30 text-violet-200 text-xs font-bold flex items-center gap-1.5';
            const tagIcon = document.createElement('i');
            tagIcon.className = 'fa-solid fa-user-secret';
            const name = document.createElement('span');
            name.textContent = impostor.name;
            tag.append(tagIcon, name);
            impostorsListEl.appendChild(tag);
        });
    }
}
