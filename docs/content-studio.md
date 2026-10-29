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
3. W **Authentication** wyłącz otwartą rejestrację, skonfiguruj dostarczanie poczty i szablon kodu OTP z `{{ .Token }}`. Utwórz konto redaktora w **Authentication → Users**.
4. Dodaj redaktora przez SQL (po zastąpieniu przykładowego adresu):
   ```sql
   insert into private.party_editors(user_id)
   select id from auth.users where email = 'redaktor@example.com'
   on conflict do nothing;
   ```
5. W Supabase **Connect** znajdź adres `https://…supabase.co` i wyłącznie **publishable key** `sb_publishable_…`. To dane publiczne, nie klucze administracyjne.
6. Uruchom `npm run studio` i otwórz `http://127.0.0.1:4174`. Zaloguj się przez OTP. Panel nie przyzna praw edycji kontu nieobecnemu w `private.party_editors`.

## Hosting panelu

Panel jest statyczny, bez osobnego serwera i bez sekretów. Można go opublikować na **Cloudflare Pages** jako osobny projekt pod własną domeną HTTPS: root directory `admin`, build command: puste, output directory: `.`. Nagłówki bezpieczeństwa są w `admin/_headers`. Wygodna domena to np. `studio.twojadomena.pl`.

## Redagowanie

Wybierz grę, kategorię albo talię, zmieniaj pola i sprawdzaj podgląd. **Zapisz szkic** przechowuje zmiany, ale nie udostępnia ich graczom. **Opublikuj** udostępnia nową wersję przy kolejnym uruchomieniu gry z internetem. **Historia** pozwala przywrócić wersję jako szkic; nie publikuje jej samodzielnie. Import/eksport JSON pozwala masowo uzupełniać dane. Kontrola numeru rewizji zapobiega przypadkowemu nadpisywaniu pracy innego redaktora.

## Podłączenie APK do bazy

Po utworzeniu Supabase w `assets/js/shared/content-config.js` wpisz:
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

**Stan prac:** schema, seed i panel są w repozytorium, ale rzeczywisty projekt Supabase nie został jeszcze podłączony. Konieczny będzie test na prawdziwej bazie: anonimowy odczyt, odrzucenie zapisu przez niezalogowanego, logowanie redaktora, publikacja i rollback.

## Weryfikacja

```bash
npm test
npm run build:web
npm run studio
node tools/generate-content-seed.mjs --check
```
