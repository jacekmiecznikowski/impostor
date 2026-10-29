# Partyjniak – gry imprezowe

**Partyjniak** to mobilna aplikacja webowa/PWA z grami imprezowymi na jeden telefon. Aktualna wersja zawiera siedem pełnych trybów: **Impostor**, **Tykająca Bomba**, **Naokoło**, **Co mam na myśli?**, **Trzy w Pięć**, **Synchronizacja** i **Dzika Karta**.

## Content Studio (Supabase)

Projekt zawiera również **panel webowy do zarządzania treścią wszystkich siedmiu gier** — `admin/`. Umożliwia edycję kategorii, kart, haseł, pytań, podpowiedzi, wersji roboczych, podglądu i publikowanie nowych zestawów. Baza to PostgreSQL w Supabase, z dostępem dla uprawnionych redaktorów i oddzielnym publicznym odczytem tylko opublikowanych danych.

Pełna instrukcja: [docs/content-studio.md](docs/content-studio.md).

```bash
npm run studio # lokalny podgląd panelu: http://127.0.0.1:4174
node tools/generate-content-seed.mjs --check
```

**Baza Supabase Free działa i zawiera wszystkie 663 pozycje siedmiu gier.** Dostęp redaktora przygotowano dla `contact@swawole.studio`. Trzeba jeszcze zaprosić użytkownika przez Authentication i zweryfikować logowanie oraz publikowanie. PR #49 pozostaje weryfikowany i niescalony z `main`.

## Uruchomienie lokalne

Wymagany jest Node 22+.

```bash
npm ci
npm run serve
```

`npm run serve`:

1. buduje lokalne assety runtime (Tailwind, Phaser, Font Awesome i Inter),
2. uruchamia wbudowany serwer Node na `http://localhost:8080`,
3. wyłącza cache dla plików developerskich i usuwa lokalny produkcyjny Service Worker Partyjniaka.

Skrypt działa tak samo na Windowsie, macOS i Linuksie — nie wymaga Pythona.

**Nie uruchamiaj świeżego checkoutu samym `python -m http.server 8080` ani `python3 -m http.server 8080`.** Pliki `assets/css/runtime.css` i `assets/js/phaser.min.js` są generowane i nie są przechowywane w repozytorium. Jeśli używasz własnego serwera HTTP, najpierw wykonaj:

```bash
npm ci
npm run build:assets
```

Jeśli runtime nie został zbudowany, aplikacja pokaże komunikat diagnostyczny zamiast renderować niekompletny interfejs.

Nie uruchamiaj aplikacji przez `file://`, ponieważ część API przeglądarki wymaga HTTP/HTTPS.

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

Pull requesty do `main` uruchamiają testy domenowe, produkcyjny build webowy, mobilne smoke testy Chromium oraz pełny build Android APK z inspekcją faktycznie spakowanego runtime'u.

## Android APK

Repozytorium zawiera konfigurację **Capacitor 8** oraz workflow `.github/workflows/android-apk.yml`. Każdy push na `main` uruchamia testy, przygotowanie web bundle, weryfikację paczki Capacitor i build debug APK. Gotowy APK jest dodatkowo sprawdzany pod kątem obecności kompletnego runtime'u przed uploadem artefaktu.

Artefakt ma nazwę:

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
- wszystkie biblioteki runtime są lokalne — APK nie wymaga CDN do pierwszego uruchomienia,
- Tailwind, Inter i Font Awesome są pakowane do samowystarczalnego runtime CSS, a krytyczny CSS jest osadzany w Androidowym `index.html`.

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
│   ├── game-menu.js
│   ├── game-themes.js
│   ├── hub.js
│   ├── native-android.js
│   ├── navigation-behavior.js
│   ├── outcome-audio.js
│   ├── platform.js
│   ├── player-setup.js
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

Start aplikacji ładuje tylko shell/shared. Po wybraniu gry Partyjniak kolejno ładuje jej CSS/JS, widoki, inicjalizuje content i odtwarza sesję. Service Worker nadal precache'uje komplet lokalnych zasobów, więc lazy loading nie ogranicza działania offline w normalnym buildzie/PWA.

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
- Service Worker z cache lokalnych zasobów w buildzie produkcyjnym/PWA,
- Screen Wake Lock podczas aktywnych rund,
- lokalne Tailwind CSS, Phaser, Font Awesome i Inter generowane przez `scripts/build-assets.mjs`,
- runtime CSS jest generowany do `assets/css/runtime.css`, a Phaser do `assets/js/phaser.min.js`.

`assets/css/runtime.css`, `assets/js/phaser.min.js`, `dist/` i `android/` są artefaktami builda i nie są commitowane.