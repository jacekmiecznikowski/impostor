# Impostor – mobilna gra party

Statyczna aplikacja webowa do gry „znajdź impostora”, przygotowana tak, aby działała bez procesu buildowania i mogła być publikowana bezpośrednio na GitHub Pages.

## Struktura

```text
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── css/styles.css
│   ├── icons/icon.svg
│   └── js/
│       ├── data.js        # baza haseł i kategorii
│       ├── state.js       # stan, zapis sesji, helpery
│       ├── audio.js       # dźwięki WebAudio
│       ├── background.js  # animowane tło Phaser
│       ├── ui.js          # ekrany, modale i komunikaty
│       ├── setup.js       # konfiguracja graczy i rundy
│       ├── game.js        # logika rundy, role, głosowanie
│       ├── scoreboard.js  # tabela wyników
│       └── app.js         # inicjalizacja aplikacji
├── tests/core.test.cjs
├── package.json
└── .github/workflows/pages.yml
```

## Uruchomienie lokalne

Najprościej uruchomić lokalny serwer HTTP z katalogu projektu:

```bash
python3 -m http.server 8080
```

Potem otwórz `http://localhost:8080`. Możesz też użyć `npm run serve`.

Nie uruchamiaj gry przez samo `file://.../index.html`, bo Service Worker i część zachowań przeglądarki wymagają serwera HTTP/HTTPS.

## Publikacja na GitHub Pages

Projekt zawiera workflow `.github/workflows/pages.yml`. Po wypchnięciu plików na gałąź `main` lub `master`:

1. Wejdź w **Settings → Pages** w repozytorium.
2. W sekcji **Build and deployment → Source** wybierz **GitHub Actions**.
3. Wypchnij commit lub uruchom workflow ręcznie w zakładce **Actions**.
4. Po poprawnym deployu adres strony pojawi się w podsumowaniu joba i w **Settings → Pages**.

Aplikacja używa wyłącznie ścieżek względnych (`./...`), więc działa także pod adresem typu `https://uzytkownik.github.io/nazwa-repo/`.

## Najważniejsze poprawki względem wersji jednoplikowej

- rozdzielenie monolitycznego HTML na logiczne pliki,
- walidacja unikalnych imion graczy,
- bezpieczniejsze renderowanie nazw graczy bez wstrzykiwania HTML,
- poprawiony mechanizm „przytrzymaj, aby odkryć rolę”,
- reset przycisku głosowania między rundami,
- uczciwsze tasowanie graczy algorytmem Fisher–Yates,
- zapis graczy, punktów i ustawień w `localStorage` oraz opcja wznowienia sesji,
- łagodna degradacja, gdy Phaser nie załaduje się z CDN,
- poprawki dostępności (zoom strony, `focus-visible`, ograniczenie animacji przy `prefers-reduced-motion`),
- manifest i Service Worker dla wygodniejszego używania na telefonie,
- gotowy workflow GitHub Pages.

## Zależności z CDN

Interfejs nadal korzysta z Tailwind CSS, Phaser, Google Fonts i Font Awesome przez CDN. Sama logika gry jest lokalna. Przy braku internetu po pierwszym uruchomieniu część lokalnych zasobów może działać z cache, ale zewnętrzne biblioteki nie są bundlowane do repozytorium.

## Testy logiki

Bez dodatkowych zależności:

```bash
npm test
```

Test obejmuje generowanie ról, tryb podpowiedzi, punktację po złapaniu impostora i blokowanie duplikatów imion.
