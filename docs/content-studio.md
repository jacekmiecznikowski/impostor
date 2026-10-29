# Partyjniak Content Studio — uruchomienie

Panel: `admin/`. Baza: PostgreSQL w Supabase. Obecna aplikacja ma siedem różnych formatów kart — każdy jest obsługiwany.

## Zawartość importu

| Gra | Dane |
|---|---|
| Impostor | 16 kategorii, 114 haseł oraz podpowiedzi |
| Co mam na myśli? | 6 kategorii, 90 haseł |
| Naokoło | 5 kategorii, 50 kart ze słowami zakazanymi |
| Synchronizacja | 6 kategorii, 48 skal |
| Tykająca Bomba | 8 kategorii, 96 poleceń |
| Trzy w Pięć | 5 kategorii, 100 pytań |
| Dzika Karta | 40 pytań i 125 odpowiedzi (dwie talie) |

## Pierwsza konfiguracja

1. Utwórz projekt w [Supabase](https://supabase.com/dashboard), najlepiej w regionie UE. Hasła bazy oraz klucze `sb_secret_` i `service_role` trzymaj wyłącznie po stronie serwera.
2. Uruchom w **SQL Editor** `supabase/migrations/20261029_content_studio.sql`, a następnie `supabase/seed.sql`. Import jest bezpieczny przy ponownym wykonaniu — nie nadpisze edytowanych dokumentów. Seed można odtworzyć przez `node tools/generate-content-seed.mjs`.
3. Zastosuj drugą migrację `supabase/migrations/20261029_editor_email_allowlist.sql`. Na działającej bazie Partyjniak już jest zastosowana: dopuszcza wyłącznie potwierdzone konto z adresem **`contact@swawole.studio`**. Nie trzeba znać UUID użytkownika.
4. W [Supabase Dashboard → Authentication → Users](https://supabase.com/dashboard/project/astcatgvvliatokqalhd/auth/users) wybierz **Add user → Send invitation** i zaproś `contact@swawole.studio`. Zaproszenie konta Auth to jedyny konieczny ręczny krok — podłączona integracja nie ma uprawnień do zarządzania kontami Authentication. Nie twórz użytkownika bezpośrednio przez SQL.
5. W [Authentication → URL Configuration](https://supabase.com/dashboard/project/astcatgvvliatokqalhd/auth/url-configuration) ustaw **Site URL** na `https://jacekmiecznikowski.github.io/impostor/` i dodaj ten sam dokładny adres do **Redirect URLs**. Zastępuje to domyślny `http://localhost:3000`.
6. Supabase na darmowym planie może blokować edycję szablonów maili bez własnego SMTP — **nie konfiguruj płatnego SMTP**. Panel wykorzystuje domyślny **Magic Link**, a nie kod OTP. Otwórz https://jacekmiecznikowski.github.io/impostor/, kliknij **Wyślij link logowania**, a w e-mailu kliknij **Sign in**. Po przekierowaniu panel sam zapisze sesję i otworzy siedem gier. Przy pierwszym uruchomieniu sprawdź, czy konto jest na liście redaktorów. Nie przesyłaj nikomu linku logowania, tokenu ani hasła.


## Hosting panelu

Panel jest statyczny, bez osobnego serwera i bez sekretów. Można go opublikować na **Cloudflare Pages** jako osobny projekt pod własną domeną HTTPS: root directory `admin`, build command: puste, output directory: `.`. Nagłówki bezpieczeństwa są w `admin/_headers`. Wygodna domena to np. `studio.twojadomena.pl`.

## Redagowanie

Wybierz grę, kategorię albo talię, zmieniaj pola i sprawdzaj podgląd. **Zapisz szkic** przechowuje zmiany, ale nie udostępnia ich graczom. **Opublikuj** udostępnia nową wersję przy kolejnym uruchomieniu gry z internetem. **Historia** pozwala przywrócić wersję jako szkic; nie publikuje jej samodzielnie. Import/eksport JSON pozwala masowo uzupełniać dane. Kontrola numeru rewizji zapobiega przypadkowemu nadpisywaniu pracy innego redaktora.

## Podłączenie APK do bazy

Projekt Supabase jest już skonfigurowany w `assets/js/shared/content-config.js`. Przykład formatu połączenia:
```js
window.PARTYJNIAK_CONTENT_SUPABASE = Object.freeze({
  url: 'https://identyfikator.supabase.co',
  publishableKey: 'sb_publishable_...'
});
```
Klucz publishable można bezpiecznie umieścić w APK — sam nie daje praw do szkiców ani edycji; kontrolę dostępu zapewnia baza. Nowe APK potrzebne jest **tylko do pierwszego podłączenia** bazy. Późniejsze publikowanie tekstów nie wymaga aktualizacji aplikacji. Zasoby lokalne i cache pozostają na wypadek braku sieci.

## Bezpieczeństwo

- Żadna tabela nie ma grantów dla `anon` ani `authenticated`; edycje przechodzą przez kontrolowane funkcje RPC z weryfikacją redaktora i przypiętym `search_path`.
- Publiczna funkcja `party_get_published` zwraca **wyłącznie opublikowany** dokument. Szkic i historia pozostają prywatne.
- Panel wstawia treści przy użyciu `textContent`, bez wykonywania HTML. Tokeny sesji są w `sessionStorage`, a publiczny URL i klucz w `localStorage`.
- Nie przechowujemy danych osobowych graczy, tylko treści imprezowych gier.
- Konto Dashboard warto chronić MFA i włączyć backupy bazy.

**Stan prac:** Supabase Free `astcatgvvliatokqalhd` jest uruchomiony. Migracje i 663 pozycji siedmiu gier są wdrożone, a uprawnienia adresu redaktora skonfigurowane. Brakuje jeszcze utworzenia konta przez zaproszenie Auth i przeprowadzenia testu rzeczywistego logowania, zapisu, publikacji i przywrócenia wersji.

## Weryfikacja

```bash
npm test
npm run build:web
npm run studio
node tools/generate-content-seed.mjs --check
```

## Darmowy hosting panelu: GitHub Pages

Supabase Edge Functions nie może hostować HTML na domyślnej domenie — Supabase zmienia Content-Type odpowiedzi na `text/plain`. Z tego powodu formularz jest wdrażany **na GitHub Pages**, a Supabase odpowiada tylko za bazę i logowanie.

GitHub Pages został automatycznie aktywowany dla gałęzi `gh-pages`. Publikacja zakończyła się sukcesem. Panel jest dostępny pod adresem:

**https://jacekmiecznikowski.github.io/impostor/**

Gałąź `gh-pages` zawiera tylko cztery statyczne pliki edytora i `.nojekyll`. Workflow `.github/workflows/publish-content-studio.yml` aktualizuje stronę automatycznie po zmianach w katalogu `admin/` na gałęzi projektowej lub po scaleniu do `main`. Źródłem prawdy pozostaje `admin/`. W stronie nie ma żadnych kluczy sekretów; edycja szkiców wymaga zalogowania i weryfikacji uprawnień PostgreSQL.

Stary adres Supabase Edge Function przekierowuje na GitHub Pages, ponieważ Supabase na domyślnej domenie celowo zastępuje `text/html` przez `text/plain`.


## Pakiet rozszerzony: 2026-10

Wersja początkowa to 663 karty, pytania, hasła i skale. Plik `content/expansions/20261029-party-pack.pl.json` dodaje 197 nowych, ręcznie dobranych pozycji do wszystkich siedmiu gier, bez usuwania wcześniejszych wpisów (razem **860**). Skrypt `supabase/data/20261029_party_pack.sql` zapisuje wersję startową w historii, waliduje nowe dane w PostgreSQL i publikuje je atomowo jako rewizję 2. Jego ponowne wykonanie zostaje świadomie zablokowane — zapobiega to zdublowaniu zawartości.

Rozbudowany zestaw jest publicznie dostępny po odświeżeniu gry z internetem. Pierwszy start całkowicie offline korzysta z oryginalnego pakietu 663 pozycji zapisanych w APK.

## Baza Impostora — aktualna rewizja (2026-10-29)

W opublikowanym dokumencie Supabase (`impostor/pl`, rewizja **36**) jest **1868 unikalnych haseł w 35 kategoriach**. Każde hasło ma dokładnie **trzy różne podpowiedzi**; najmniejsza kategoria ma 47 haseł. Rozszerzony, wersjonowany eksport zgodny z formatem Content Studio znajduje się w `content/impostor-expanded.pl.json`.

Kategoria `dla_doroslych` zawiera **151 haseł 18+**, w tym 100 odważniejszych skojarzeń dla dorosłych. Nie jest włączana przez zbiorcze „Wszystkie”; w grze wymagane jest osobne potwierdzenie włączenia.

**Istotne rozróżnienie:** powyższe liczby dotyczą *opublikowanej bazy zdalnej*, a tabela na początku dokumentu opisuje nadal pierwotny, niewielki seed i lokalny pakiet w APK. Po uruchomieniu z internetem aplikacja pobiera aktualny katalog i przechowuje go w pamięci podręcznej na użytek gry offline. Na świeżym urządzeniu bez wcześniejszej synchronizacji pozostaje mniejszy lokalny zestaw. W celu przeniesienia całości do nowej bazy użyj wersjonowanego eksportu JSON zamiast ponownie uruchamiać stary skrypt rozszerzający rewizję 2.

## Redakcja pod kątem grywalności

Hasło w Impostorze powinno być **łatwo rozpoznawalnym pojęciem**, a nie opowieścią do odtworzenia słowo w słowo. Nie wprowadzamy sztywnego ograniczenia do dwóch wyrazów: np. „Ślad po szmince” lub znany tytuł są pełnoprawnymi hasłami. Odrzucamy za to sztuczne scenki i niejednoznaczne konstrukcje. Zmieniono 61 sformułowań w zwykłych kategoriach oraz rozpoczęto redakcję 18+, w tym „Niezręczna cisza”, „Feromony”, „Ślad po szmince”; usunięto dwie wyjątkowo nienaturalne pozycje.

**Kontynuacja redakcji 18+:** nadal wymaga pełnego ręcznego przeglądu. Zbiorcza operacja porządkująca pozostałe hasła nie została zastosowana; GitHub i Supabase pozostają zsynchronizowane na opublikowanej wersji.
