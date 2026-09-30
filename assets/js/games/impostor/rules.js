(function exposeImpostorRules(root) {
    function shuffle(items, random = Math.random) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function assignRoles(players, impostorCount, hintMode, secretWord, secretHint, random = Math.random) {
        if (!Array.isArray(players) || players.length < 3) throw new Error('Potrzeba co najmniej 3 graczy.');
        if (!Number.isInteger(impostorCount) || impostorCount < 1 || impostorCount >= players.length) {
            throw new Error('Nieprawidłowa liczba impostorów.');
        }
        if (!['none', 'always', 'random'].includes(hintMode)) throw new Error('Nieprawidłowy tryb podpowiedzi.');

        const impostorIds = shuffle(players, random).slice(0, impostorCount).map(player => player.id);
        const roles = {};

        players.forEach(player => {
            const isImpostor = impostorIds.includes(player.id);
            const giveHint = hintMode === 'always' || (hintMode === 'random' && random() < 0.5);
            roles[player.id] = {
                isImpostor,
                word: isImpostor ? (giveHint ? secretHint : 'Brak podpowiedzi') : secretWord
            };
        });

        return { impostorIds, roles };
    }

    function scoreVote(players, impostorIds, selectedPlayerId) {
        const caughtImpostor = impostorIds.includes(selectedPlayerId);
        players.forEach(player => {
            if (caughtImpostor && !impostorIds.includes(player.id)) player.score += 2;
            if (!caughtImpostor && impostorIds.includes(player.id)) player.score += 5;
        });
        return caughtImpostor;
    }

    const api = { shuffle, assignRoles, scoreVote };
    root.ImpostorRules = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
