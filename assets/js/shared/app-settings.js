const PARTYJNIAK_SETTINGS_KEY = 'partyjniak.settings.v1';
const PARTYJNIAK_DEFAULT_SETTINGS = Object.freeze({
    sound: true,
    backgroundEffects: true,
    haptics: true
});

function readLegacyPartyjniakSoundSetting() {
    try {
        const raw = localStorage.getItem('impostor.session.v2');
        if (!raw) return null;
        const session = JSON.parse(raw);
        return typeof session?.soundEnabled === 'boolean' ? session.soundEnabled : null;
    } catch (_) {
        return null;
    }
}

function loadPartyjniakSettings() {
    try {
        const raw = localStorage.getItem(PARTYJNIAK_SETTINGS_KEY);
        if (raw) {
            const saved = JSON.parse(raw);
            return {
                sound: saved?.sound !== false,
                backgroundEffects: saved?.backgroundEffects !== false,
                haptics: saved?.haptics !== false
            };
        }
    } catch (error) {
        console.warn('Nie udało się odczytać ustawień Partyjniaka:', error);
    }

    const legacySound = readLegacyPartyjniakSoundSetting();
    return {
        ...PARTYJNIAK_DEFAULT_SETTINGS,
        sound: legacySound ?? PARTYJNIAK_DEFAULT_SETTINGS.sound
    };
}

let partyjniakSettings = loadPartyjniakSettings();
let backgroundEffectsEnabled = partyjniakSettings.backgroundEffects;
let hapticsEnabled = partyjniakSettings.haptics;
let partyjniakNativeVibrate = null;

function getPartyjniakSetting(name) {
    return partyjniakSettings[name];
}

function persistPartyjniakSettings() {
    try {
        localStorage.setItem(PARTYJNIAK_SETTINGS_KEY, JSON.stringify(partyjniakSettings));
    } catch (error) {
        console.warn('Nie udało się zapisać ustawień Partyjniaka:', error);
    }
}

function applyPartyjniakBackgroundSetting() {
    const enabled = partyjniakSettings.backgroundEffects !== false;
    backgroundEffectsEnabled = enabled;
    const container = document.getElementById('phaser-bg');
    if (container) {
        container.classList.toggle('background-effects-disabled', !enabled);
        container.setAttribute('aria-hidden', 'true');
    }

    try {
        if (typeof phaserGame !== 'undefined' && phaserGame?.loop) {
            if (enabled) phaserGame.loop.wake?.();
            else phaserGame.loop.sleep?.();
        }
    } catch (_) {}
}

function partyjniakVibrate(pattern) {
    if (!hapticsEnabled || typeof partyjniakNativeVibrate !== 'function') return false;
    try { return partyjniakNativeVibrate(pattern); }
    catch (_) { return false; }
}

function installPartyjniakHapticsGate() {
    if (partyjniakNativeVibrate || typeof navigator?.vibrate !== 'function') return;
    partyjniakNativeVibrate = navigator.vibrate.bind(navigator);
    try {
        Object.defineProperty(navigator, 'vibrate', {
            configurable: true,
            value: pattern => partyjniakVibrate(pattern)
        });
    } catch (_) {
        try { navigator.vibrate = pattern => partyjniakVibrate(pattern); } catch (_) {}
    }
}

function updatePartyjniakSettingSwitch(name, enabled) {
    const control = document.querySelector(`[data-partyjniak-setting="${name}"]`);
    if (!control) return;
    control.classList.toggle('is-on', enabled);
    control.setAttribute('aria-checked', String(enabled));
    const state = control.querySelector('[data-setting-state]');
    if (state) state.textContent = enabled ? 'Włączone' : 'Wyłączone';
}

function syncPartyjniakSettingsUi() {
    updatePartyjniakSettingSwitch('sound', partyjniakSettings.sound !== false);
    updatePartyjniakSettingSwitch('backgroundEffects', partyjniakSettings.backgroundEffects !== false);
    updatePartyjniakSettingSwitch('haptics', partyjniakSettings.haptics !== false);
}

function setPartyjniakSetting(name, value, { feedback = true } = {}) {
    if (!Object.prototype.hasOwnProperty.call(PARTYJNIAK_DEFAULT_SETTINGS, name)) return false;
    const enabled = Boolean(value);
    if (partyjniakSettings[name] === enabled) return enabled;

    partyjniakSettings = { ...partyjniakSettings, [name]: enabled };
    if (name === 'sound' && typeof soundEnabled !== 'undefined') soundEnabled = enabled;
    if (name === 'backgroundEffects') applyPartyjniakBackgroundSetting();
    if (name === 'haptics') hapticsEnabled = enabled;
    persistPartyjniakSettings();
    syncPartyjniakSettingsUi();

    if (name === 'sound') {
        if (enabled && feedback && typeof playSound === 'function') playSound('click');
        if (typeof getActiveGameModule === 'function') callGameHook?.(getActiveGameModule(), 'onAudioChanged', enabled);
    }
    if (name === 'haptics' && enabled && feedback) partyjniakVibrate(20);
    return enabled;
}

function togglePartyjniakSetting(name) {
    return setPartyjniakSetting(name, !getPartyjniakSetting(name));
}

function ensurePartyjniakSettingsModal() {
    if (document.getElementById('settings-modal')) return;
    const root = document.getElementById('modal-root');
    if (!root) return;

    const modal = document.createElement('div');
    modal.className = 'modal hidden';
    modal.id = 'settings-modal';
    modal.innerHTML = `
        <div class="modal-card settings-card" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div class="settings-header">
                <div><span class="settings-kicker">Partyjniak</span><h3 id="settings-modal-title">Ustawienia</h3></div>
                <button class="icon-btn" onclick="closeModal('settings-modal')" type="button" aria-label="Zamknij ustawienia"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
            </div>
            <div class="settings-list">
                <button class="settings-row" type="button" role="switch" data-partyjniak-setting="sound" onclick="togglePartyjniakSetting('sound')">
                    <span class="settings-row-icon"><i class="fa-solid fa-volume-high" aria-hidden="true"></i></span>
                    <span class="settings-row-copy"><strong>Dźwięk</strong><small>Dźwięki interfejsu i rozgrywki</small></span>
                    <span class="settings-control"><span data-setting-state>Włączone</span><span class="settings-switch" aria-hidden="true"><span></span></span></span>
                </button>
                <button class="settings-row" type="button" role="switch" data-partyjniak-setting="backgroundEffects" onclick="togglePartyjniakSetting('backgroundEffects')">
                    <span class="settings-row-icon"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span>
                    <span class="settings-row-copy"><strong>Efekty tła</strong><small>Animacje Phaser — wyłącz na starszym telefonie</small></span>
                    <span class="settings-control"><span data-setting-state>Włączone</span><span class="settings-switch" aria-hidden="true"><span></span></span></span>
                </button>
                <button class="settings-row" type="button" role="switch" data-partyjniak-setting="haptics" onclick="togglePartyjniakSetting('haptics')">
                    <span class="settings-row-icon"><i class="fa-solid fa-mobile-screen-button" aria-hidden="true"></i></span>
                    <span class="settings-row-copy"><strong>Wibracje</strong><small>Haptyczny feedback w obsługiwanych grach</small></span>
                    <span class="settings-control"><span data-setting-state>Włączone</span><span class="settings-switch" aria-hidden="true"><span></span></span></span>
                </button>
            </div>
            <section class="settings-about" aria-labelledby="settings-about-title">
                <div class="settings-about-copy"><span class="settings-kicker">O aplikacji</span><h4 id="settings-about-title">Stworzone przez Swawole Studio</h4><p>Partyjniak to kolekcja gier imprezowych na jeden telefon.</p></div>
                <a class="settings-author-link" href="https://swawole.studio" target="_blank" rel="noopener noreferrer" aria-label="Otwórz stronę Swawole Studio">
                    <img src="./assets/brand/swawole-studio.svg" alt="Swawole Studio">
                    <span>swawole.studio <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></span>
                </a>
            </section>
        </div>`;
    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal('settings-modal');
    });
    root.appendChild(modal);
}

function ensurePartyjniakSettingsMenuAction() {
    const popover = document.getElementById('shell-menu-popover');
    if (!popover || document.getElementById('shell-settings-action')) return;

    popover.querySelector('#audio-icon')?.closest('button')?.remove();
    [...popover.querySelectorAll('button')]
        .find(button => button.getAttribute('onclick')?.includes("about-modal"))
        ?.remove();

    const action = document.createElement('button');
    action.id = 'shell-settings-action';
    action.type = 'button';
    action.className = 'shell-menu-item';
    action.onclick = openPartyjniakSettings;
    action.innerHTML = '<i class="fa-solid fa-gear" aria-hidden="true"></i><span>Ustawienia</span>';
    popover.prepend(action);
}

function ensurePartyjniakHomeSettingsButton() {
    const home = document.getElementById('screen-home');
    if (!home || document.getElementById('home-settings-btn')) return;
    const button = document.createElement('button');
    button.id = 'home-settings-btn';
    button.type = 'button';
    button.className = 'home-settings-button';
    button.setAttribute('aria-label', 'Ustawienia Partyjniaka');
    button.onclick = openPartyjniakSettings;
    button.innerHTML = '<i class="fa-solid fa-gear" aria-hidden="true"></i>';
    home.prepend(button);
}

function openPartyjniakSettings() {
    closeShellMenu?.();
    ensurePartyjniakSettingsModal();
    syncPartyjniakSettingsUi();
    openModal?.('settings-modal');
}

function initializePartyjniakSettingsUi() {
    installPartyjniakHapticsGate();
    if (typeof soundEnabled !== 'undefined') soundEnabled = partyjniakSettings.sound !== false;
    hapticsEnabled = partyjniakSettings.haptics !== false;
    ensurePartyjniakSettingsModal();
    ensurePartyjniakSettingsMenuAction();
    ensurePartyjniakHomeSettingsButton();
    syncPartyjniakSettingsUi();
    applyPartyjniakBackgroundSetting();
}

window.addEventListener('load', () => setTimeout(applyPartyjniakBackgroundSetting, 0), { once: true });
