let deferredInstallPrompt = null;
let wakeLockSentinel = null;
let wakeLockDesired = false;

function isStandaloneApp() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function updateInstallButton() {
    const button = document.getElementById('install-app-btn');
    if (!button) return;
    const canPrompt = Boolean(deferredInstallPrompt) && !isStandaloneApp();
    button.classList.toggle('hidden', !canPrompt);
    button.classList.toggle('flex', canPrompt);
}

async function promptInstallApp() {
    if (!deferredInstallPrompt) return;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    updateInstallButton();

    try {
        await promptEvent.prompt();
        await promptEvent.userChoice;
    } catch (error) {
        console.warn('Nie udało się wyświetlić instalacji PWA:', error);
    }
}

function ensureAwakeModeNote() {
    const menu = document.getElementById('screen-menu');
    if (!menu || document.getElementById('awake-mode-note')) return;

    const actions = menu.querySelector('.w-full.max-w-xs');
    if (!actions) return;

    const note = document.createElement('div');
    note.id = 'awake-mode-note';
    note.className = 'awake-note';
    note.innerHTML = '<i class="fa-solid fa-sun"></i><span>Podczas gry ekran pozostanie włączony.</span>';
    actions.parentNode.insertBefore(note, actions);
}

function updateAwakeModeNote(status) {
    const note = document.getElementById('awake-mode-note');
    if (!note) return;

    note.classList.remove('is-active', 'is-warning');
    const icon = note.querySelector('i');
    const text = note.querySelector('span');

    if (status === 'active') {
        note.classList.add('is-active');
        if (icon) icon.className = 'fa-solid fa-sun';
        if (text) text.textContent = 'Ekran pozostanie włączony podczas gry.';
    } else if (status === 'paused') {
        if (icon) icon.className = 'fa-solid fa-pause';
        if (text) text.textContent = 'Blokada ekranu wznowi się po powrocie do gry.';
    } else if (status === 'unsupported') {
        note.classList.add('is-warning');
        if (icon) icon.className = 'fa-solid fa-triangle-exclamation';
        if (text) text.textContent = 'Ta przeglądarka nie pozwala zablokować wygaszania ekranu.';
    } else if (status === 'failed') {
        note.classList.add('is-warning');
        if (icon) icon.className = 'fa-solid fa-battery-quarter';
        if (text) text.textContent = 'Telefon nie zezwolił teraz na utrzymanie włączonego ekranu.';
    } else {
        if (icon) icon.className = 'fa-solid fa-sun';
        if (text) text.textContent = 'Podczas gry ekran pozostanie włączony.';
    }
}

async function requestScreenWakeLock() {
    wakeLockDesired = true;

    if (!('wakeLock' in navigator)) {
        updateAwakeModeNote('unsupported');
        return false;
    }

    if (document.visibilityState !== 'visible') {
        updateAwakeModeNote('paused');
        return false;
    }

    if (wakeLockSentinel && !wakeLockSentinel.released) {
        updateAwakeModeNote('active');
        return true;
    }

    try {
        const sentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel = sentinel;
        updateAwakeModeNote('active');

        sentinel.addEventListener('release', () => {
            if (wakeLockSentinel === sentinel) wakeLockSentinel = null;
            updateAwakeModeNote(wakeLockDesired ? 'paused' : 'off');
        }, { once: true });

        return true;
    } catch (error) {
        console.warn('Screen Wake Lock nie został przyznany:', error);
        updateAwakeModeNote('failed');
        return false;
    }
}

async function releaseScreenWakeLock() {
    wakeLockDesired = false;
    const sentinel = wakeLockSentinel;
    wakeLockSentinel = null;

    if (sentinel && !sentinel.released) {
        try {
            await sentinel.release();
        } catch (error) {
            console.warn('Nie udało się zwolnić Screen Wake Lock:', error);
        }
    }

    updateAwakeModeNote('off');
}

function setGameAwakeMode(active) {
    if (active) requestScreenWakeLock();
    else releaseScreenWakeLock();
}

window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
});

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    updateInstallButton();
});

document.addEventListener('visibilitychange', () => {
    if (!wakeLockDesired) return;

    if (document.visibilityState === 'visible') requestScreenWakeLock();
    else updateAwakeModeNote('paused');
});

document.addEventListener('pointerdown', () => {
    if (wakeLockDesired && (!wakeLockSentinel || wakeLockSentinel.released)) {
        requestScreenWakeLock();
    }
}, { passive: true });
