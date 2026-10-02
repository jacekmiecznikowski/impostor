function clampPlayerSetupCount(value, min, max, fallback = min) {
    const parsed = Number.parseInt(value, 10);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(max, Math.max(min, safe));
}

function resizePlayerSetupRoster(players, count, createPlayer) {
    const previous = Array.isArray(players) ? players : [];
    return Array.from({ length: count }, (_, index) => {
        const existing = previous[index];
        if (existing) return { ...existing };
        return createPlayer(index);
    });
}

function syncPlayerSetupCount({ sliderId, labelId, count }) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (slider) slider.value = String(count);
    if (label) label.textContent = String(count);
}

function renderPlayerSetupNames({
    containerId,
    players,
    maxLength = 20,
    inputIdPrefix = '',
    onInput
}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.replaceChildren();

    players.forEach((player, index) => {
        const row = document.createElement('label');
        row.className = 'player-setup-name-row';

        const number = document.createElement('span');
        number.className = 'player-setup-number';
        number.textContent = String(index + 1).padStart(2, '0');

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = maxLength;
        input.autocomplete = 'off';
        input.value = player?.name || `Gracz ${index + 1}`;
        input.placeholder = 'Imię gracza...';
        input.enterKeyHint = index === players.length - 1 ? 'done' : 'next';
        input.setAttribute('aria-label', `Imię gracza ${index + 1}`);
        if (inputIdPrefix) input.id = `${inputIdPrefix}${index}`;
        input.addEventListener('input', () => onInput?.(index, input.value, input));

        row.append(number, input);
        container.appendChild(row);
    });
}

function playPlayerSetupCountFeedback() {
    if (typeof playSound === 'function') playSound('click');
}
