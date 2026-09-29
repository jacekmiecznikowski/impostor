# Impostor – mobilna gra party

Pełna statyczna aplikacja webowa do gry „znajdź impostora”. Nie wymaga procesu buildowania ani backendu — logika gry działa w przeglądarce.

## Funkcje

- 3–12 graczy,
- 1–3 impostorów z ograniczeniem dla małych grup,
- tryby podpowiedzi dla impostora: brak / zawsze / 50%,
- wiele kategorii haseł,
- opcjonalny timer dyskusji,
- przekazywanie telefonu i ukryte odkrywanie roli,
- głosowanie grupy i punktacja,
- tabela wyników sesji,
- zapis ustawień i wyników w `localStorage`,
- opcja wznowienia poprzedniej sesji,
- mobilny interfejs, dźwięki WebAudio i animowane tło Phaser,
- podstawowe testy logiki.

## Uruchomienie lokalne

Najprościej uruchomić aplikację przez lokalny serwer HTTP.

### Python

W katalogu repozytorium:

```bash
python3 -m http.server 8080
```

Potem otwórz:

```text
http://localhost:8080
```

### npm

Jeśli masz Node.js i Pythona:

```bash
npm run serve
```

To uruchomi ten sam serwer na porcie `8080`.

Nie zalecam otwierania aplikacji bezpośrednio przez `file://.../index.html`, ponieważ Service Worker i część zachowań przeglądarki wymagają HTTP/HTTPS.

## Testy

Testy nie wymagają instalowania zależności npm:

```bash
npm test
```

Obejmują m.in. generowanie ról, tryby podpowiedzi, punktację i walidację powtarzających się imion.

## Struktura projektu

```text
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── package.json
├── assets/
│   ├── css/styles.css
│   ├── icons/icon.svg
│   └── js/
│       ├── data.js
│       ├── state.js
│       ├── audio.js
│       ├── background.js
│       ├── ui.js
│       ├── setup.js
│       ├── game.js
│       ├── scoreboard.js
│       └── app.js
└── tests/core.test.cjs
```

## Zależności

Kod gry znajduje się w repozytorium. Warstwa interfejsu korzysta z bibliotek ładowanych z CDN:

- Tailwind CSS,
- Phaser 3,
- Font Awesome,
- Google Fonts (Inter).

Przy pierwszym uruchomieniu potrzebne jest połączenie z internetem, aby pobrać te zasoby.

## Dane lokalne

Gra zapisuje ustawienia, graczy i wyniki sesji w `localStorage` pod kluczem `impostor.session.v2`.

Podczas developmentu po zmianach w kodzie może być potrzebne twarde odświeżenie strony, ponieważ aplikacja rejestruje Service Worker.
