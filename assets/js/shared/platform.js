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

async function requestScreenWakeLock() {
    wakeLockDesired = true;

    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return false;
    if (wakeLockSentinel && !wakeLockSentinel.released) return true;

    try {
        const sentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel = sentinel;
        sentinel.addEventListener('release', () => {
            if (wakeLockSentinel === sentinel) wakeLockSentinel = null;
        }, { once: true });
        return true;
    } catch (error) {
        console.warn('Screen Wake Lock nie został przyznany:', error);
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
});

document.addEventListener('pointerdown', () => {
    if (wakeLockDesired && (!wakeLockSentinel || wakeLockSentinel.released)) {
        requestScreenWakeLock();
    }
}, { passive: true });
