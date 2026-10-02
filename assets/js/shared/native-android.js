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
