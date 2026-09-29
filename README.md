# Party Games – mobilne gry imprezowe

Statyczna aplikacja webowa/PWA będąca bazą pod kolekcję gier imprezowych na jeden telefon. Obecnie dostępna jest gra **Impostor**, a ekran główny jest przygotowany pod kolejne gry, takie jak **Czółko** i **Tabu**.

## Android / PWA

Aplikacja jest przygotowana do działania jako instalowalna PWA na Androidzie:

- uruchamia się w trybie `standalone`,
- ma ikony 192×192, 512×512 i osobną ikonę `maskable`,
- preferuje orientację pionową,
- uwzględnia `safe-area` i dynamiczną wysokość ekranu,
- ma większe cele dotykowe i ograniczone przypadkowe przewijanie strony,
- Service Worker przechowuje lokalny shell aplikacji i próbuje buforować używane zasoby CDN,
- ekran główny może wyświetlić przycisk **Zainstaluj aplikację**, gdy przeglądarka udostępni systemowy prompt instalacji,
- skrót aplikacji może uruchomić bezpośrednio grę Impostor.

### Utrzymywanie włączonego ekranu

Podczas wejścia do konkretnej gry aplikacja automatycznie próbuje uzyskać **Screen Wake Lock**, dzięki czemu telefon nie powinien wygaszać ani blokować ekranu w trakcie przekazywania urządzenia pomiędzy graczami.

Po powrocie do głównego katalogu gier blokada jest zwalniana, żeby aplikacja nie zużywała niepotrzebnie baterii.

Jeśli Android lub przeglądarka zwolni blokadę po przejściu aplikacji w tło, aplikacja próbuje ją odzyskać po powrocie na ekran. Gdy Wake Lock nie jest dostępny albo system odmówi jego przyznania, informacja pojawi się na ekranie Impostora.

**Ważne:** Screen Wake Lock wymaga bezpiecznego kontekstu. W praktyce docelowa wersja webowa powinna być uruchamiana przez **HTTPS**. `localhost` działa do developmentu, ale zwykły adres HTTP w sieci lokalnej, np. `http://192.168.x.x:8080`, nie jest dobrym sposobem na test tej funkcji na telefonie.

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

- Czółko,
- Tabu.

Lista gier znajduje się w `GAME_CATALOG` w `assets/js/app.js`.

## Uruchomienie lokalne

W katalogu repozytorium:

```bash
python3 -m http.server 8080
```

albo:

```bash
npm run serve
```

Następnie otwórz:

```text
http://localhost:8080
```

Nie otwieraj aplikacji bezpośrednio przez `file://.../index.html`, ponieważ Service Worker i część API przeglądarki wymagają HTTP/HTTPS.

## Testy

```bash
npm test
```

Testy logiki nie wymagają instalowania zależności npm.

## Struktura

```text
.
├── index.html
├── manifest.webmanifest
├── sw.js
├── package.json
├── assets/
│   ├── css/styles.css
│   ├── icons/
│   │   ├── icon.svg
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── icon-maskable-512.png
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

## Ważne ograniczenie obecnej wersji

Tailwind CSS, Phaser, Font Awesome i Google Fonts są nadal ładowane z CDN. Service Worker próbuje je buforować, ale **pierwsze uruchomienie nadal powinno odbyć się z dostępem do internetu**.

Jeżeli aplikacja ma później trafić jako APK/AAB do Google Play i ma działać całkowicie offline, kolejnym krokiem powinno być usunięcie zależności runtime od CDN i spakowanie zasobów lokalnie. Wtedy można też rozważyć natywny wrapper (np. TWA/Capacitor) i natywną flagę utrzymywania ekranu jako dodatkowe zabezpieczenie.
