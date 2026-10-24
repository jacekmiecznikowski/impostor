# Dźwięki Partyjniaka

Pliki dźwiękowe są częścią repozytorium i APK. Odtwarzanie działa offline.

## Impostor — nagrania zwycięstwa

- `crewmates-win.mp3` — oryginalne nagranie zwycięstwa crewmate’ów;
- `impostor-win.mp3` — oryginalne nagranie zwycięstwa impostora.

Aplikacja odtwarza **bezpośrednio te MP3**, bez konwersji, generowania efektów ani przechowywania ich kopii w Base64. Android używa `PartyjniakApplausePlugin` z natywnym `MediaPlayer`; przeglądarka używa HTML Audio lub Web Audio.

Źródła i licencje podawane we wcześniejszej dokumentacji:

- `Evil Laugh` — AntumDeluge (CC0): https://opengameart.org/content/evil-laugh
- `Well Done` — qubodup (CC0): https://opengameart.org/content/well-done

Przy zmianie nagrań należy zweryfikować, czy te informacje nadal odnoszą się do użytych plików.

## Tykająca Bomba

- `bomb-tick.b64` — tykanie, odtwarzane w pętli;
- `bomb-explosion.b64` — pojedynczy efekt wybuchu.

To celowo pozostawione lokalne pliki tekstowe Base64: `assets/js/games/ticking-bomb/audio.js` dekoduje je do Web Audio API. Nie ma potrzeby konwertowania ich na MP3, dopóki mechanizm odtwarzania Bomby się nie zmieni.

## Zasady

- Przechowujemy **jedną aktywną wersję każdego nagrania** — żadnych podzielonych kopii Base64 ani plików przejściowych.
- Nowy dźwięk dodajemy do `assets/audio/` i aktualizujemy odwołania w kodzie oraz `sw.js`.
- Wszystkie gry respektują globalne ustawienie dźwięku `partyjniak.settings.v1`.
