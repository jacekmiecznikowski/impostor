function isPartyjniakNative() {
    try {
        return Boolean(window.Capacitor?.isNativePlatform?.());
    } catch (_) {
        return false;
    }
}

function setupNativeAndroidIntegration() {
    if (!isPartyjniakNative()) return;

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
