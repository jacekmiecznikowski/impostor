# Dodawanie nowej gry do Partyjniaka

Nowa gra powinna być samodzielnym modułem. Wspólny kod aplikacji nie powinien znać nazw jej ekranów ani reguł.

## 1. Katalog gry

Utwórz `assets/js/games/<id>/` i trzymaj tam logikę domenową oraz runtime gry. Typowy zestaw plików to:

- `bootstrap.js` – deklaracja lazy-loaded CSS/JS i eksport funkcji rejestrującej,
- `integration.js` – kontrakt gry ze wspólną aplikacją,
- `content-provider.js` – ładowanie/normalizacja lokalnej bazy treści,
- `rules.js` – czyste reguły możliwe do testowania bez DOM,
- `state.js` – stan i persystencja sesji,
- `setup.js` – konfiguracja graczy/opcji,
- `game.js` – runtime rundy,
- `scoreboard.js` – wynik/ranking.

Widoki trafiają do `views/`, treści do `content/`, a CSS do `assets/css/`.

## 2. Integration module

`integration.js` rejestruje grę przez `registerGameModule()` i powinien być właścicielem:

- `catalog` – nazwa, opis, ikona, status i kolejność na hubie,
- `theme` – paleta oraz backgroundy gry,
- `views` – fragmenty HTML wymagane przez grę,
- `screens` – konfiguracja shell/back/background/orientation/roundGuard/wakeLock,
- `session` – `load`, `save`, `reset`, `hasResume`, `getPlayers`, opcjonalnie `syncUi`,
- `open()` – wejście do menu gry,
- `initialize()` – opcjonalna inicjalizacja danych/contentu,
- hooki lifecycle (`onScreenEnter`, `onScreenLeave`, `leaveRound`) jeśli są potrzebne,
- integracja tabeli wyników.

Nowe gry powinny wystawiać własne `initialize()` zamiast dopisywać funkcję inicjalizującą do `app.js`.

## 3. Bootstrap i lazy loading

`bootstrap.js` importuje funkcję rejestrującą z `integration.js`, wywołuje ją i przypisuje `gameModule.assets`:

```js
import { registerExampleGame as registerBaseGame } from './integration.js?v=1';

export function registerExampleGame() {
    const gameModule = registerBaseGame();
    gameModule.assets = {
        styles: ['./assets/css/example.css'],
        scripts: [
            './assets/js/games/example/content-provider.js',
            './assets/js/games/example/rules.js',
            './assets/js/games/example/state.js',
            './assets/js/games/example/setup.js',
            './assets/js/games/example/game.js',
            './assets/js/games/example/scoreboard.js'
        ]
    };
    return gameModule;
}
```

Kolejność `scripts` ma znaczenie: klasyczne skrypty są dołączane sekwencyjnie. Nie dodawaj game-specific JS ani CSS bezpośrednio do `index.html`.

## 4. Rejestracja

Dodaj tylko import `bootstrap.js` i wywołanie `register...Game()` w `assets/js/games/index.js`.

Nie dodawaj wyjątków dla nowej gry do:

- `assets/js/app.js`,
- `assets/js/shared/ui.js`,
- `assets/js/shared/hub.js`,
- `assets/js/shared/navigation-behavior.js`,
- `assets/js/shared/game-themes.js`.

Rejestr wymaga unikalnego `id` gry oraz globalnie unikalnych nazw ekranów. Kolizja powinna zakończyć się błędem podczas rejestracji, a nie zależeć od kolejności modułów.

Jeżeli nowa mechanika wymaga wspólnej funkcji, najpierw sprawdź, czy jest naprawdę generyczna i przydatna dla co najmniej dwóch gier.

## 5. UI i theme

Setup graczy powinien korzystać z `player-setup.js` i `player-setup.css` zamiast tworzyć kolejny wariant tego samego UI.

Kolory i tożsamość wizualna należą do `theme` modułu. Shared CSS powinien korzystać z semantycznych zmiennych `--ui-*`, bez selektorów znających konkretne `data-game`.

Tło Phasera zachowuje ciągłość w obrębie jednej rodziny gry. Zmiana ekranów tej samej gry nie powinna reseedować całej sceny.

## 6. Offline/PWA

Biblioteki vendor (Tailwind, Phaser, Font Awesome, Inter) są generowane automatycznie przez `npm run build:assets`; `assets/vendor/precache.json` powstaje bez ręcznego wpisywania plików fontów/bibliotek.

Lokalne assety konkretnej gry nadal dodaj do `LOCAL_ASSETS` w `sw.js`, żeby gra była dostępna po instalacji PWA także bez sieci. Po zmianie pliku ładowanego pod tym samym URL-em podbij `CACHE_VERSION`; po zmianie versioned URL zaktualizuj także wpis w `sw.js`.

## 7. Testy

Minimum dla pełnej gry:

- test treści,
- test czystych reguł,
- test stanu/persystencji,
- test krytycznej pętli gameplayu,
- aktualizacja kontraktów modułu/PWA, jeśli pojawia się nowy rodzaj assetu.

Jeżeli zmiana dotyka wejścia do gry, nawigacji lub lazy loadingu, rozszerz także `tests/e2e/smoke.spec.mjs`.

Testy powinny weryfikować zachowanie i kontrakty, a nie konkretne formatowanie źródła.
