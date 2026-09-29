let revealCardController = null;

function setupImpostorPresentation() {
    ensureImpostorStylesheet();
    setupRevealPresentation();
    setupVotingPresentation();
}

function ensureImpostorStylesheet() {
    ['./assets/css/impostor.css', './assets/css/impostor-reveal.css'].forEach(href => {
        if (document.querySelector(`link[href="${href}"]`)) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    });
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
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Przytrzymaj kartę, aby odkryć swoją rolę');
    ['onmousedown', 'onmouseup', 'onmouseleave', 'ontouchstart', 'ontouchend', 'ontouchcancel'].forEach(attr => card.removeAttribute(attr));

    const front = cardInner.children[0];
    const back = cardInner.children[1];

    if (front) {
        front.className = 'reveal-card-face reveal-card-front is-visible';
        front.setAttribute('aria-hidden', 'false');
        front.replaceChildren();

        const title = document.createElement('strong');
        title.className = 'reveal-card-title';
        title.textContent = 'Przytrzymaj kartę, aby odkryć rolę';

        const subtitle = document.createElement('p');
        subtitle.className = 'reveal-card-subtitle';
        subtitle.textContent = 'Przytrzymaj w dowolnym miejscu. Treść ustawi się z dala od Twojego palca.';

        const fingerprint = document.createElement('span');
        fingerprint.className = 'fingerprint-orb';
        fingerprint.setAttribute('aria-hidden', 'true');
        fingerprint.innerHTML = '<i class="fa-solid fa-fingerprint"></i><span>Przytrzymaj kartę</span>';

        const privacy = document.createElement('small');
        privacy.className = 'reveal-card-privacy';
        privacy.innerHTML = '<i class="fa-solid fa-eye-slash" aria-hidden="true"></i><span>Nie pokazuj ekranu innym graczom</span>';

        front.append(title, subtitle, fingerprint, privacy);
    }

    if (back) {
        back.className = 'reveal-card-face reveal-card-back';
        back.setAttribute('aria-hidden', 'true');

        const badge = document.getElementById('secret-badge');
        const secretBlock = document.getElementById('secret-word-display')?.parentElement;
        const description = document.getElementById('secret-desc');

        badge?.classList.add('reveal-role-badge');
        document.getElementById('secret-label-type')?.classList.add('reveal-secret-label');
        document.getElementById('secret-word-display')?.classList.add('reveal-secret-word');
        description?.classList.add('reveal-secret-description');
        secretBlock?.classList.add('reveal-secret-block');

        let roleHero = back.querySelector('.reveal-role-hero');
        if (!roleHero) {
            roleHero = document.createElement('div');
            roleHero.className = 'reveal-role-hero';
            roleHero.innerHTML = `
                <span id="reveal-role-icon" class="reveal-role-icon"><i class="fa-solid fa-user-check" aria-hidden="true"></i></span>
                <span class="reveal-role-copy">
                    <small>Twoja rola</small>
                    <strong id="reveal-role-title">ZWYKŁY GRACZ</strong>
                    <span id="reveal-role-message">Znasz wspólne hasło</span>
                </span>`;
        }

        let backContent = back.querySelector('.reveal-back-content');
        if (!backContent) {
            backContent = document.createElement('div');
            backContent.className = 'reveal-back-content';
            back.prepend(backContent);
        }

        [roleHero, badge, secretBlock, description].forEach(element => {
            if (element) backContent.appendChild(element);
        });

        if (!back.querySelector('.reveal-release-hint')) {
            const releaseHint = document.createElement('small');
            releaseHint.className = 'reveal-release-hint';
            releaseHint.innerHTML = '<i class="fa-solid fa-hand-pointer" aria-hidden="true"></i><span>Puść palec, aby ukryć rolę</span>';
            back.appendChild(releaseHint);
        }
    }

    let isHolding = false;
    let visibleBack = false;
    let desiredBack = false;
    let animating = false;
    let animationGeneration = 0;
    let resetAnchorTimer = null;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const OUT_MS = reducedMotion ? 20 : 170;
    const IN_MS = reducedMotion ? 20 : 220;

    const wait = ms => new Promise(resolve => window.setTimeout(resolve, ms));

    const setVisibleFace = revealed => {
        visibleBack = revealed;
        front?.classList.toggle('is-visible', !revealed);
        back?.classList.toggle('is-visible', revealed);
        front?.setAttribute('aria-hidden', String(revealed));
        back?.setAttribute('aria-hidden', String(!revealed));
    };

    const clearFlipClasses = () => {
        card.classList.remove('flip-out', 'flip-in-prep', 'flip-in', 'flip-abort');
    };

    const runFlip = async targetBack => {
        if (animating || targetBack === visibleBack) return;

        animating = true;
        const generation = ++animationGeneration;
        clearFlipClasses();
        card.classList.add('flip-out');
        await wait(OUT_MS);

        if (generation !== animationGeneration) return;

        if (desiredBack !== targetBack) {
            card.classList.remove('flip-out');
            card.classList.add('flip-abort');
            await wait(OUT_MS);
            if (generation !== animationGeneration) return;
            clearFlipClasses();
            animating = false;
            if (desiredBack !== visibleBack) runFlip(desiredBack);
            return;
        }

        setVisibleFace(targetBack);
        card.classList.remove('flip-out');
        card.classList.add('flip-in-prep');
        void card.offsetWidth;

        requestAnimationFrame(() => {
            if (generation !== animationGeneration) return;
            card.classList.remove('flip-in-prep');
            card.classList.add('flip-in');
        });

        await wait(IN_MS + 20);
        if (generation !== animationGeneration) return;

        clearFlipClasses();
        animating = false;
        if (desiredBack !== visibleBack) runFlip(desiredBack);
    };

    const requestFace = reveal => {
        desiredBack = reveal;
        if (!animating && desiredBack !== visibleBack) runFlip(desiredBack);
    };

    const updateTouchAnchor = event => {
        const rect = card.getBoundingClientRect();
        const y = Number.isFinite(event?.clientY) ? event.clientY - rect.top : rect.height * 0.72;
        const isUpperTouch = y < rect.height * 0.5;
        card.classList.toggle('hold-upper', isUpperTouch);
        card.classList.toggle('hold-lower', !isUpperTouch);
    };

    const reset = () => {
        animationGeneration++;
        animating = false;
        isHolding = false;
        desiredBack = false;
        clearTimeout(resetAnchorTimer);
        clearFlipClasses();
        card.classList.remove('is-holding', 'hold-upper', 'hold-lower');
        setVisibleFace(false);
    };

    const hideRole = () => {
        if (!isHolding) return;
        isHolding = false;
        revealSecret(false);
        card.classList.remove('is-holding');
        requestFace(false);
        clearTimeout(resetAnchorTimer);
        resetAnchorTimer = setTimeout(() => {
            if (!isHolding) card.classList.remove('hold-upper', 'hold-lower');
        }, OUT_MS + IN_MS + 80);
    };

    const showRole = event => {
        event.preventDefault();
        if (isHolding) return;
        isHolding = true;
        clearTimeout(resetAnchorTimer);
        updateTouchAnchor(event);
        card.classList.add('is-holding');

        if (event.pointerId !== undefined && card.setPointerCapture) {
            try { card.setPointerCapture(event.pointerId); } catch (_) { /* no-op */ }
        }

        revealSecret(true);
        requestFace(true);
    };

    card.addEventListener('pointerdown', showRole);
    card.addEventListener('pointerup', hideRole);
    card.addEventListener('pointercancel', hideRole);
    card.addEventListener('lostpointercapture', hideRole);
    card.addEventListener('contextmenu', event => event.preventDefault());
    card.addEventListener('keydown', event => {
        if ((event.code === 'Space' || event.code === 'Enter') && !isHolding) {
            event.preventDefault();
            isHolding = true;
            card.classList.add('hold-lower', 'is-holding');
            revealSecret(true);
            requestFace(true);
        }
    });
    card.addEventListener('keyup', event => {
        if (event.code === 'Space' || event.code === 'Enter') hideRole();
    });
    card.addEventListener('blur', hideRole);

    revealCardController = { reset, requestFace };
    reset();
    document.getElementById('finish-reveal-btn')?.classList.add('reveal-next-btn');
}

function resetRevealCardPresentation() {
    revealCardController?.reset();
}

function syncRevealRolePresentation() {
    const player = state.players[state.currentTurnPlayerIndex];
    const role = player ? state.playerRoles[player.id] : null;
    const card = document.querySelector('.reveal-card');
    if (!role || !card) return;

    const isImpostor = Boolean(role.isImpostor);
    const hasHint = isImpostor && role.word !== 'Brak podpowiedzi';

    card.classList.toggle('is-impostor', isImpostor);
    card.classList.toggle('is-player', !isImpostor);

    const roleTitle = document.getElementById('reveal-role-title');
    const roleMessage = document.getElementById('reveal-role-message');
    const roleIcon = document.getElementById('reveal-role-icon');
    const badge = document.getElementById('secret-badge');
    const label = document.getElementById('secret-label-type');
    const description = document.getElementById('secret-desc');

    if (isImpostor) {
        if (roleTitle) roleTitle.textContent = 'IMPOSTOR';
        if (roleMessage) roleMessage.textContent = 'Nie znasz prawdziwego hasła';
        if (roleIcon) roleIcon.innerHTML = '<i class="fa-solid fa-user-secret" aria-hidden="true"></i>';

        if (badge) {
            badge.className = 'reveal-role-badge impostor-warning-badge';
            badge.textContent = hasHint ? 'TO TYLKO PODPOWIEDŹ' : 'NIE MASZ PODPOWIEDZI';
        }

        if (label) label.textContent = hasHint ? 'PODPOWIEDŹ — TO NIE JEST HASŁO' : 'NIE ZNASZ TAJNEGO SŁOWA';
        if (description) {
            description.textContent = hasHint
                ? 'Jesteś impostorem. To słowo jest tylko wskazówką — właściwego hasła nie znasz.'
                : 'Jesteś impostorem i nie znasz hasła. Słuchaj innych, blefuj i spróbuj się nie zdradzić.';
        }
    } else {
        if (roleTitle) roleTitle.textContent = 'ZWYKŁY GRACZ';
        if (roleMessage) roleMessage.textContent = 'Znasz wspólne tajne słowo';
        if (roleIcon) roleIcon.innerHTML = '<i class="fa-solid fa-user-check" aria-hidden="true"></i>';

        if (badge) {
            badge.className = 'reveal-role-badge player-role-badge';
            badge.textContent = 'ZNACIE TO SAMO HASŁO';
        }

        if (label) label.textContent = 'TAJNE SŁOWO';
        if (description) description.textContent = 'Zapamiętaj hasło i znajdź impostora, który go nie zna.';
    }
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
