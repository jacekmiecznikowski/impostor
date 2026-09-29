# Party Games – mobilne gry imprezowe

Statyczna aplikacja webowa/PWA będąca bazą pod kolekcję gier imprezowych na jeden telefon. Obecnie dostępny jest **Impostor**, a ekran główny jest przygotowany pod kolejne gry, m.in. **Czółko** i **Tabu**.

## Architektura

Kod jest rozdzielony na warstwę wspólną oraz osobne gry:

```text
assets/js/
├── app.js                         # bootstrap aplikacji
├── shared/
│   ├── audio.js                   # wspólne dźwięki
│   ├── background.js              # animowane tło
│   ├── platform.js                # PWA, instalacja, Screen Wake Lock
│   ├── ui.js                      # routing ekranów, modale, shell
│   └── hub.js                     # ekran główny i katalog gier
└── games/
    └── impostor/
        ├── data.js                # hasła, kategorie, wskazówki
        ├── state.js               # stan i localStorage
        ├── setup.js               # konfiguracja graczy/rundy
        ├── game.js                # logika rundy i punktacja
        ├── presentation.js        # UI specyficzny dla Impostora
        └── scoreboard.js          # tabela wyników
```

Przy kolejnej grze dodaj nowy katalog w `assets/js/games/`, zamiast dopisywać jej logikę do plików Impostora.

## Impostor

- 3–12 graczy,
- 1–3 impostorów z ograniczeniem dla małych grup,
- podpowiedzi: brak / zawsze / 50%,
- wiele kategorii haseł,
- opcjonalny timer dyskusji,
- przekazywanie jednego telefonu między graczami,
- ukryte odkrywanie roli przez przytrzymanie karty,
- grupowe głosowanie,
- punktacja i tabela wyników,
- zapis sesji w `localStorage`,
- możliwość wznowienia poprzedniej sesji.

## Android / PWA

Aplikacja jest przygotowana do instalacji jako PWA na Androidzie:

- manifest z ikonami 192/512 px i ikoną maskowalną,
- `display: standalone`,
- obsługa `safe-area` i `100dvh`,
- Service Worker z cache lokalnych plików,
- Screen Wake Lock podczas aktywnej gry, aby telefon nie wygaszał ekranu podczas przekazywania go między graczami.

Wake Lock wymaga bezpiecznego kontekstu (HTTPS). `localhost` działa w developmentcie, ale wejście z telefonu na zwykły adres `http://192.168.x.x:8080` może nie udostępniać tej funkcji.

## Uruchomienie lokalne

### Python

W katalogu repozytorium:

```bash
python3 -m http.server 8080
```

Następnie otwórz:

```text
http://localhost:8080
```

### npm

```bash
npm run serve
```

Skrypt uruchamia ten sam serwer Pythona na porcie `8080`.

Nie uruchamiaj aplikacji bezpośrednio przez `file://`, ponieważ Service Worker i część API przeglądarki wymagają HTTP/HTTPS.

## Testy

```bash
npm test
```

Testy obejmują podstawową logikę Impostora oraz kontrolę struktury projektu i wymaganych plików prezentacji.

## Dodawanie kolejnej gry

1. Dodaj wpis w `GAME_CATALOG` w `assets/js/shared/hub.js`.
2. Utwórz katalog, np. `assets/js/games/heads-up/`.
3. Trzymaj stan, logikę i prezentację nowej gry w tym katalogu.
4. Wspólne funkcje urządzenia/UI dodawaj do `assets/js/shared/`, tylko jeśli faktycznie są używane przez więcej niż jedną grę.
5. Dodaj lokalne pliki gry do `LOCAL_ASSETS` w `sw.js`.

## Zależności

Interfejs nadal używa zewnętrznych CDN:

- Tailwind CSS,
- Phaser 3,
- Font Awesome,
- Google Fonts (Inter).

Service Worker buforuje je best-effort po pierwszym uruchomieniu. Docelowo, przed opakowaniem aplikacji jako natywny APK/AAB, warto przenieść te zależności do repozytorium, aby gra działała w pełni offline.
