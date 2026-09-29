# Party Games – mobilne gry imprezowe

Statyczna aplikacja webowa będąca bazą pod kolekcję gier imprezowych na jeden telefon. Obecnie dostępna jest gra **Impostor**, a ekran główny jest przygotowany pod kolejne gry, takie jak **Czółko** i **Tabu**.

Aplikacja nie wymaga backendu ani procesu buildowania — logika działa bezpośrednio w przeglądarce.

## Dostępne gry

### Impostor

- 3–12 graczy,
- 1–3 impostorów z ograniczeniem dla małych grup,
- tryby podpowiedzi dla impostora: brak / zawsze / 50%,
- wiele kategorii haseł,
- opcjonalny timer dyskusji,
- przekazywanie telefonu i ukryte odkrywanie roli,
- głosowanie grupy i punktacja,
- tabela wyników sesji,
- zapis ustawień i wyników w `localStorage`,
- możliwość wznowienia poprzedniej sesji.

### Planowane

Na ekranie wyboru gier są już widoczne miejsca pod:

- Czółko,
- Tabu.

Kolejne gry będą dokładane do wspólnego ekranu startowego.

## Ekran główny i katalog gier

Lista gier jest zdefiniowana w `GAME_CATALOG` w pliku:

```text
assets/js/app.js
```

Każda pozycja ma identyfikator, nazwę, opis, ikonę i status dostępności. Obecnie tylko `impostor` ma status `available`; pozostałe kafelki są oznaczone jako `coming-soon`.

Przy dodawaniu następnej gry warto trzymać jej logikę w osobnych plikach/modułach i używać wspólnego ekranu głównego wyłącznie jako routera do poszczególnych gier.

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

Nie zalecamy otwierania aplikacji bezpośrednio przez `file://.../index.html`, ponieważ Service Worker i część zachowań przeglądarki wymagają HTTP/HTTPS.

## Testy

Testy nie wymagają instalowania zależności npm:

```bash
npm test
```

Obejmują m.in. generowanie ról Impostora, tryby podpowiedzi, punktację i walidację powtarzających się imion.

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
│       ├── app.js          # shell aplikacji, katalog i wybór gier
│       ├── ui.js           # nawigacja ekranów i modale
│       ├── data.js         # dane Impostora
│       ├── state.js        # stan i zapis sesji Impostora
│       ├── audio.js
│       ├── background.js
│       ├── setup.js        # konfiguracja Impostora
│       ├── game.js         # logika rozgrywki Impostora
│       └── scoreboard.js
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

Impostor zapisuje ustawienia, graczy i wyniki sesji w `localStorage` pod kluczem:

```text
impostor.session.v2
```

Podczas developmentu po zmianach w kodzie może być potrzebne twarde odświeżenie strony, ponieważ aplikacja rejestruje Service Worker.
