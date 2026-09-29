# Partyjniak – gry imprezowe

**Partyjniak** to mobilna aplikacja/PWA z grami imprezowymi na jeden telefon. Obecnie dostępny jest **Impostor**; architektura i ekran główny są przygotowane pod kolejne gry, m.in. Czółko i Tabu.

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

Nie uruchamiaj aplikacji przez `file://` — Service Worker, instalacja PWA i część API urządzenia wymagają HTTP/HTTPS.

## Testy

```bash
npm test
```

## Architektura

```text
assets/js/
├── app.js
├── shared/
│   ├── audio.js
│   ├── background.js            # Phaser i kontekstowe tło
│   ├── platform.js              # PWA + Screen Wake Lock
│   ├── ui.js                    # routing i shell
│   ├── hub.js                   # Partyjniak + katalog gier
│   └── content-repository.js    # opcjonalne zdalne źródło treści
└── games/
    └── impostor/
        ├── data.js              # lokalny fallback offline
        ├── content-provider.js  # mapowanie zdalnych danych na model gry
        ├── state.js
        ├── setup.js
        ├── game.js
        ├── presentation.js
        └── scoreboard.js
```

## Branding i mobilny shell

- nazwa aplikacji: **Partyjniak – gry imprezowe**,
- własne logo i ikony PWA 192/512/maskable,
- ekran główny jest hubem gier,
- wewnątrz gry shell jest lekki i kontekstowy,
- podczas właściwej rundy przechodzi w tryb immersyjny i nie zabiera pionowej przestrzeni,
- Screen Wake Lock działa w tle bez komunikatów technicznych dla gracza.

## Tło Phaser

Tło jest wspólną warstwą Partyjniaka. Tryb wizualny zmienia się zależnie od etapu aplikacji (`party`, `impostor`, `mystery`, `discussion`, `vote`, `celebrate`). Animacje są celowo subtelne, ograniczone do 45 FPS i respektują `prefers-reduced-motion`.

## Treści / API kategorii i słów

Obecna baza Impostora w `assets/js/games/impostor/data.js` pozostaje lokalnym fallbackiem, dlatego gra działa bez zewnętrznego API.

Dodatkowo `ContentRepository` umożliwia podpięcie zewnętrznego źródła JSON bez zmiany logiki rundy. Ustaw bazowy URL przed uruchomieniem aplikacji:

```js
window.PARTYJNIAK_CONTENT_API = 'https://example.com/partyjniak-content';
```

lub w konsoli/deweloperskim panelu:

```js
PartyjniakContent.setRemoteBaseUrl('https://example.com/partyjniak-content');
```

Dla Impostora aplikacja pobierze:

```text
https://example.com/partyjniak-content/impostor.pl.json
```

Minimalny kontrakt:

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
  "discussionTips": ["Zaczynajcie od ogólnych pytań."]
}
```

Jeśli endpoint nie odpowiada, aplikacja automatycznie używa danych lokalnych. Ostatnia poprawna odpowiedź zdalna jest również zachowywana jako cache w `localStorage`.

Dzięki temu backend można później zrealizować np. przez Supabase, Firebase, własne API albo prosty statyczny katalog JSON.

## Android / PWA

Partyjniak jest przygotowany do instalacji jako PWA na Androidzie. Podczas aktywnej gry aplikacja używa Screen Wake Lock, żeby telefon nie wygaszał ekranu przy przekazywaniu go między graczami. Wake Lock wymaga HTTPS (localhost jest wyjątkiem developerskim).

## Kolejne gry

Nową grę dodawaj jako osobny katalog pod `assets/js/games/` oraz wpis w `GAME_CATALOG` w `assets/js/shared/hub.js`. Wspólne funkcje urządzenia, shell, audio, tło i treści powinny pozostawać w `assets/js/shared/`.
