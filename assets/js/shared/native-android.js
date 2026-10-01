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

function setupNativeAndroidIntegration() {
    if (!isPartyjniakNative()) return;

    document.documentElement.classList.add('partyjniak-native', 'partyjniak-native-android');

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
