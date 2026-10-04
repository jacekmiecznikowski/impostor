# Dźwięki Partyjniaka

Sample wyników Impostora pochodzą z OpenGameArt i mają licencję CC0:

- wygrana impostora: `Evil Laugh` — AntumDeluge,
- wygrana zwykłych graczy: `Well Done` — qubodup.

Źródła referencyjne:

- https://opengameart.org/content/evil-laugh
- https://opengameart.org/content/well-done

Aplikacja nie pobiera tych dźwięków z internetu w runtime. Pliki są przechowywane lokalnie jako tekst base64:

- `impostor-win.0.b64` … `impostor-win.4.b64`,
- `crewmates-win.mp3.b64`,
- `bomb-tick.b64`,
- `bomb-explosion.b64`.

`assets/js/shared/outcome-audio.js` i `assets/js/games/ticking-bomb/audio.js` pobierają lokalne pliki, dekodują base64 do `ArrayBuffer` i przekazują dane do Web Audio API. Service Worker precache'uje te pliki dla PWA, a build Capacitor kopiuje je do APK razem z resztą `assets/`.

Wszystkie moduły audio respektują wspólne ustawienie `partyjniak.settings.v1`; nie zależą od stanu żadnej konkretnej gry.
