const GAME_CATALOG = [
    {
        id: 'impostor',
        name: 'Impostor',
        description: 'Dedukcja, blef i szukanie osoby, która nie zna hasła.',
        icon: 'fa-user-secret',
        status: 'available',
        accent: 'teal'
    },
    {
        id: 'heads-up',
        name: 'Czółko',
        description: 'Zgaduj hasło na podstawie podpowiedzi znajomych.',
        icon: 'fa-face-grin-stars',
        status: 'coming-soon',
        accent: 'violet'
    },
    {
        id: 'taboo',
        name: 'Tabu',
        description: 'Opisuj hasła bez używania zakazanych słów.',
        icon: 'fa-comment-slash',
        status: 'coming-soon',
        accent: 'rose'
    }
];

function setupGameHub() {
    const main = document.querySelector('main');
    if (!main) return;

    if (!document.getElementById('screen-home')) {
        const home = document.createElement('section');
        home.id = 'screen-home';
        home.className = 'screen hidden flex-col flex-1 py-6 gap-6';

        const hero = document.createElement('div');
        hero.className = 'text-center space-y-3 pt-4';
        hero.innerHTML = `
            <span class="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-fuchsia-300">
                <i class="fa-solid fa-dice"></i> Party Games
            </span>
            <h1 class="text-3xl md:text-4xl font-black text-white">W co dzisiaj gramy?</h1>
            <p class="text-sm text-slate-400 max-w-sm mx-auto">Wybierz grę dla ekipy. Kolejne tryby będziemy dodawać w tym samym miejscu.</p>
        `;

        const gamesGrid = document.createElement('div');
        gamesGrid.className = 'space-y-3';

        GAME_CATALOG.forEach(game => {
            if (game.status === 'available') {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'w-full text-left rounded-3xl border border-teal-500/35 bg-gradient-to-br from-teal-950/80 via-slate-900/95 to-slate-950 p-5 shadow-xl shadow-teal-950/30 transition-all hover:border-teal-400/60 hover:-translate-y-0.5 active:scale-[0.99]';
                button.onclick = () => openGame(game.id);
                button.innerHTML = `
                    <div class="flex items-start gap-4">
                        <span class="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-tr from-teal-600 via-cyan-600 to-emerald-500 flex items-center justify-center text-2xl text-white shadow-lg shadow-teal-500/20">
                            <i class="fa-solid ${game.icon}"></i>
                        </span>
                        <span class="flex-1 min-w-0">
                            <span class="flex items-center justify-between gap-3">
                                <strong class="text-xl text-white">${game.name}</strong>
                                <span class="pill">Graj</span>
                            </span>
                            <span class="block text-xs text-slate-400 leading-relaxed mt-2">${game.description}</span>
                            <span class="flex flex-wrap gap-2 mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                <span class="rounded-lg bg-slate-950/80 border border-slate-800 px-2 py-1">3–12 osób</span>
                                <span class="rounded-lg bg-slate-950/80 border border-slate-800 px-2 py-1">Dedukcja</span>
                                <span class="rounded-lg bg-slate-950/80 border border-slate-800 px-2 py-1">1 telefon</span>
                            </span>
                        </span>
                    </div>
                `;
                gamesGrid.appendChild(button);
            }
        });

        const comingSoon = document.createElement('div');
        comingSoon.className = 'grid grid-cols-2 gap-3';
        GAME_CATALOG.filter(game => game.status === 'coming-soon').forEach(game => {
            const card = document.createElement('article');
            card.className = 'rounded-2xl border border-slate-800/80 bg-slate-900/65 p-4 opacity-80';
            card.innerHTML = `
                <div class="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <i class="fa-solid ${game.icon}"></i>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <strong class="text-sm text-slate-200">${game.name}</strong>
                    <span class="text-[9px] uppercase tracking-widest font-black text-slate-500">Wkrótce</span>
                </div>
                <p class="text-[11px] leading-relaxed text-slate-500 mt-2">${game.description}</p>
            `;
            comingSoon.appendChild(card);
        });

        const upcomingLabel = document.createElement('div');
        upcomingLabel.className = 'pt-2';
        upcomingLabel.innerHTML = '<p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Następne gry</p>';
        upcomingLabel.appendChild(comingSoon);
        gamesGrid.appendChild(upcomingLabel);

        home.appendChild(hero);
        home.appendChild(gamesGrid);
        main.prepend(home);
    }

    const header = document.querySelector('header');
    const brandButton = header?.querySelector('button');
    if (brandButton) {
        brandButton.onclick = goToGameHub;

        const logo = brandButton.querySelector('span:first-child');
        if (logo) logo.id = 'shell-logo';

        const label = brandButton.querySelector('span:nth-child(2)');
        if (label) {
            const title = label.querySelector('strong');
            const subtitle = label.querySelector('small');
            if (title) title.id = 'shell-title';
            if (subtitle) subtitle.id = 'shell-subtitle';
        }
    }

    const toolbar = header?.querySelector(':scope > div');
    if (toolbar) toolbar.id = 'game-toolbar';

    document.title = 'Party Games - Gry imprezowe';
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', 'Mobilna kolekcja gier imprezowych. Zagraj w Impostora i kolejne gry party.');
}

function openGame(gameId) {
    const game = GAME_CATALOG.find(item => item.id === gameId);
    if (!game) return;

    if (game.status !== 'available') {
        showToast('Wkrótce', `${game.name} pojawi się w jednej z kolejnych wersji.`, 'fa-solid fa-hourglass-half');
        return;
    }

    if (game.id === 'impostor') {
        goToScreen('menu');
    }
}

function initializeApp() {
    setupGameHub();
    loadSession();

    const slider = document.getElementById('player-slider');
    const playerCount = document.getElementById('player-count-big');
    if (slider) slider.value = state.playerCount;
    if (playerCount) playerCount.innerText = state.playerCount;

    const audioIcon = document.getElementById('audio-icon');
    if (audioIcon) audioIcon.className = soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';

    updateHintModeUI();
    setDiscussionTimer(state.discussionTime, { silent: true });
    updateImpostorButtonsUI();
    updateResumeButton();

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            document.querySelectorAll('[id$="-modal"].flex').forEach(modal => closeModal(modal.id));
        }
    });

    document.querySelectorAll('[id$="-modal"]').forEach(modal => {
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal(modal.id);
        });
    });

    goToScreen('home', { silent: true });

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').catch(error => {
                console.warn('Service Worker nie został zarejestrowany:', error);
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
