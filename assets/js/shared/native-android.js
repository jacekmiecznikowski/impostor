function isPartyjniakNative() {
    try {
        return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch (_) {
        return false;
    }
}

if (isPartyjniakNative()) {
    document.documentElement.classList.add('partyjniak-native', 'partyjniak-native-android');
}

// Returns true only if the dedicated native vibration motor bridge accepted the call.
// Repeated pulses are generated on the Android side, not with JavaScript timers.
function startPartyjniakRevealHaptics() {
    if (!isPartyjniakNative()) return false;
    if (typeof getPartyjniakSetting === 'function' && getPartyjniakSetting('haptics') === false) return true;
    const motor = window.Capacitor?.Plugins?.PartyjniakHaptics;
    if (typeof motor?.startHold !== 'function') return false;
    try {
        motor.startHold().catch?.(error => console.warn('Nie udało się uruchomić natywnej wibracji karty.', error));
        return true;
    } catch (error) {
        console.warn('Nie udało się uruchomić natywnej wibracji karty.', error);
        return false;
    }
}

function stopPartyjniakRevealHaptics() {
    if (!isPartyjniakNative()) return;
    const motor = window.Capacitor?.Plugins?.PartyjniakHaptics;
    if (typeof motor?.stopHold !== 'function') return;
    try {
        motor.stopHold().catch?.(error => console.warn('Nie udało się zatrzymać natywnej wibracji karty.', error));
    } catch (error) {
        console.warn('Nie udało się zatrzymać natywnej wibracji karty.', error);
    }
}

// Android MediaPlayer plays the unmodified MP3 uploaded to the repository.
function playPartyjniakNativeOutcome(outcome) {
    if (!isPartyjniakNative()) return false;
    const audio = window.Capacitor?.Plugins?.PartyjniakApplause;
    if (typeof audio?.play !== 'function') return false;
    try {
        audio.play({ outcome }).catch?.(error => {
            console.warn('Natywne odtwarzanie dźwięku zwycięstwa nie powiodło się.', error);
            // Fallback always uses that same original MP3, never synthesized audio.
            playRecordedOutcome?.(outcome);
        });
        return true;
    } catch (error) {
        console.warn('Natywne odtwarzanie dźwięku zwycięstwa nie powiodło się.', error);
        return false;
    }
}

async function setPartyjniakOrientation(mode = 'portrait') {
    const target = mode === 'landscape' ? 'landscape' : 'portrait';
    document.documentElement.dataset.partyjniakOrientation = target;

    if (isPartyjniakNative()) {
        try {
            const orientation = window.Capacitor?.Plugins?.PartyjniakOrientation;
            const method = target === 'landscape' ? 'lockLandscape' : 'lockPortrait';
            if (typeof orientation?.[method] === 'function') {
                await orientation[method]();
                return true;
            }
        } catch (error) {
            console.warn('Nie udało się zmienić orientacji natywnej.', error);
        }
    }

    try {
        if (screen.orientation?.lock) {
            await screen.orientation.lock(target);
            return true;
        }
    } catch (_) {}
    return false;
}

function syncPartyjniakScreenOrientation(screenName) {
    const config = typeof getScreenUiConfig === 'function' ? getScreenUiConfig(screenName) : null;
    const mode = config?.orientation === 'landscape' ? 'landscape' : 'portrait';
    return setPartyjniakOrientation(mode);
}

function setupNativeAndroidIntegration() {
    if (!isPartyjniakNative()) return;

    document.documentElement.classList.add('partyjniak-native', 'partyjniak-native-android');
    setPartyjniakOrientation('portrait');

    const nativeApp = window.Capacitor?.Plugins?.App;
    if (!nativeApp?.addListener) return;

    nativeApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return;
        const screenName = typeof getCurrentScreenName === 'function' ? getCurrentScreenName() : 'home';
        const screenConfig = typeof getScreenUiConfig === 'function' ? getScreenUiConfig(screenName) : null;
        if (!screenConfig?.roundGuard) closeNavigationSheet?.();
        syncPartyjniakScreenOrientation?.(screenName);
    }).catch?.(error => {
        console.warn('Nie udało się podpiąć obsługi wznowienia aplikacji.', error);
    });

    nativeApp.addListener('backButton', () => {
        const handled = typeof navigateBack === 'function'
            ? navigateBack({ fromSystem: true })
            : false;

        if (!handled && typeof getCurrentScreenName === 'function' && getCurrentScreenName() === 'home') {
            nativeApp.exitApp?.();
        }
    }).catch?.(error => {
        console.warn('Nie udało się podpiąć natywnego przycisku Wstecz.', error);
    });
}
