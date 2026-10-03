function getPartyjniakCatalog() {
    return typeof getGameCatalog === 'function' ? getGameCatalog() : [];
}

function ensurePartyjniakStylesheet() {
    const href = './assets/css/partyjniak.css';
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

function ensureNavigationSheet() {
    if (document.getElementById('navigation-sheet')) return;

    const sheet = document.createElement('div');
    sheet.id = 'navigation-sheet';
    sheet.className = 'navigation-sheet hidden';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-labelledby', 'navigation-sheet-title');
    sheet.innerHTML = `
        <div class="navigation-sheet-card">
            <span class="navigation-sheet-handle" aria-hidden="true"></span>
            <div class="navigation-sheet-icon"><i class="fa-solid fa-pause" aria-hidden="true"></i></div>
            <h2 id="navigation-sheet-title">Przerwać rundę?</h2>
            <p>Możesz wrócić do gry albo zakończyć bieżącą rundę. Punkty i zapisani gracze zostaną zachowani.</p>
            <div class="navigation-sheet-actions">
                <button type="button" data-sheet-primary class="primary-btn" onclick="closeNavigationSheet()"><i class="fa-solid fa-play" aria-hidden="true"></i><span>Graj dalej</span></button>
                <button type="button" class="secondary-btn" onclick="leaveActiveRound('menu')"><i class="fa-solid fa-gamepad" aria-hidden="true"></i><span>Menu gry</span></button>
                <button type="button" class="navigation-sheet-link" onclick="leaveActiveRound('home')"><i class="fa-solid fa-table-cells-large" aria-hidden="true"></i><span>Wszystkie gry</span></button>
            </div>
        </div>`;

    sheet.addEventListener('click', event => {
        if (event.target === sheet) closeNavigationSheet();
    });
    document.body.appendChild(sheet);
}

function setupAppShell() {
    const header = document.querySelector('header');
    if (!header) return;

    header.id = 'app-shell';
    header.className = 'app-shell';
    header.setAttribute('aria-label', 'Nawigacja aplikacji');
    header.innerHTML = `
        <div class="shell-frame">
            <button id="shell-back-btn" type="button" class="shell-icon-button hidden" onclick="navigateBack()" aria-label="Wróć"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
            <div class="shell-context" aria-live="polite">
                <span id="shell-logo" class="shell-logo"><img src="./assets/icons/icon.svg" alt="" aria-hidden="true"></span>
                <span class="shell-brand-copy"><strong id="shell-title">Partyjniak</strong><small id="shell-subtitle">gry imprezowe</small></span>
            </div>
            <button id="shell-more-btn" type="button" class="shell-icon-button" onclick="toggleShellMenu()" aria-label="Więcej opcji" aria-expanded="false"><i class="fa-solid fa-ellipsis-vertical" aria-hidden="true"></i></button>
        </div>
        <div id="shell-menu-popover" class="shell-popover hidden" role="menu">
            <button type="button" class="shell-menu-item" onclick="toggleAudio(); closeShellMenu()"><i id="audio-icon" class="fa-solid fa-volume-high"></i><span>Dźwięk</span></button>
            <button id="shell-score-action" type="button" class="shell-menu-item hidden" onclick="openCurrentScoreboard()"><i class="fa-solid fa-trophy"></i><span>Wyniki</span></button>
            <button id="shell-rules-action" type="button" class="shell-menu-item hidden" onclick="openCurrentRules()"><i class="fa-solid fa-book-open"></i><span>Zasady gry</span></button>
            <div class="shell-menu-divider"></div>
            <button type="button" class="shell-menu-item" onclick="openModal('about-modal')"><i class="fa-solid fa-circle-info"></i><span>O Partyjniaku</span></button>
            <button id="shell-game-menu-action" type="button" class="shell-menu-item hidden" onclick="requestLeaveGame('menu')"><i class="fa-solid fa-gamepad"></i><span>Menu gry</span></button>
            <button id="shell-exit-action" type="button" class="shell-menu-item hidden" onclick="requestLeaveGame('home')"><i class="fa-solid fa-table-cells-large"></i><span>Wszystkie gry</span></button>
        </div>`;

    ensureNavigationSheet();
}

function setupGameHub() {
    ensurePartyjniakStylesheet();
    setupAppShell();

    const main = document.querySelector('main');
    if (!main) return;
    const catalog = getPartyjniakCatalog();

    if (!document.getElementById('screen-home')) {
        const home = document.createElement('section');
        home.id = 'screen-home';
        home.className = 'screen home-screen hidden flex-col flex-1';

        const hero = document.createElement('div');
        hero.className = 'home-hero';
        hero.innerHTML = `<div class="home-logo-lockup"><img src="./assets/icons/icon.svg" alt="" aria-hidden="true"></div><span class="home-kicker">Gry na jedną kanapę</span><h1 class="home-title">Partyjniak</h1><p class="home-subtitle">Gry imprezowe na jeden telefon. Wybierz tryb, podaj telefon dalej i graj.</p>`;

        const library = document.createElement('div');
        library.className = 'game-library';

        catalog.filter(game => game.status === 'available').forEach(game => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'game-card-primary';
            button.onclick = () => openGame(game.id);

            const icon = document.createElement('span');
            icon.className = 'game-card-icon';
            icon.innerHTML = `<i class="fa-solid ${game.icon}" aria-hidden="true"></i>`;

            const copy = document.createElement('span');
            copy.className = 'game-card-copy';
            const name = document.createElement('strong');
            name.textContent = game.name;
            const description = document.createElement('span');
            description.textContent = game.description;
            copy.append(name, description);

            const arrow = document.createElement('span');
            arrow.className = 'game-card-arrow';
            arrow.innerHTML = '<i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
            button.append(icon, copy, arrow);
            library.appendChild(button);
        });

        const installButton = document.createElement('button');
        installButton.id = 'install-app-btn';
        installButton.type = 'button';
        installButton.className = 'hidden secondary-btn';
        installButton.onclick = promptInstallApp;
        installButton.innerHTML = '<i class="fa-solid fa-mobile-screen-button text-violet-300"></i><span>Zainstaluj Partyjniaka</span>';
        library.appendChild(installButton);

        const prototypes = catalog.filter(game => game.status !== 'available');
        if (prototypes.length) {
            const upcomingLabel = document.createElement('p');
            upcomingLabel.className = 'upcoming-label';
            upcomingLabel.textContent = 'Nadchodzące gry';
            library.appendChild(upcomingLabel);

            const upcomingGrid = document.createElement('div');
            upcomingGrid.className = 'upcoming-grid';
            prototypes.forEach(game => {
                const card = document.createElement('article');
                card.className = 'upcoming-card';
                const icon = document.createElement('i');
                icon.className = `fa-solid ${game.icon}`;
                icon.setAttribute('aria-hidden', 'true');
                const name = document.createElement('strong');
                name.textContent = game.name;
                const description = document.createElement('small');
                description.textContent = `W przygotowaniu • ${game.description}`;
                card.append(icon, name, description);
                upcomingGrid.appendChild(card);
            });
            library.appendChild(upcomingGrid);
        }

        home.append(hero, library);
        main.prepend(home);
    }

    const about = document.querySelector('#about-modal .text-sm');
    if (about) {
        const availableNames = catalog.filter(game => game.status === 'available').map(game => game.name);
        const prototypeNames = catalog.filter(game => game.status !== 'available').map(game => game.name);
        const prototypesCopy = prototypeNames.length
            ? `<p>W przygotowaniu: <strong>${prototypeNames.join('</strong>, <strong>')}</strong>.</p>`
            : '';
        about.innerHTML = `<p><strong>Partyjniak</strong> to kolekcja mobilnych gier imprezowych na jeden telefon.</p><p>Dostępne gry: <strong>${availableNames.join('</strong> i <strong>')}</strong>.</p>${prototypesCopy}`;
    }

    const resetButton = document.querySelector('#score-modal .secondary-btn');
    if (resetButton) {
        resetButton.removeAttribute('onclick');
        resetButton.onclick = resetCurrentScores;
    }
    const scoreTitle = document.querySelector('#score-modal h3');
    if (scoreTitle) scoreTitle.id = 'score-modal-title';

    updateInstallButton();
    document.title = 'Partyjniak – gry imprezowe';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', 'Partyjniak – mobilne gry imprezowe na jeden telefon. Impostor, Tykająca Bomba i kolejne tryby.');
}

function toggleShellMenu(force) {
    const popover = document.getElementById('shell-menu-popover');
    const button = document.getElementById('shell-more-btn');
    if (!popover || !button) return;
    const shouldOpen = typeof force === 'boolean' ? force : popover.classList.contains('hidden');
    popover.classList.toggle('hidden', !shouldOpen);
    button.setAttribute('aria-expanded', String(shouldOpen));
}

function closeShellMenu() { toggleShellMenu(false); }

function openGame(gameId, { silent = false } = {}) {
    const gameModule = getGameModule(gameId);
    const game = gameModule?.catalog;
    if (!game) return;
    if (game.status !== 'available') {
        showToast('W przygotowaniu', `${game.name} ma już zarezerwowane miejsce w Partyjniaku. Mechanikę dodamy w kolejnych etapach.`, 'fa-solid fa-flask');
        return;
    }

    closeShellMenu();
    if (typeof gameModule.open === 'function') gameModule.open({ silent });
    else if (gameModule.menuScreen) goToScreen(gameModule.menuScreen, { silent });
}

function openCurrentRules() {
    const gameModule = getActiveGameModule();
    if (!gameModule?.rulesModalId) return;
    openModal(gameModule.rulesModalId);
}

function openCurrentScoreboard() {
    const gameModule = getActiveGameModule();
    if (!gameModule || typeof gameModule.renderScoreboard !== 'function') return;
    openModal('score-modal');
}

function resetCurrentScores() {
    const gameModule = getActiveGameModule();
    callGameHook(gameModule, 'resetScoreboard');
}
