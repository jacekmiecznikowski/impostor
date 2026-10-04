# Partyjniak – gry imprezowe

**Partyjniak** to mobilna aplikacja webowa/PWA z grami imprezowymi na jeden telefon. Aktualna wersja zawiera osiem pełnych trybów: **Impostor**, **Tykająca Bomba**, **Naokoło**, **Co mam na myśli?**, **Trzy w Pięć**, **Synchronizacja**, **Trzy Rundy** i **Dzika Karta**.

## Uruchomienie lokalne

Wymagany jest Node 22+.

```bash
npm ci
npm run serve
```

`npm run serve` buduje lokalne assety runtime (Tailwind, Phaser, Font Awesome i Inter), a następnie uruchamia serwer na `http://localhost:8080`.

Nie uruchamiaj aplikacji przez `file://`, ponieważ Service Worker i część API przeglądarki wymagają HTTP/HTTPS.

## Testy

Szybki zestaw testów domenowych i kontraktowych:

```bash
npm test
```

Mobilne smoke testy w prawdziwym Chromium:

```bash
npx playwright install chromium
npm run test:e2e
```

Pull requesty do `main` uruchamiają oba poziomy walidacji oraz test produkcyjnego bundla webowego w `.github/workflows/ci.yml`.

## Android APK

Repozytorium zawiera konfigurację **Capacitor 8** oraz workflow `.github/workflows/android-apk.yml`. Każdy push na `main` uruchamia testy, przygotowanie web bundle i build debug APK. Artefakt ma nazwę:

```text
partyjniak-debug-apk
└── app-debug.apk
```

Identyfikator pakietu:

```text
pl.partyjniak.app
```

W wersji Android:

- ekran jest utrzymywany aktywny natywnie przez `FLAG_KEEP_SCREEN_ON`,
- sprzętowy/gestowy przycisk **Wstecz** korzysta z `@capacitor/app`,
- domyślna orientacja jest pionowa, a gry wymagające landscape mogą przełączać ją przez natywny plugin,
- Service Worker jest wyłączony wewnątrz natywnego wrappera,
- wszystkie biblioteki runtime są lokalne — APK nie wymaga CDN do pierwszego uruchomienia.

Do lokalnego builda potrzebne są Node 22+, JDK 21 oraz Android SDK:

```bash
npm ci
npm run build:web
npx cap add android
npx cap sync android
node scripts/patch-android.mjs
cd android
./gradlew assembleDebug
```

Gotowy plik znajdziesz w `android/app/build/outputs/apk/debug/app-debug.apk`.

## Architektura

Każda gra jest samodzielnym modułem. `integration.js` opisuje kontrakt z shellem, a `bootstrap.js` deklaruje assety ładowane dopiero przy wejściu do gry.

```text
assets/js/
├── app.js
├── shared/
│   ├── asset-loader.js
│   ├── view-loader.js
│   ├── game-registry.js
│   ├── app-settings.js
│   ├── audio.js
│   ├── background.js
│   ├── content-repository.js
│   ├── hub.js
│   ├── native-android.js
│   ├── platform.js
│   └── ui.js
└── games/
    ├── index.js
    └── <game-id>/
        ├── bootstrap.js
        ├── integration.js
        ├── content-provider.js
        ├── rules.js
        ├── state.js
        ├── setup.js
        ├── game.js
        └── scoreboard.js
```

Start aplikacji ładuje tylko shell/shared. Po wybraniu gry Partyjniak kolejno ładuje jej CSS/JS, widoki, inicjalizuje content i odtwarza sesję. Service Worker nadal precache'uje komplet lokalnych zasobów, więc lazy loading nie ogranicza działania offline.

Rejestr gier pilnuje unikalności ID modułów i nazw ekranów. Czyste `rules.js` pozostają niezależne od DOM i są testowane bez przeglądarki.

Szczegółowy kontrakt dodawania nowej gry opisuje `docs/adding-a-game.md`.

## Treści

Gry z większymi bazami korzystają z plików w `content/` i lokalnych fallbacków. Impostor dodatkowo obsługuje opcjonalne zdalne źródło przez `ContentRepository` pod adresem:

```text
<BASE_URL>/impostor.pl.json
```

Jeśli zdalne API jest niedostępne albo zwróci błędne dane, używany jest cache lub lokalny fallback.

## PWA i offline

- manifest z ikonami 192/512 i maskable,
- tryb `standalone`,
- `safe-area` i `100dvh`,
- Service Worker z cache lokalnych zasobów,
- Screen Wake Lock podczas aktywnych rund,
- lokalne Tailwind CSS, Phaser, Font Awesome i Inter generowane przez `scripts/build-assets.mjs`,
- vendor precache generowany automatycznie do `assets/vendor/precache.json`.

`assets/vendor/`, `dist/` i `android/` są artefaktami builda i nie są commitowane.
