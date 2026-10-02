import { getGameModule, registerGameModule } from '../../shared/game-registry.js?v=2';

export function registerTickingBombGame() {
    const existing = getGameModule('ticking-bomb');
    if (existing) return existing;

    return registerGameModule({
        id: 'ticking-bomb',
        catalog: {
            name: 'Tykająca Bomba',
            description: 'Szybkie odpowiedzi, ukryty lont i telefon, którego nikt nie chce trzymać przy BOOM.',
            icon: 'fa-bomb',
            status: 'available',
            order: 20
        },
        views: [
            { target: '#app-main', url: './views/ticking-bomb.html' },
            { target: '#modal-root', url: './views/ticking-bomb-modals.html' }
        ],
        screens: {
            'bomb-menu': {
                backTarget: 'home',
                shell: { title: 'Tykająca Bomba', subtitle: 'Menu gry', mode: 'menu' },
                background: 'ticking-bomb'
            },
            'bomb-players': {
                backTarget: 'bomb-menu',
                shell: { title: 'Gracze', subtitle: 'Tykająca Bomba • krok 1 z 2', mode: 'contextual' },
                background: 'ticking-bomb'
            },
            'bomb-options': {
                backTarget: 'bomb-players',
                shell: { title: 'Ustawienia rundy', subtitle: 'Tykająca Bomba • krok 2 z 2', mode: 'contextual' },
                background: 'ticking-bomb'
            },
            'bomb-play': {
                shell: { title: 'Tykająca Bomba', subtitle: 'Runda trwa', mode: 'immersive' },
                background: 'ticking-bomb', immersive: true, roundGuard: true, wakeLock: true
            },
            'bomb-result': {
                backTarget: 'bomb-menu',
                shell: { title: 'Tykająca Bomba', subtitle: 'Wynik rundy', mode: 'contextual' },
                background: 'bomb-alert'
            }
        },
        menuScreen: 'bomb-menu',
        shellIcon: 'fa-bomb',
        rulesModalId: 'bomb-rules-modal',
        shellLabels: {
            rules: 'Zasady Tykającej Bomby',
            menu: 'Menu Tykającej Bomby'
        },
        session: {
            load: () => loadBombSession(),
            save: () => persistBombSession(),
            reset: () => resetBombSession(),
            hasResume: () => bombState.hasSavedSession && bombState.players.length >= 2,
            getPlayers: () => bombState.players,
            syncUi() {
                updateBombResumeButton();
            }
        },
        open({ silent = false } = {}) {
            openBombGameMenu({ silent });
        },
        onScreenLeave(previousScreen, nextScreen) {
            if (previousScreen === 'bomb-result' && nextScreen !== 'bomb-result') {
                stopAllBombAudio?.();
            }
        },
        beforeLeave() {
            if (getCurrentScreenName() !== 'bomb-play') stopAllBombAudio?.();
        },
        leaveRound(destination) {
            cancelBombRound({ silent: true });
            stopAllBombAudio?.();
            resetBombRoundState();
            closeNavigationSheet();
            setGameAwakeMode?.(false);
            goToScreen(destination === 'home' ? 'home' : 'bomb-menu', { direction: 'back' });
        },
        renderScoreboard() {
            renderBombScoreboardModal();
        },
        resetScoreboard() {
            resetBombScores();
        },
        onAudioChanged(enabled) {
            if (!enabled) {
                stopAllBombAudio?.();
            } else if (getCurrentScreenName() === 'bomb-play' && bombRuntime?.active) {
                startBombTicking?.();
            }
        }
    });
}
