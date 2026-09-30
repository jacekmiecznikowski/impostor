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

## Nawigacja na Androidzie

Partyjniak używa lekkiego, kontekstowego shella zamiast stałej ciężkiej belki:

- na ekranie głównym branding jest częścią treści, a w prawym górnym rogu zostaje tylko menu `…`,
- w menu gry i konfiguracji działa kontekstowy top bar z dużym celem dotykowym **Wstecz**,
- podczas aktywnej rundy shell nie zajmuje pionowej przestrzeni — zostaje tylko pływające menu,
- systemowy przycisk/gest Android **Wstecz** jest obsługiwany wewnątrz aplikacji,
- podczas aktywnej rundy cofnięcie otwiera dolny arkusz potwierdzenia zamiast wracać do poprzedniej roli,
- na ekranie głównym Back nie jest przechwytywany, więc użytkownik może normalnie opuścić PWA.

## Architektura

```text
assets/js/
├── app.js
├── shared/
│   ├── audio.js
│   ├── background.js
│   ├── content-repository.js
│   ├── hub.js
│   ├── platform.js
│   └── ui.js
└── games/
    └── impostor/
        ├── content-provider.js
        ├── data.js
        ├── game.js
        ├── presentation.js
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

Zewnętrzne źródło można ustawić przez:

```js
PartyjniakContent.setRemoteBaseUrl('https://example.com/content');
```

## Android / PWA

- manifest z ikonami 192/512 i maskable,
- tryb `standalone`,
- `safe-area` i `100dvh`,
- Service Worker i cache lokalnych zasobów,
- Screen Wake Lock podczas właściwej rundy,
- mechanizm Wake Lock działa bez dodatkowych komunikatów w interfejsie.

Wake Lock wymaga bezpiecznego kontekstu HTTPS. `localhost` jest wyjątkiem developerskim.

## Zależności

Aplikacja nadal korzysta z CDN dla Tailwind CSS, Phasera, Font Awesome i Google Fonts. Brak Phasera nie blokuje uruchomienia aplikacji – wyłączane jest wyłącznie animowane tło.

Docelowo przed publikacją jako natywny APK/AAB warto przenieść zależności do repozytorium, aby pierwsze uruchomienie także działało całkowicie offline.
