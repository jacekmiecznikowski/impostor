-- Partyjniak Content Studio · Supabase PostgreSQL
-- Run in a NEW Supabase project as postgres. Never execute service-role SQL in the mobile app.
-- Only published data is visible anonymously; unpublished drafts remain private.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.party_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.party_content_documents (
  game_id text not null check (game_id in (
    'impostor', 'ticking-bomb', 'naokolo', 'co-mam-na-mysli',
    'synchronizacja', 'trzy-w-piec', 'dzika-karta'
  )),
  locale text not null default 'pl' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  draft jsonb not null,
  published jsonb,
  revision integer not null default 1 check (revision > 0),
  published_revision integer,
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by uuid,
  primary key (game_id, locale),
  check (octet_length(draft::text) <= 750000),
  check (published is null or octet_length(published::text) <= 750000)
);

create table if not exists private.party_content_history (
  id bigint generated always as identity primary key,
  game_id text not null,
  locale text not null,
  revision integer not null,
  action text not null check (action in ('save', 'publish', 'restore')),
  snapshot jsonb not null,
  changed_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists party_content_history_document_idx
  on private.party_content_history(game_id, locale, id desc);

alter table private.party_editors enable row level security;
alter table public.party_content_documents enable row level security;
alter table private.party_content_history enable row level security;

revoke all on table private.party_editors from public, anon, authenticated;
revoke all on table private.party_content_history from public, anon, authenticated;
revoke all on table public.party_content_documents from public, anon, authenticated;
revoke all on all sequences in schema private from public, anon, authenticated;

-- Every security-definer function uses an empty search_path and explicit schema names.
create or replace function private.party_is_editor()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from private.party_editors where user_id = auth.uid()
  );
$$;
revoke all on function private.party_is_editor() from public, anon, authenticated;

create or replace function private.party_validate_document(
  p_game text, p_locale text, p_data jsonb
) returns boolean language plpgsql stable set search_path = ''
as $$
declare
  category jsonb;
  entry jsonb;
  key_name text;
  category_id text;
  known_categories text[] := array[]::text[];
  entry_count integer;
begin
  if p_game not in ('impostor','ticking-bomb','naokolo','co-mam-na-mysli','synchronizacja','trzy-w-piec','dzika-karta')
     or p_locale !~ '^[a-z]{2}(-[A-Z]{2})?$' then
    raise exception 'Nieobsługiwana gra lub język.';
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object'
     or p_data->>'game' is distinct from p_game
     or p_data->>'locale' is distinct from p_locale
     or p_data->>'schemaVersion' is distinct from '1'
     or octet_length(p_data::text) > 750000 then
    raise exception 'Nieprawidłowy dokument lub zbyt duży rozmiar.';
  end if;
  if p_game = 'dzika-karta' then
    if jsonb_typeof(p_data->'prompts') <> 'array'
      or jsonb_typeof(p_data->'answers') <> 'array'
      or jsonb_array_length(p_data->'prompts') < 3
      or jsonb_array_length(p_data->'answers') < 10
      or jsonb_array_length(p_data->'prompts') > 1000
      or jsonb_array_length(p_data->'answers') > 3000 then
      raise exception 'Dzika Karta wymaga co najmniej 3 pytań i 10 odpowiedzi.';
    end if;
    for entry in select value from jsonb_array_elements(p_data->'prompts') loop
      if jsonb_typeof(entry) <> 'string' or length(trim(entry #>> '{}')) not between 1 and 180 then
        raise exception 'Nieprawidłowe pytanie Dzikiej Karty.';
      end if;
    end loop;
    for entry in select value from jsonb_array_elements(p_data->'answers') loop
      if jsonb_typeof(entry) <> 'string' or length(trim(entry #>> '{}')) not between 1 and 120 then
        raise exception 'Nieprawidłowa odpowiedź Dzikiej Karty.';
      end if;
    end loop;
    return true;
  end if;
  if jsonb_typeof(p_data->'categories') <> 'array'
    or jsonb_array_length(p_data->'categories') not between 1 and 100 then
    raise exception 'Gra wymaga od 1 do 100 kategorii.';
  end if;
  key_name := case p_game
    when 'naokolo' then 'cards'
    when 'synchronizacja' then 'scales'
    when 'trzy-w-piec' then 'prompts'
    else 'words' end;
  for category in select value from jsonb_array_elements(p_data->'categories') loop
    category_id := category->>'id';
    if category_id is null or category_id !~ '^[a-z0-9][a-z0-9_-]{0,39}$'
      or category_id = any(known_categories)
      or length(coalesce(category->>'name','')) not between 1 and 60
      or length(coalesce(category->>'desc','')) > 160
      or coalesce(category->>'icon','fa-layer-group') !~ '^fa-[a-z0-9-]+$'
      or jsonb_typeof(category->key_name) <> 'array' then
      raise exception 'Nieprawidłowe metadane kategorii %.', coalesce(category_id, '?');
    end if;
    known_categories := array_append(known_categories, category_id);
    entry_count := jsonb_array_length(category->key_name);
    if entry_count not between 1 and 500 then
      raise exception 'Kategoria % wymaga od 1 do 500 pozycji.', category_id;
    end if;
    for entry in select value from jsonb_array_elements(category->key_name) loop
      if jsonb_typeof(entry) <> 'object' then
        raise exception 'Nieprawidłowy typ pozycji w kategorii %.', category_id;
      end if;
      if p_game = 'naokolo' then
        if length(coalesce(entry->>'word','')) not between 1 and 80
          or jsonb_typeof(entry->'forbidden') <> 'array'
          or jsonb_array_length(entry->'forbidden') not between 3 and 6 then
          raise exception 'Naokoło: hasło i 3–6 słów zakazanych są obowiązkowe.';
        end if;
      elsif p_game = 'synchronizacja' then
        if length(coalesce(entry->>'id','')) not between 1 and 60
          or length(coalesce(entry->>'left','')) not between 1 and 80
          or length(coalesce(entry->>'right','')) not between 1 and 80
          or entry->>'left' = entry->>'right' then
          raise exception 'Synchronizacja wymaga ID i dwóch różnych biegunów.';
        end if;
      elsif p_game = 'trzy-w-piec' then
        if length(coalesce(entry->>'id','')) not between 1 and 60
          or length(coalesce(entry->>'text','')) not between 1 and 180 then
          raise exception 'Trzy w Pięć wymaga ID i treści pytania.';
        end if;
      else
        if length(coalesce(entry->>'word','')) not between 1 and 80
          or length(coalesce(entry->>'hint','')) > 80 then
          raise exception 'Nieprawidłowe hasło lub podpowiedź.';
        end if;
      end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke all on function private.party_validate_document(text,text,jsonb) from public, anon, authenticated;

-- This is the ONLY endpoint that unauthenticated phones can call. No drafts.
create or replace function public.party_get_published(p_game text, p_locale text default 'pl')
returns jsonb language sql stable security definer set search_path = ''
as $$
  select published from public.party_content_documents
   where game_id = p_game and locale = p_locale
     and p_game in ('impostor','ticking-bomb','naokolo','co-mam-na-mysli','synchronizacja','trzy-w-piec','dzika-karta');
$$;
revoke all on function public.party_get_published(text,text) from public, anon, authenticated;
grant execute on function public.party_get_published(text,text) to anon, authenticated;

create or replace function public.party_editor_list()
returns setof public.party_content_documents
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.party_is_editor() then raise exception 'Brak dostępu do panelu.' using errcode = '42501'; end if;
  return query select * from public.party_content_documents order by game_id, locale;
end;
$$;
revoke all on function public.party_editor_list() from public, anon, authenticated;
grant execute on function public.party_editor_list() to authenticated;

create or replace function public.party_editor_save(
  p_game text, p_locale text, p_draft jsonb, p_revision integer
) returns integer language plpgsql security definer set search_path = ''
as $$
declare
  next_revision integer;
begin
  if not private.party_is_editor() then raise exception 'Brak uprawnień.' using errcode = '42501'; end if;
  perform private.party_validate_document(p_game, p_locale, p_draft);
  update public.party_content_documents
    set draft = p_draft, revision = revision + 1, updated_at = now(), updated_by = auth.uid()
    where game_id = p_game and locale = p_locale and revision = p_revision
    returning revision into next_revision;
  if next_revision is null then raise exception 'Konflikt wersji. Odśwież dane przed zapisem.' using errcode = 'P0001'; end if;
  insert into private.party_content_history(game_id,locale,revision,action,snapshot,changed_by)
    values(p_game,p_locale,next_revision,'save',p_draft,auth.uid());
  return next_revision;
end;
$$;
revoke all on function public.party_editor_save(text,text,jsonb,integer) from public, anon, authenticated;
grant execute on function public.party_editor_save(text,text,jsonb,integer) to authenticated;

create or replace function public.party_editor_publish(
  p_game text, p_locale text, p_revision integer
) returns integer language plpgsql security definer set search_path = ''
as $$
declare
  current_doc public.party_content_documents%rowtype;
begin
  if not private.party_is_editor() then raise exception 'Brak uprawnień.' using errcode = '42501'; end if;
  select * into current_doc from public.party_content_documents
    where game_id = p_game and locale = p_locale for update;
  if not found or current_doc.revision <> p_revision then
    raise exception 'Konflikt wersji. Odśwież dane przed publikacją.';
  end if;
  perform private.party_validate_document(p_game,p_locale,current_doc.draft);
  update public.party_content_documents
    set published = draft, published_revision = revision,
        published_at = now(), updated_by = auth.uid()
    where game_id = p_game and locale = p_locale;
  insert into private.party_content_history(game_id,locale,revision,action,snapshot,changed_by)
    values(p_game,p_locale,p_revision,'publish',current_doc.draft,auth.uid());
  return p_revision;
end;
$$;
revoke all on function public.party_editor_publish(text,text,integer) from public, anon, authenticated;
grant execute on function public.party_editor_publish(text,text,integer) to authenticated;

create or replace function public.party_editor_history(p_game text,p_locale text)
returns table (id bigint, revision integer, action text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  if not private.party_is_editor() then raise exception 'Brak uprawnień.' using errcode = '42501'; end if;
  return query select h.id,h.revision,h.action,h.created_at
    from private.party_content_history h
    where h.game_id=p_game and h.locale=p_locale order by h.id desc limit 50;
end;
$$;
revoke all on function public.party_editor_history(text,text) from public, anon, authenticated;
grant execute on function public.party_editor_history(text,text) to authenticated;

create or replace function public.party_editor_restore(
  p_game text,p_locale text,p_history_id bigint,p_revision integer
) returns integer language plpgsql security definer set search_path = ''
as $$
declare
  restored jsonb;
begin
  if not private.party_is_editor() then raise exception 'Brak uprawnień.' using errcode = '42501'; end if;
  select snapshot into restored from private.party_content_history
    where id=p_history_id and game_id=p_game and locale=p_locale;
  if restored is null then raise exception 'Nie znaleziono wersji archiwalnej.'; end if;
  -- Restoring changes only the draft, never the live published content.
  return public.party_editor_save(p_game,p_locale,restored,p_revision);
end;
$$;
revoke all on function public.party_editor_restore(text,text,bigint,integer) from public, anon, authenticated;
grant execute on function public.party_editor_restore(text,text,bigint,integer) to authenticated;

commit;

-- Grant editor access AFTER creating a user in Authentication > Users:
-- insert into private.party_editors(user_id)
-- select id from auth.users where email = 'twoj-adres@example.com'
-- on conflict do nothing;
