-- Partyjniak: only a verified allowlisted mailbox can edit.
begin;
create table if not exists private.party_editor_email_allowlist (
  email text primary key,
  added_at timestamptz not null default now()
);
alter table private.party_editor_email_allowlist enable row level security;
revoke all on private.party_editor_email_allowlist from public, anon, authenticated;
insert into private.party_editor_email_allowlist(email)
values ('contact@swawole.studio') on conflict do nothing;
create or replace function private.party_is_editor()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from auth.users u
    join private.party_editor_email_allowlist a on a.email = lower(u.email)
    where u.id = auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function private.party_is_editor() from public, anon, authenticated;
commit;
