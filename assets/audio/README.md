# Dźwięki wyników rundy

Dźwięki końca rundy są pobierane z OpenGameArt i preloadowane przez aplikację. Oba źródła mają licencję CC0, więc nie wymagają atrybucji.

- Wygrana impostora: `Evil Laugh` — AntumDeluge, CC0  
  https://opengameart.org/content/evil-laugh
- Wygrana zwykłych graczy: `Well Done` — qubodup, CC0  
  https://opengameart.org/content/well-done

Aplikacja używa bezpośrednich adresów plików OGG i cache'uje je przez Service Workera. Jeśli przeglądarka nie może odtworzyć sampla, `assets/js/shared/outcome-audio.js` uruchamia dedykowany fallback WebAudio. Nie używa już ogólnego dźwięku `success`/`failure`, żeby błędu sampla nie maskowało stare „plumkanie”.
