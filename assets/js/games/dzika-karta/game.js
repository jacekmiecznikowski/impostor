const dzikaKartaRuntime = {
    shuffledSubmissions: [],
    lastWinnerId: null,
    lastWinningAnswerId: null
};

function getDzikaPrompt(id = dzikaKartaState.currentPromptId) {
    return DZIKA_KARTA_PROMPTS.find(prompt => prompt.id === id) || null;
}

function getDzikaAnswer(id) {
    return DZIKA_KARTA_ANSWERS.find(answer => answer.id === id) || null;
}

function getDzikaJudge() {
    return dzikaKartaState.players[dzikaKartaState.judgeIndex] || null;
}

function getDzikaSubmitterIndexes() {
    return DzikaKartaRules.getSubmitterIndexes(
        dzikaKartaState.players.length,
        dzikaKartaState.judgeIndex
    );
}

function getDzikaCurrentSubmitter() {
    const indexes = getDzikaSubmitterIndexes();
    return dzikaKartaState.players[indexes[dzikaKartaState.submissionCursor]] || null;
}

function drawDzikaPrompt() {
    if (!dzikaKartaState.promptDeckIds.length) {
        dzikaKartaState.promptDeckIds = DzikaKartaRules.shuffle(DZIKA_KARTA_PROMPTS.map(prompt => prompt.id));
    }
    const id = dzikaKartaState.promptDeckIds.shift();
    dzikaKartaState.currentPromptId = id || null;
    return getDzikaPrompt(id);
}

function fillDzikaPlayerHand(player) {
    if (!player) return;
    const filled = DzikaKartaRules.refillHand(
        player.handIds,
        dzikaKartaState.answerDeckIds,
        dzikaKartaState.discardIds,
        DZIKA_KARTA_ANSWERS.map(answer => answer.id)
    );
    player.handIds = filled.handIds;
    dzikaKartaState.answerDeckIds = filled.deckIds;
    dzikaKartaState.discardIds = filled.discardIds;
}

function prepareDzikaKartaJudgeTurn() {
    if (dzikaKartaState.gameFinished) return goToScreen('dk-final');
    if (dzikaKartaState.awaitingRoundDecision) return goToScreen('dk-round-summary');

    if (!dzikaKartaState.currentPromptId) {
        drawDzikaPrompt();
        dzikaKartaState.submissions = [];
        dzikaKartaState.submissionCursor = 0;
    }

    persistDzikaKartaSession();
    renderDzikaKartaJudge();
    goToScreen('dk-judge');
}

function renderDzikaPromptText(elementId) {
    const prompt = getDzikaPrompt();
    const element = document.getElementById(elementId);
    if (element) element.textContent = prompt?.text || 'Pytanie';
}

function renderDzikaKartaJudge() {
    const judge = document.getElementById('dk-judge-name');
    if (judge) judge.textContent = getDzikaJudge()?.name || 'Sędzia';

    renderDzikaPromptText('dk-judge-prompt');
    const progress = document.getElementById('dk-judge-progress');
    if (progress) {
        progress.textContent = `Runda ${dzikaKartaState.completedRounds + 1} • sędzia ${dzikaKartaState.judgeIndex + 1}/${dzikaKartaState.players.length}`;
    }
}

function beginDzikaKartaSubmissions() {
    dzikaKartaState.submissionCursor = Math.min(
        dzikaKartaState.submissionCursor,
        getDzikaSubmitterIndexes().length - 1
    );
    persistDzikaKartaSession();
    renderDzikaKartaPass();
    goToScreen('dk-pass');
}

function renderDzikaKartaPass() {
    const player = getDzikaCurrentSubmitter();
    const name = document.getElementById('dk-pass-player');
    if (name) name.textContent = player?.name || 'Gracz';

    const count = document.getElementById('dk-pass-progress');
    if (count) {
        count.textContent = `Odpowiedź ${dzikaKartaState.submissionCursor + 1} z ${getDzikaSubmitterIndexes().length}`;
    }
}

function revealDzikaKartaHand() {
    renderDzikaKartaChoice();
    goToScreen('dk-choose');
}

function renderDzikaKartaChoice() {
    const player = getDzikaCurrentSubmitter();
    renderDzikaPromptText('dk-choice-prompt');

    const name = document.getElementById('dk-choice-player');
    if (name) name.textContent = player?.name || 'Gracz';

    const hand = document.getElementById('dk-hand');
    if (!hand) return;
    hand.replaceChildren();

    (player?.handIds || []).forEach(answerId => {
        const answer = getDzikaAnswer(answerId);
        if (!answer) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dk-answer-card';
        const text = document.createElement('span');
        text.textContent = answer.text;
        button.appendChild(text);
        button.onclick = () => submitDzikaKartaAnswer(answerId);
        hand.appendChild(button);
    });
}

function submitDzikaKartaAnswer(answerId) {
    const player = getDzikaCurrentSubmitter();
    if (!player || !player.handIds.includes(answerId)) return;

    dzikaKartaState.submissions.push({ playerId: player.id, answerId });
    player.handIds = player.handIds.filter(id => id !== answerId);
    dzikaKartaState.discardIds.push(answerId);
    fillDzikaPlayerHand(player);
    dzikaKartaState.submissionCursor += 1;
    playSound?.('success');
    navigator.vibrate?.(14);
    persistDzikaKartaSession();

    if (dzikaKartaState.submissionCursor < getDzikaSubmitterIndexes().length) {
        renderDzikaKartaPass();
        goToScreen('dk-pass');
        return;
    }

    prepareDzikaKartaJudging();
}

function prepareDzikaKartaJudging() {
    dzikaKartaRuntime.shuffledSubmissions = DzikaKartaRules.shuffle(dzikaKartaState.submissions);
    renderDzikaKartaJudging();
    goToScreen('dk-pick');
}

function renderDzikaKartaJudging() {
    const judge = document.getElementById('dk-pick-judge');
    if (judge) judge.textContent = getDzikaJudge()?.name || 'Sędzia';
    renderDzikaPromptText('dk-pick-prompt');

    const list = document.getElementById('dk-submissions');
    if (!list) return;
    list.replaceChildren();

    if (!dzikaKartaRuntime.shuffledSubmissions.length) {
        dzikaKartaRuntime.shuffledSubmissions = DzikaKartaRules.shuffle(dzikaKartaState.submissions);
    }

    dzikaKartaRuntime.shuffledSubmissions.forEach((submission, index) => {
        const answer = getDzikaAnswer(submission.answerId);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dk-submission-card';

        const badge = document.createElement('b');
        badge.textContent = String.fromCharCode(65 + index);
        const text = document.createElement('span');
        text.textContent = answer?.text || 'Odpowiedź';

        button.append(badge, text);
        button.onclick = () => chooseDzikaKartaWinner(submission.playerId, submission.answerId);
        list.appendChild(button);
    });
}

function chooseDzikaKartaWinner(playerId, answerId) {
    const validSubmission = dzikaKartaState.submissions.some(
        submission => submission.playerId === playerId && submission.answerId === answerId
    );
    if (!validSubmission) return;

    dzikaKartaState.players = DzikaKartaRules.scoreWinner(dzikaKartaState.players, playerId);
    dzikaKartaState.roundResults[playerId] = (Number(dzikaKartaState.roundResults[playerId]) || 0) + 1;
    dzikaKartaRuntime.lastWinnerId = playerId;
    dzikaKartaRuntime.lastWinningAnswerId = answerId;
    dzikaKartaState.turnNumber += 1;
    dzikaKartaState.judgeIndex = DzikaKartaRules.nextJudgeIndex(
        dzikaKartaState.judgeIndex,
        dzikaKartaState.players.length
    );
    dzikaKartaState.currentPromptId = null;
    dzikaKartaState.submissions = [];
    dzikaKartaState.submissionCursor = 0;

    if (DzikaKartaRules.isRoundComplete(dzikaKartaState.turnNumber, dzikaKartaState.players.length)) {
        dzikaKartaState.completedRounds += 1;
        dzikaKartaState.awaitingRoundDecision = true;
    }

    persistDzikaKartaSession();
    renderDzikaKartaResult();
    goToScreen('dk-result');
    playSound?.('success');
    navigator.vibrate?.([20, 25, 35]);
}

function renderDzikaKartaResult() {
    const winner = dzikaKartaState.players.find(player => player.id === dzikaKartaRuntime.lastWinnerId);
    const name = document.getElementById('dk-result-winner');
    if (name) name.textContent = winner?.name || 'Zwycięzca';

    const answer = document.getElementById('dk-result-answer');
    if (answer) {
        answer.textContent = getDzikaAnswer(dzikaKartaRuntime.lastWinningAnswerId)?.text || 'Najlepsza odpowiedź';
    }

    const next = document.getElementById('dk-result-next');
    if (next) next.textContent = dzikaKartaState.awaitingRoundDecision ? 'PODSUMOWANIE RUNDY' : 'NASTĘPNY SĘDZIA';
}

function continueDzikaKartaAfterResult() {
    if (dzikaKartaState.awaitingRoundDecision) {
        renderDzikaKartaRoundSummary();
        goToScreen('dk-round-summary');
    } else {
        prepareDzikaKartaJudgeTurn();
    }
}

function renderDzikaRanking(containerId, round = false) {
    const root = document.getElementById(containerId);
    if (!root) return;
    root.replaceChildren();

    [...dzikaKartaState.players]
        .sort((a, b) => b.score - a.score)
        .forEach((player, index) => {
            const row = document.createElement('div');
            row.className = 'dk-ranking-row';

            const position = document.createElement('b');
            position.textContent = `${index + 1}.`;
            const name = document.createElement('span');
            name.textContent = player.name;
            const points = document.createElement('strong');
            points.textContent = round
                ? `+${dzikaKartaState.roundResults[player.id] || 0}`
                : `${player.score} pkt`;

            row.append(position, name, points);
            root.appendChild(row);
        });
}

function renderDzikaKartaRoundSummary() {
    const title = document.getElementById('dk-round-title');
    if (title) title.textContent = `Runda ${dzikaKartaState.completedRounds} zakończona`;
    renderDzikaRanking('dk-round-ranking', true);
}

function continueDzikaKartaRound() {
    dzikaKartaState.awaitingRoundDecision = false;
    dzikaKartaState.roundResults = {};
    persistDzikaKartaSession();
    prepareDzikaKartaJudgeTurn();
}

function finishDzikaKartaGame() {
    dzikaKartaState.gameFinished = true;
    dzikaKartaState.awaitingRoundDecision = false;
    persistDzikaKartaSession();
    renderDzikaKartaFinal();
    goToScreen('dk-final');
}

function renderDzikaKartaFinal() {
    const leaders = DzikaKartaRules.leaders(dzikaKartaState.players);
    const title = document.getElementById('dk-final-title');
    if (title) title.textContent = leaders.length > 1 ? 'Remis!' : `${leaders[0]?.name || 'Zwycięzca'} wygrywa!`;
    renderDzikaRanking('dk-final-ranking');
}

function restartDzikaKartaMatch() {
    dzikaKartaState.players = dzikaKartaState.players.map(player => ({
        ...player,
        score: 0,
        handIds: []
    }));
    dzikaKartaState.judgeIndex = 0;
    dzikaKartaState.turnNumber = 0;
    dzikaKartaState.completedRounds = 0;
    dzikaKartaState.roundResults = {};
    dzikaKartaState.awaitingRoundDecision = false;
    dzikaKartaState.gameFinished = false;
    dzikaKartaState.currentPromptId = null;
    dzikaKartaState.submissions = [];
    dzikaKartaState.submissionCursor = 0;
    initializeDzikaKartaDecks();
    persistDzikaKartaSession();
    prepareDzikaKartaJudgeTurn();
}
