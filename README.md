# Partyjniak – gry imprezowe

**Partyjniak** to mobilna aplikacja webowa/PWA z grami imprezowymi na jeden telefon. Obecnie dostępny jest **Impostor**; architektura jest przygotowana pod kolejne gry, m.in. Czółko i Tabu.

## Uruchomienie lokalne

W katalogu repozytorium:

```bash
python3 -m http.server 8080
```

albo:

```bash
npm run serve
```

Następnie otwórz `http://localhost:8080`.

Nie uruchamiaj aplikacji przez `file://`, ponieważ Service Worker i część API przeglądarki wymagają HTTP/HTTPS.

## Testy

```bash
npm test
```

Testy obejmują produkcyjne reguły Impostora, walidację zdalnych danych/kategorii oraz krytyczne zależności struktury aplikacji, PWA i nawigacji.

## Android APK

Repozytorium zawiera konfigurację **Capacitor 8** oraz workflow GitHub Actions `.github/workflows/android-apk.yml`.

Każdy push na `main` uruchamia build debug APK. Po zakończeniu workflow plik można pobrać z zakładki **Actions** jako artefakt:

```text
partyjniak-debug-apk
└── app-debug.apk
```

APK ma identyfikator pakietu:

```text
pl.partyjniak.app
```

W wersji Android:

- ekran jest utrzymywany aktywny natywnie przez `FLAG_KEEP_SCREEN_ON`,
- sprzętowy/gestowy przycisk **Wstecz** jest podpięty do nawigacji Partyjniaka przez `@capacitor/app`,
- aplikacja działa w orientacji pionowej,
- używana jest ikona Partyjniaka,
- Service Worker jest wyłączony wewnątrz natywnego wrappera, żeby nie powodował konfliktów cache.

Do lokalnego builda potrzebne są Node 22+, JDK 21 oraz Android SDK. Potem:

```bash
npm install
npm run build:web
npx cap add android
npx cap sync android
node scripts/patch-android.mjs
cd android
./gradlew assembleDebug
```

Gotowy plik znajdziesz w `android/app/build/outputs/apk/debug/app-debug.apk`.

## Nawigacja na Androidzie

Partyjniak używa lekkiego, kontekstowego shella zamiast stałej ciężkiej belki:

- na ekranie głównym branding jest częścią treści,
- w menu gry i konfiguracji działa kontekstowy top bar z dużym celem dotykowym **Wstecz**,
- podczas aktywnej rundy shell nie zajmuje pionowej przestrzeni,
- systemowy przycisk/gest Android **Wstecz** jest obsługiwany wewnątrz aplikacji,
- podczas aktywnej rundy cofnięcie otwiera dolny arkusz potwierdzenia zamiast wracać do poprzedniej roli.

## Architektura

```text
assets/js/
├── app.js
├── shared/
│   ├── audio.js
│   ├── background.js
│   ├── content-repository.js
│   ├── hub.js
│   ├── native-android.js
│   ├── platform.js
│   └── ui.js
└── games/
    └── impostor/
        ├── content-provider.js
        ├── data.js
        ├── game.js
        ├── presentation.js
        ├── reveal-fit.js
        ├── rules.js
        ├── scoreboard.js
        ├── setup.js
        └── state.js
```

`rules.js` zawiera czystą logikę domenową i jest bezpośrednio używany zarówno przez grę, jak i testy. `presentation.js` odpowiada za specyficzny UI Impostora, natomiast shell, tło i funkcje urządzenia są współdzielone.

## Treści: kategorie i hasła

Obecne hasła w `assets/js/games/impostor/data.js` są fallbackiem offline. Aplikacja ma też warstwę `ContentRepository`, dzięki której można podpiąć zewnętrzne źródło bez zmiany logiki gry.

Endpoint powinien być dostępny jako:

```text
<BASE_URL>/impostor.pl.json
```

i zwracać JSON z polami `schemaVersion`, `game`, `locale`, `categories` i opcjonalnym `discussionTips`. Jeśli API jest niedostępne albo zwróci błędne dane, Partyjniak użyje cache lub lokalnego fallbacku.

## Android / PWA

- manifest z ikonami 192/512 i maskable,
- tryb `standalone`,
- `safe-area` i `100dvh`,
- Service Worker i cache lokalnych zasobów dla wersji webowej,
- Screen Wake Lock w PWA podczas właściwej rundy,
- natywny `KEEP_SCREEN_ON` w APK.

## Zależności

Aplikacja nadal korzysta z CDN dla Tailwind CSS, Phasera, Font Awesome i Google Fonts. Brak Phasera nie blokuje uruchomienia aplikacji – wyłączane jest wyłącznie animowane tło.

Przed publikacją produkcyjną w Google Play warto przenieść zależności CDN do lokalnego bundla, aby pierwsze uruchomienie APK także działało całkowicie offline.
