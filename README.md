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

Testy obejmują:

- produkcyjne reguły Impostora (`rules.js`) – przydział ról i punktację,
- walidację zdalnych danych/kategorii,
- krytyczne zależności struktury aplikacji i PWA.

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

### Kontrakt API

Endpoint powinien być dostępny jako:

```text
<BASE_URL>/impostor.pl.json
```

i zwracać JSON zgodny z `content/examples/impostor.pl.json`.

Najważniejsze pola:

```json
{
  "schemaVersion": 1,
  "game": "impostor",
  "locale": "pl",
  "categories": [
    {
      "id": "jedzenie",
      "name": "Jedzenie",
      "icon": "fa-burger",
      "desc": "Potrawy i przysmaki",
      "words": [
        { "word": "Pizza", "hint": "Ser" }
      ]
    }
  ],
  "discussionTips": ["Przykładowa wskazówka"]
}
```

Dane są walidowane przed użyciem. Jeśli API jest niedostępne albo zwróci błędne dane, Partyjniak użyje cache lub lokalnego fallbacku.

### Ustawienie zewnętrznego źródła

W konsoli developerskiej lub z przyszłego panelu administracyjnego:

```js
PartyjniakContent.setRemoteBaseUrl('https://example.com/content');
```

Usunięcie konfiguracji:

```js
PartyjniakContent.clearRemoteBaseUrl();
```

Można też ustawić przed startem aplikacji globalne `window.PARTYJNIAK_CONTENT_API`.

## Android / PWA

- manifest z ikonami 192/512 i maskable,
- tryb `standalone`,
- `safe-area` i `100dvh`,
- Service Worker i cache lokalnych zasobów,
- Screen Wake Lock podczas właściwej rundy (przekazywanie telefonu, rola, dyskusja, głosowanie),
- mechanizm Wake Lock działa bez dodatkowych komunikatów w interfejsie.

Wake Lock wymaga bezpiecznego kontekstu HTTPS. `localhost` jest wyjątkiem developerskim.

## Zależności

Aplikacja nadal korzysta z CDN dla Tailwind CSS, Phasera, Font Awesome i Google Fonts. Brak Phasera nie blokuje już uruchomienia aplikacji – wyłączane jest wyłącznie animowane tło.

Docelowo przed publikacją jako natywny APK/AAB warto przenieść zależności do repozytorium, aby pierwsze uruchomienie także działało całkowicie offline.
