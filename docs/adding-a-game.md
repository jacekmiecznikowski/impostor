# Dodawanie nowej gry do Partyjniaka

Nowa gra powinna być samodzielnym modułem. Wspólny kod aplikacji nie powinien znać nazw jej ekranów ani reguł.

## 1. Katalog gry

Utwórz `assets/js/games/<id>/` i trzymaj tam logikę domenową oraz runtime gry. Typowy zestaw plików to:

- `content-provider.js` – ładowanie/normalizacja lokalnej bazy treści,
- `rules.js` – czyste reguły możliwe do testowania bez DOM,
- `state.js` – stan i persystencja sesji,
- `setup.js` – konfiguracja graczy/opcji,
- `game.js` – runtime rundy,
- `scoreboard.js` – wynik/ranking,
- `integration.js` – jedyny kontrakt gry ze wspólną aplikacją.

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

## 3. Rejestracja

Dodaj tylko import i wywołanie `register...Game()` w `assets/js/games/index.js`.

Nie dodawaj wyjątków dla nowej gry do:

- `assets/js/app.js`,
- `assets/js/shared/ui.js`,
- `assets/js/shared/hub.js`,
- `assets/js/shared/navigation-behavior.js`,
- `assets/js/shared/game-themes.js`.

Jeżeli nowa mechanika wymaga wspólnej funkcji, najpierw sprawdź, czy jest naprawdę generyczna i przydatna dla co najmniej dwóch gier.

## 4. UI i theme

Setup graczy powinien korzystać z `player-setup.js` i `player-setup.css` zamiast tworzyć trzeci wariant tego samego UI.

Kolory i tożsamość wizualna należą do `theme` modułu. Shared CSS powinien korzystać z semantycznych zmiennych `--ui-*`, bez selektorów znających konkretne `data-game`.

Tło Phasera zachowuje ciągłość w obrębie jednej rodziny gry. Zmiana ekranów tej samej gry nie powinna reseedować całej sceny.

## 5. Offline/PWA

Do czasu pełnej automatyzacji bundla dodaj nowe lokalne assety do `sw.js`. Po zmianie pliku ładowanego pod tym samym URL-em podbij `CACHE_VERSION`.

## 6. Testy

Minimum dla pełnej gry:

- test treści,
- test czystych reguł,
- test stanu/persystencji,
- test krytycznej pętli gameplayu,
- aktualizacja kontraktów modułu/PWA, jeśli pojawia się nowy rodzaj assetu.

Testy powinny weryfikować zachowanie i kontrakty, a nie konkretne formatowanie źródła.
