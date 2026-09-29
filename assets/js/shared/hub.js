const GAME_CATALOG = [
    {
        id: 'impostor',
        name: 'Impostor',
        description: 'Dedukcja, blef i szukanie osoby, która nie zna hasła.',
        icon: 'fa-user-secret',
        status: 'available'
    },
    {
        id: 'heads-up',
        name: 'Czółko',
        description: 'Zgaduj hasło dzięki podpowiedziom znajomych.',
        icon: 'fa-face-grin-stars',
        status: 'coming-soon'
    },
    {
        id: 'taboo',
        name: 'Tabu',
        description: 'Opisuj hasła bez używania zakazanych słów.',
        icon: 'fa-comment-slash',
        status: 'coming-soon'
    }
];

function ensurePartyjniakStylesheet() {
    const href = './assets/css/partyjniak.css';
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

function setupAppShell() {
    const header = document.querySelector('header');
    if (!header) return;

    header.id = 'app-shell';
    header.className = 'app-shell';
    header.innerHTML = `
        <div class="shell-frame">
            <button id="shell-back-btn" type="button" class="shell-icon-button hidden" onclick="goToGameHub()" aria-label="Wróć do wyboru gier">
                <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button type="button" class="shell-brand" onclick="goToGameHub()" aria-label="Partyjniak – wybór gier">
                <span id="shell-logo" class="shell-logo"><img src="./assets/icons/icon.svg" alt="" aria-hidden="true"></span>
                <span class="shell-brand-copy"><strong id="shell-title">Partyjniak</strong><small id="shell-subtitle">gry imprezowe</small></span>
            </button>
            <button id="shell-more-btn" type="button" class="shell-icon-button" onclick="toggleShellMenu()" aria-label="Menu" aria-expanded="false">
                <i class="fa-solid fa-ellipsis" aria-hidden="true"></i>
            </button>
        </div>
        <div id="shell-menu-popover" class="shell-popover hidden">
            <button type="button" class="shell-menu-item" onclick="toggleAudio(); closeShellMenu()"><i id="audio-icon" class="fa-solid fa-volume-high"></i><span>Dźwięk</span></button>
            <button id="shell-score-action" type="button" class="shell-menu-item" onclick="openModal('score-modal')"><i class="fa-solid fa-trophy"></i><span>Wyniki</span></button>
            <button id="shell-rules-action" type="button" class="shell-menu-item" onclick="openModal('rules-modal')"><i class="fa-solid fa-book-open"></i><span>Zasady Impostora</span></button>
            <button type="button" class="shell-menu-item" onclick="openModal('about-modal')"><i class="fa-solid fa-circle-info"></i><span>O grze</span></button>
            <div class="shell-menu-divider"></div>
            <button id="shell-exit-action" type="button" class="shell-menu-item" onclick="goToGameHub()"><i class="fa-solid fa-house"></i><span>Wybór gier</span></button>
        </div>`;
}

function setupGameHub() {
    ensurePartyjniakStylesheet();
    setupAppShell();

    const main = document.querySelector('main');
    if (!main) return;

    if (!document.getElementById('screen-home')) {
        const home = document.createElement('section');
        home.id = 'screen-home';
        home.className = 'screen home-screen hidden flex-col flex-1';

        const hero = document.createElement('div');
        hero.className = 'home-hero';
        hero.innerHTML = `
            <div class="home-logo-lockup"><img src="./assets/icons/icon.svg" alt="" aria-hidden="true"></div>
            <span class="home-kicker">Gry na jedną kanapę</span>
            <h1 class="home-title">Partyjniak</h1>
            <p class="home-subtitle">Gry imprezowe na jeden telefon. Wybierz tryb, podaj telefon dalej i graj.</p>`;

        const library = document.createElement('div');
        library.className = 'game-library';

        GAME_CATALOG.filter(game => game.status === 'available').forEach(game => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'game-card-primary';
            button.onclick = () => openGame(game.id);
            button.innerHTML = `
                <span class="game-card-icon"><i class="fa-solid ${game.icon}" aria-hidden="true"></i></span>
                <span class="game-card-copy"><strong>${game.name}</strong><span>${game.description}</span></span>
                <span class="game-card-arrow"><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span>`;
            library.appendChild(button);
        });

        const installButton = document.createElement('button');
        installButton.id = 'install-app-btn';
        installButton.type = 'button';
        installButton.className = 'hidden secondary-btn';
        installButton.onclick = promptInstallApp;
        installButton.innerHTML = '<i class="fa-solid fa-mobile-screen-button text-violet-300"></i><span>Zainstaluj Partyjniaka</span>';
        library.appendChild(installButton);

        const upcomingLabel = document.createElement('p');
        upcomingLabel.className = 'upcoming-label';
        upcomingLabel.textContent = 'Następne gry';
        library.appendChild(upcomingLabel);

        const upcomingGrid = document.createElement('div');
        upcomingGrid.className = 'upcoming-grid';
        GAME_CATALOG.filter(game => game.status === 'coming-soon').forEach(game => {
            const card = document.createElement('article');
            card.className = 'upcoming-card';
            card.innerHTML = `<i class="fa-solid ${game.icon}" aria-hidden="true"></i><strong>${game.name}</strong><small>${game.description}</small>`;
            upcomingGrid.appendChild(card);
        });
        library.appendChild(upcomingGrid);

        home.append(hero, library);
        main.prepend(home);
    }

    updateInstallButton();
    document.title = 'Partyjniak – gry imprezowe';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', 'Partyjniak – mobilne gry imprezowe na jeden telefon. Impostor, a wkrótce także Czółko, Tabu i kolejne tryby.');
}

function toggleShellMenu(force) {
    const popover = document.getElementById('shell-menu-popover');
    const button = document.getElementById('shell-more-btn');
    if (!popover || !button) return;
    const shouldOpen = typeof force === 'boolean' ? force : popover.classList.contains('hidden');
    popover.classList.toggle('hidden', !shouldOpen);
    button.setAttribute('aria-expanded', String(shouldOpen));
}

function closeShellMenu() {
    toggleShellMenu(false);
}

function openGame(gameId, { silent = false } = {}) {
    const game = GAME_CATALOG.find(item => item.id === gameId);
    if (!game) return;
    if (game.status !== 'available') {
        showToast('Wkrótce', `${game.name} pojawi się w jednej z kolejnych wersji Partyjniaka.`, 'fa-solid fa-hourglass-half');
        return;
    }
    closeShellMenu();
    if (game.id === 'impostor') goToScreen('menu', { silent });
}
