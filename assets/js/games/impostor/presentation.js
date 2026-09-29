function setupImpostorPresentation() {
    ensureImpostorStylesheet();
    setupRevealPresentation();
    setupVotingPresentation();
}

function ensureImpostorStylesheet() {
    const href = './assets/css/impostor.css';
    if (document.querySelector(`link[href="${href}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
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
    card.className = 'reveal-card select-none';
    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-label');
    ['onmousedown', 'onmouseup', 'onmouseleave', 'ontouchstart', 'ontouchend', 'ontouchcancel'].forEach(attr => card.removeAttribute(attr));

    const front = cardInner.children[0];
    const back = cardInner.children[1];

    let holdControl = null;

    if (front) {
        front.className = 'reveal-card-face reveal-card-front';
        front.setAttribute('aria-hidden', 'false');
        front.replaceChildren();

        const title = document.createElement('strong');
        title.className = 'reveal-card-title';
        title.textContent = 'Przytrzymaj odcisk, aby odkryć rolę';

        const subtitle = document.createElement('p');
        subtitle.className = 'reveal-card-subtitle';
        subtitle.textContent = 'Trzymaj palec na przycisku poniżej. Puść, aby znowu ukryć kartę.';

        holdControl = document.createElement('button');
        holdControl.type = 'button';
        holdControl.className = 'fingerprint-orb';
        holdControl.setAttribute('aria-label', 'Przytrzymaj, aby odkryć swoją rolę');
        holdControl.innerHTML = '<i class="fa-solid fa-fingerprint" aria-hidden="true"></i><span>Przytrzymaj</span>';

        const privacy = document.createElement('small');
        privacy.className = 'reveal-card-privacy';
        privacy.innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i><span>Nie pokazuj ekranu innym graczom</span>';

        front.append(title, subtitle, holdControl, privacy);
    }

    if (back) {
        back.className = 'reveal-card-face reveal-card-back';
        back.setAttribute('aria-hidden', 'true');

        document.getElementById('secret-badge')?.classList.add('reveal-role-badge');
        document.getElementById('secret-label-type')?.classList.add('reveal-secret-label');
        document.getElementById('secret-word-display')?.classList.add('reveal-secret-word');
        document.getElementById('secret-desc')?.classList.add('reveal-secret-description');
        document.getElementById('secret-word-display')?.parentElement?.classList.add('reveal-secret-block');

        if (!back.querySelector('.reveal-release-hint')) {
            const releaseHint = document.createElement('small');
            releaseHint.className = 'reveal-release-hint';
            releaseHint.innerHTML = '<i class="fa-solid fa-hand-pointer" aria-hidden="true"></i><span>Puść palec, aby ukryć rolę</span>';
            back.appendChild(releaseHint);
        }
    }

    if (holdControl) {
        let isHolding = false;

        const setFaceAccessibility = revealed => {
            front?.setAttribute('aria-hidden', String(revealed));
            back?.setAttribute('aria-hidden', String(!revealed));
        };

        const hideRole = () => {
            if (!isHolding) return;
            isHolding = false;
            revealSecret(false);
            setFaceAccessibility(false);
            holdControl.classList.remove('is-holding');
        };

        const showRole = event => {
            event.preventDefault();
            if (isHolding) return;
            isHolding = true;
            setFaceAccessibility(true);
            holdControl.classList.add('is-holding');

            if (event.pointerId !== undefined && holdControl.setPointerCapture) {
                try { holdControl.setPointerCapture(event.pointerId); } catch (_) { /* no-op */ }
            }

            revealSecret(true);
        };

        holdControl.addEventListener('pointerdown', showRole);
        holdControl.addEventListener('pointerup', hideRole);
        holdControl.addEventListener('pointercancel', hideRole);
        holdControl.addEventListener('lostpointercapture', hideRole);
        holdControl.addEventListener('contextmenu', event => event.preventDefault());

        card.addEventListener('pointerup', hideRole);
        card.addEventListener('pointercancel', hideRole);

        holdControl.addEventListener('keydown', event => {
            if ((event.code === 'Space' || event.code === 'Enter') && !isHolding) {
                event.preventDefault();
                isHolding = true;
                setFaceAccessibility(true);
                holdControl.classList.add('is-holding');
                revealSecret(true);
            }
        });

        holdControl.addEventListener('keyup', event => {
            if (event.code === 'Space' || event.code === 'Enter') hideRole();
        });

        holdControl.addEventListener('blur', hideRole);
    }

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
    if (description) description.textContent = 'Wybierz jedną osobę wskazaną przez większość.';

    if (!document.getElementById('vote-selection-summary')) {
        const summary = document.createElement('div');
        summary.id = 'vote-selection-summary';
        summary.className = 'vote-selection-summary';
        summary.setAttribute('aria-live', 'polite');
        header.insertAdjacentElement('afterend', summary);
    }

    updateVoteSelectionSummary();
}

function updateVoteSelectionSummary() {
    const summary = document.getElementById('vote-selection-summary');
    if (!summary) return;

    const selected = state.players.find(player => player.id === state.selectedVotedPlayerId);
    summary.classList.toggle('has-selection', Boolean(selected));
    summary.replaceChildren();

    const label = document.createElement('span');
    label.textContent = selected ? 'Wybrana osoba' : 'Wybór grupy';

    const value = document.createElement('strong');
    value.textContent = selected ? selected.name : 'Jeszcze nikogo nie wskazano';

    summary.append(label, value);
}

function renderGroupVotingScreen() {
    const grid = document.getElementById('group-voting-players-grid');
    if (!grid) return;
    grid.replaceChildren();

    state.players.forEach(player => {
        const isSelected = state.selectedVotedPlayerId === player.id;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `vote-card${isSelected ? ' is-selected' : ''}`;
        card.setAttribute('aria-pressed', String(isSelected));
        card.setAttribute('aria-label', `${isSelected ? 'Wybrano' : 'Wybierz'} gracza ${player.name}`);
        card.onclick = () => selectGroupVoteTarget(player.id);

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

        card.append(avatar, copy, marker);
        grid.appendChild(card);
    });

    updateVoteSelectionSummary();
}
