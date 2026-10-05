const INTERRUPTED_GAME_STORAGE_KEY = 'partyjniak.interrupted-game.v1';
const INTERRUPTED_GAME_TTL_MS = 6 * 60 * 60 * 1000;
let gameMenuRecoveryObserver = null;
let roundExitRecoveryInstalled = false;

function readInterruptedGame() {
    try {
        const raw = localStorage.getItem(INTERRUPTED_GAME_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const gameId = String(parsed?.gameId || '');
        const interruptedAt = Number(parsed?.interruptedAt) || 0;
        if (!gameId || !interruptedAt || Date.now() - interruptedAt > INTERRUPTED_GAME_TTL_MS) {
            localStorage.removeItem(INTERRUPTED_GAME_STORAGE_KEY);
            return null;
        }
        return { gameId, interruptedAt };
    } catch (_) {
        return null;
    }
}

function clearInterruptedGame(gameId = null) {
    try {
        if (gameId) {
            const current = readInterruptedGame();
            if (current?.gameId !== gameId) return;
        }
        localStorage.removeItem(INTERRUPTED_GAME_STORAGE_KEY);
    } catch (_) {}
    renderInterruptedGameCard();
}

function rememberInterruptedGame(gameId) {
    if (!gameId || gameId === 'home') return;
    try {
        localStorage.setItem(INTERRUPTED_GAME_STORAGE_KEY, JSON.stringify({
            gameId,
            interruptedAt: Date.now()
        }));
    } catch (_) {}
    renderInterruptedGameCard();
}

function extractGameMenuKicker(screen) {
    const title = screen?.querySelector('h1');
    const hero = title?.parentElement;
    if (!hero) return 'Gra imprezowa';
    const candidate = [...hero.children].find(element => {
        if (element === title) return false;
        const tagName = element.tagName?.toLowerCase();
        return (tagName === 'span' || tagName === 'p') && String(element.textContent || '').trim();
    });
    return String(candidate?.textContent || 'Gra imprezowa').trim();
}

function findMenuAction(screen, pattern) {
    return [...screen.querySelectorAll('button')].find(button => pattern.test(button.getAttribute('onclick') || '')) || null;
}

function standardizeGameMenu(gameModule) {
    if (!gameModule?.menuScreen || !gameModule.catalog) return false;
    const screen = document.getElementById(`screen-${gameModule.menuScreen}`);
    if (!screen || screen.dataset.partyjniakGameMenu === 'true') return Boolean(screen);

    const startButton = findMenuAction(screen, /startNew/i);
    const resumeButton = findMenuAction(screen, /resume/i);
    const startAction = startButton?.onclick;
    const resumeAction = resumeButton?.onclick;
    if (typeof startAction !== 'function') {
        console.warn(`Nie znaleziono akcji Nowa gra dla ${gameModule.id}.`);
        return false;
    }

    const kickerText = extractGameMenuKicker(screen);
    const hero = document.createElement('div');
    hero.className = 'game-menu-hero';

    const kicker = document.createElement('span');
    kicker.className = 'game-menu-kicker';
    kicker.textContent = kickerText;

    const icon = document.createElement('div');
    icon.className = 'game-menu-icon';
    icon.setAttribute('aria-hidden', 'true');
    const iconGlyph = document.createElement('i');
    iconGlyph.className = `fa-solid ${gameModule.catalog.icon || gameModule.shellIcon || 'fa-gamepad'}`;
    icon.appendChild(iconGlyph);

    const title = document.createElement('h1');
    title.className = 'game-menu-title';
    title.textContent = gameModule.catalog.name;

    const description = document.createElement('p');
    description.className = 'game-menu-description';
    description.textContent = gameModule.catalog.description;

    hero.append(kicker, icon, title, description);

    const actions = document.createElement('div');
    actions.className = 'game-menu-actions';

    const newGameButton = document.createElement('button');
    newGameButton.type = 'button';
    newGameButton.className = 'game-menu-primary';
    newGameButton.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i><span>Nowa gra</span>';
    newGameButton.addEventListener('click', event => {
        clearInterruptedGame();
        startAction.call(startButton, event);
    });

    const rulesButton = document.createElement('button');
    rulesButton.type = 'button';
    rulesButton.className = 'game-menu-rules';
    rulesButton.innerHTML = '<i class="fa-solid fa-book-open" aria-hidden="true"></i><span>Zasady</span>';
    rulesButton.addEventListener('click', () => window.openCurrentRules?.());

    actions.append(newGameButton, rulesButton);
    screen.replaceChildren(hero, actions);
    screen.className = 'screen hidden flex-col flex-1 game-menu-screen';
    screen.dataset.partyjniakGameMenu = 'true';

    gameModule.resumeInterrupted = typeof resumeAction === 'function'
        ? () => resumeAction.call(resumeButton, new Event('click'))
        : null;

    return true;
}

function ensureInterruptedGameCard() {
    const home = document.getElementById('screen-home');
    if (!home) return null;
    const existing = document.getElementById('interrupted-game-card');
    if (existing) return existing;

    const card = document.createElement('section');
    card.id = 'interrupted-game-card';
    card.className = 'interrupted-game-card hidden';
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = `
        <span class="interrupted-game-icon" aria-hidden="true"><i class="fa-solid fa-gamepad"></i></span>
        <span class="interrupted-game-copy"><span>Przerwana partia</span><strong data-recovery-game>Gra</strong><small>Możesz wrócić do ostatniego stanu.</small></span>
        <button type="button" class="interrupted-game-resume"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>Wróć do gry</span></button>`;
    card.querySelector('.interrupted-game-resume')?.addEventListener('click', resumeInterruptedGame);

    const library = home.querySelector('.game-library');
    if (library) library.before(card);
    else home.appendChild(card);
    return card;
}

function renderInterruptedGameCard() {
    const card = ensureInterruptedGameCard();
    if (!card) return;

    const interrupted = readInterruptedGame();
    const gameModule = interrupted ? window.getGameModule?.(interrupted.gameId) : null;
    if (!interrupted || !gameModule?.catalog || gameModule.catalog.status !== 'available') {
        card.classList.add('hidden');
        return;
    }

    const palette = gameModule.theme?.palette || {};
    card.style.setProperty('--recovery-accent', palette.accent || '#8b5cf6');
    card.style.setProperty('--recovery-text', palette.text || '#c4b5fd');
    card.style.setProperty('--recovery-rgb', palette.rgb || '139, 92, 246');

    const icon = card.querySelector('.interrupted-game-icon i');
    if (icon) icon.className = `fa-solid ${gameModule.catalog.icon || gameModule.shellIcon || 'fa-gamepad'}`;
    const name = card.querySelector('[data-recovery-game]');
    if (name) name.textContent = gameModule.catalog.name;
    card.classList.remove('hidden');
}

async function resumeInterruptedGame() {
    const interrupted = readInterruptedGame();
    if (!interrupted) {
        renderInterruptedGameCard();
        return;
    }

    const card = ensureInterruptedGameCard();
    const button = card?.querySelector('.interrupted-game-resume');
    if (button) button.disabled = true;

    try {
        await window.openGame?.(interrupted.gameId, { silent: true });
        const gameModule = window.getGameModule?.(interrupted.gameId);
        const canResume = Boolean(gameModule?.session?.hasResume?.());
        if (!canResume || typeof gameModule?.resumeInterrupted !== 'function') {
            clearInterruptedGame(interrupted.gameId);
            window.goToScreen?.('home', { direction: 'back' });
            window.showToast?.('Przerwana partia', 'Nie udało się odnaleźć stanu tej partii. Rozpocznij nową grę.');
            return;
        }

        gameModule.resumeInterrupted();
        clearInterruptedGame(interrupted.gameId);
    } catch (error) {
        console.error('Nie udało się wznowić przerwanej partii:', error);
        window.showToast?.('Przerwana partia', 'Nie udało się wrócić do gry. Spróbuj ponownie.');
    } finally {
        if (button) button.disabled = false;
    }
}

function syncGameMenuShellActions() {
    const screenName = document.body?.dataset?.screen || 'home';
    const gameId = window.getGameIdForScreen?.(screenName);
    const gameModule = gameId && gameId !== 'home' ? window.getGameModule?.(gameId) : null;
    if (!gameModule || screenName !== gameModule.menuScreen) return;
    document.getElementById('shell-score-action')?.classList.add('hidden');
    document.getElementById('shell-rules-action')?.classList.add('hidden');
}

function installRoundExitRecovery() {
    if (roundExitRecoveryInstalled || typeof window.leaveActiveRound !== 'function') return;
    const originalLeaveActiveRound = window.leaveActiveRound;
    const wrappedLeaveActiveRound = function (...args) {
        const gameModule = window.getActiveGameModule?.();
        if (gameModule && window.isRoundInProgress?.()) rememberInterruptedGame(gameModule.id);
        return originalLeaveActiveRound.apply(this, args);
    };
    wrappedLeaveActiveRound.__partyjniakRecoveryWrapped = true;
    window.leaveActiveRound = wrappedLeaveActiveRound;
    roundExitRecoveryInstalled = true;
}

function setupGameMenuRecovery() {
    ensureInterruptedGameCard();
    renderInterruptedGameCard();
    installRoundExitRecovery();
    syncGameMenuShellActions();

    if (!gameMenuRecoveryObserver && document.body) {
        gameMenuRecoveryObserver = new MutationObserver(() => {
            if (document.body.dataset.screen === 'home') renderInterruptedGameCard();
            syncGameMenuShellActions();
        });
        gameMenuRecoveryObserver.observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
    }
}

Object.assign(window, {
    standardizeGameMenu,
    setupGameMenuRecovery,
    rememberInterruptedGame,
    clearInterruptedGame,
    renderInterruptedGameCard,
    resumeInterruptedGame
});
