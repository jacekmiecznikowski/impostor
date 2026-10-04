(function exposeDzikaKartaRules(root) {
    const HAND_SIZE = 5;
    const MIN_PLAYERS = 3;
    const MAX_PLAYERS = 10;

    function clampPlayers(value) {
        const parsed = Number.parseInt(value, 10);
        const safe = Number.isFinite(parsed) ? parsed : 4;
        return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, safe));
    }

    function randomValue(random = Math.random) {
        const value = Number(random());
        return Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : 0;
    }

    function shuffle(items, random = Math.random) {
        const output = [...(items || [])];
        for (let index = output.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(randomValue(random) * (index + 1));
            [output[index], output[randomIndex]] = [output[randomIndex], output[index]];
        }
        return output;
    }

    function getSubmitterIndexes(playerCount, judgeIndex) {
        return Array.from({ length: playerCount }, (_, index) => index).filter(index => index !== judgeIndex);
    }

    function nextJudgeIndex(current, playerCount) {
        const count = Math.max(1, Number(playerCount) || 1);
        return ((Number(current) || 0) + 1) % count;
    }

    function isRoundComplete(turnNumber, playerCount) {
        const count = Math.max(1, Number(playerCount) || 1);
        return Number(turnNumber) > 0 && Number(turnNumber) % count === 0;
    }

    function refillHand(handIds, deckIds, discardIds, answerIds, random = Math.random) {
        const valid = new Set(answerIds || []);
        const hand = (handIds || []).filter(id => valid.has(id));
        let deck = (deckIds || []).filter(id => valid.has(id) && !hand.includes(id));
        let discard = (discardIds || []).filter(id => valid.has(id) && !hand.includes(id));

        while (hand.length < HAND_SIZE) {
            if (!deck.length) {
                deck = shuffle(discard, random);
                discard = [];
            }
            if (!deck.length) break;
            hand.push(deck.shift());
        }

        return { handIds: hand, deckIds: deck, discardIds: discard };
    }

    function scoreWinner(players, winnerId) {
        return (players || []).map(player => ({
            ...player,
            score: (Number(player.score) || 0) + (player.id === winnerId ? 1 : 0)
        }));
    }

    function leaders(players) {
        const list = players || [];
        const max = Math.max(0, ...list.map(player => Number(player.score) || 0));
        return list.filter(player => (Number(player.score) || 0) === max);
    }

    const api = {
        HAND_SIZE,
        MIN_PLAYERS,
        MAX_PLAYERS,
        clampPlayers,
        shuffle,
        getSubmitterIndexes,
        nextJudgeIndex,
        isRoundComplete,
        refillHand,
        scoreWinner,
        leaders
    };

    root.DzikaKartaRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
