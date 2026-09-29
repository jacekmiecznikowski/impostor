function setupImpostorPresentation() {
    setupRevealPresentation();
    setupVotingPresentation();
}

function setupRevealPresentation() {
    const screen = document.getElementById('screen-reveal');
    const cardInner = document.getElementById('secret-card-inner');
    if (!screen || !cardInner) return;

    screen.classList.add('reveal-screen');

    const heading = screen.firstElementChild;
    if (heading) {
        heading.className = 'reveal-heading';
        const helper = heading.querySelector('h2');
        if (helper) helper.textContent = 'Sprawdź swoją rolę';
    }

    const card = cardInner.parentElement;
    card.className = 'reveal-card perspective-1000 cursor-pointer select-none';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Przytrzymaj, aby odkryć swoją rolę');
    ['onmousedown', 'onmouseup', 'onmouseleave', 'ontouchstart', 'ontouchend', 'ontouchcancel'].forEach(attr => card.removeAttribute(attr));

    const front = cardInner.children[0];
    const back = cardInner.children[1];

    if (front) {
        front.className = 'reveal-card-face reveal-card-front backface-hidden';
        front.replaceChildren();

        const title = document.createElement('strong');
        title.className = 'reveal-card-title';
        title.textContent = 'Przytrzymaj, aby odkryć rolę';

        const subtitle = document.createElement('p');
        subtitle.className = 'reveal-card-subtitle';
        subtitle.textContent = 'Puść palec, a karta znów się ukryje.';

        const fingerprint = document.createElement('span');
        fingerprint.className = 'fingerprint-orb';
        fingerprint.innerHTML = '<i class="fa-solid fa-fingerprint" aria-hidden="true"></i>';

        const privacy = document.createElement('small');
        privacy.className = 'reveal-card-privacy';
        privacy.innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i><span>Nie pokazuj ekranu innym graczom</span>';

        front.append(title, subtitle, fingerprint, privacy);
    }

    if (back) {
        back.className = 'reveal-card-face reveal-card-back backface-hidden rotate-y-180';
        document.getElementById('secret-label-type')?.classList.add('reveal-secret-label');
        document.getElementById('secret-word-display')?.classList.add('reveal-secret-word');
        document.getElementById('secret-desc')?.classList.add('reveal-secret-description');
    }

    const hideRole = () => revealSecret(false);
    const showRole = event => {
        event.preventDefault();
        if (event.pointerId !== undefined && card.setPointerCapture) {
            try { card.setPointerCapture(event.pointerId); } catch (_) { /* no-op */ }
        }
        revealSecret(true);
    };

    card.addEventListener('pointerdown', showRole);
    card.addEventListener('pointerup', hideRole);
    card.addEventListener('pointercancel', hideRole);
    card.addEventListener('lostpointercapture', hideRole);
    card.addEventListener('contextmenu', event => event.preventDefault());
    card.addEventListener('keydown', event => {
        if (event.code === 'Space' || event.code === 'Enter') {
            event.preventDefault();
            revealSecret(true);
        }
    });
    card.addEventListener('keyup', event => {
        if (event.code === 'Space' || event.code === 'Enter') revealSecret(false);
    });

    document.getElementById('finish-reveal-btn')?.classList.add('reveal-next-btn');
}

function setupVotingPresentation() {
    const screen = document.getElementById('screen-group-voting');
    if (!screen) return;

    screen.classList.add('voting-screen');
    const header = screen.firstElementChild;
    if (!header) return;

    header.className = 'voting-header';
    if (!header.querySelector('.voting-icon')) {
        const icon = document.createElement('div');
        icon.className = 'voting-icon';
        icon.innerHTML = '<i class="fa-solid fa-gavel" aria-hidden="true"></i>';
        header.prepend(icon);
    }

    const title = header.querySelector('h2');
    const description = header.querySelector('p:last-child');
    if (title) title.textContent = 'Kogo wskazuje grupa?';
    if (description) description.textContent = 'Wybierz gracza, który otrzymał najwięcej głosów.';
}

function renderGroupVotingScreen() {
    const grid = document.getElementById('group-voting-players-grid');
    if (!grid) return;
    grid.replaceChildren();

    state.players.forEach((player, index) => {
        const isSelected = state.selectedVotedPlayerId === player.id;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `vote-card${isSelected ? ' is-selected' : ''}`;
        card.setAttribute('aria-pressed', String(isSelected));
        card.onclick = () => selectGroupVoteTarget(player.id);

        const number = document.createElement('span');
        number.className = 'vote-number';
        number.textContent = String(index + 1).padStart(2, '0');

        const avatar = document.createElement('span');
        avatar.className = 'vote-avatar';
        avatar.textContent = player.name.charAt(0).toUpperCase();

        const copy = document.createElement('span');
        copy.className = 'vote-copy';

        const name = document.createElement('strong');
        name.className = 'vote-player-name';
        name.textContent = player.name;

        const hint = document.createElement('span');
        hint.className = 'vote-player-hint';
        hint.textContent = isSelected ? 'Wybrany przez grupę' : 'Dotknij, aby wybrać';
        copy.append(name, hint);

        const marker = document.createElement('span');
        marker.className = 'vote-marker';
        marker.innerHTML = isSelected
            ? '<i class="fa-solid fa-check" aria-hidden="true"></i>'
            : '<span class="vote-marker-dot" aria-hidden="true"></span>';

        card.append(number, avatar, copy, marker);
        grid.appendChild(card);
    });
}
