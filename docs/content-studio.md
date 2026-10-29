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

## Baza Impostora — opublikowany katalog (2026-10-29)

Aktualna rewizja `impostor/pl` w Supabase: **56**. Katalog obejmuje **5573 unikalne hasła w 35 kategoriach** (w każdej od **151 do 193**). Każde hasło ma dokładnie **trzy różne podpowiedzi**; podpowiedź nie może być dosłownie tym samym co odpowiedź. W repozytorium przechowujemy kompletny eksport w `content/impostor-expanded.pl.json`, a test `tests/impostor-multi-hints.test.cjs` wymusza minimum 150 haseł na każdą kategorię, brak duplikatów i poprawne wskazówki.

Kategoria `dla_doroslych` zawiera **151 haseł 18+**. Nigdy nie zostaje zaznaczona przez zbiorcze „Wszystkie”; gracz świadomie włącza ją osobno. Dla podpowiedzi obowiązuje ta sama kontrola.

### Kryteria redakcyjne

Priorytetem jest **grywalność przy stole**, nie liczba wyrazów. Hasła mają być jednoznacznymi, znanymi rzeczami, osobami, czynnościami, zjawiskami lub utrwalonymi zwrotami. Frazy takie jak „Ślad po szmince” są odpowiednie, ale opowiadania o dziwnych sytuacjach („Romantyczna kolacja z mikrofalówki”) nie. Rozszerzenie obejmuje sprawdzone i deduplikowane hasła z trzema wskazówkami. Przed kolejną dużą aktualizacją nadal warto przeprowadzić rozgrywki testowe z ludźmi i korygować zbyt specjalistyczne pozycje na podstawie rzeczywistej odgadywalności.

### Aktualizacja APK i offline

Nowe hasła pobierane są przy uruchomieniu gry z internetem, po czym pozostają w pamięci podręcznej na rozgrywki bez sieci. **Sam import haseł nie wymaga nowego APK.** Na całkiem nowym urządzeniu, które nigdy nie pobrało opublikowanych treści, aplikacja nadal ma tylko niewielki lokalny pakiet startowy. Początkowe dane i automatycznie generowany seed opisane we wcześniejszych rozdziałach dotyczą właśnie tego pakietu, nie katalogu zdalnego.


## Tykająca Bomba — rozszerzony zestaw zadań (2026-10-29)

W opublikowanej bazie Supabase (`ticking-bomb/pl`, **rewizja 3**) jest **211 zadań w 8 kategoriach**. Rozszerzenie dodaje **96 nowych tematów** (po 12 na kategorię) i usuwa **7 niemal zdublowanych tematów** z poprzedniej wersji 122-zadaniowej. Każda kategoria zawiera od **25 do 28** zadań.

Tykająca Bomba wymaga tematów, na które gracze mogą szybko podawać **wiele różnych przykładów**, a nie odgadywania jednego hasła. Dodano proste, jednoznaczne zbiory typu „Wymieniajcie gady”, „Wymieniajcie potrawy z makaronem”, „Wymieniajcie rzeczy w sypialni”, „Wymieniajcie rzeczy na kółkach”. Nie dodano trudnych scenek ani wąskich kategorii z jedną poprawną odpowiedzią.

Kompletna, aktualna baza jest też w wersjonowanym pliku `content/ticking-bomb.pl.json` i wejdzie do kolejnej kompilacji APK jako pakiet lokalny. Dotychczasowe wydania pobierają aktualną wersję po uruchomieniu online i zapisują ją w pamięci podręcznej do grania offline. Test `tests/ticking-bomb-content.test.cjs` sprawdza liczbę kategorii, minimalną liczbę zadań na kategorię i brak zduplikowanych tematów.
