-- =============================================================================
-- 0008_gallery_albums.sql
-- Owner-scoped albums and their optional relationship to photos.
-- Requires: 0005 (photos), 0006 (RLS conventions)
-- Safe to re-run.
-- =============================================================================

create table if not exists public.albums (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid()
                      references auth.users (id) on delete cascade,
  title               text not null check (char_length(title) between 1 and 100),
  description         text,
  event_date          date,
  cover_storage_path  text,
  created_at          timestamptz not null default now()
);

create index if not exists albums_user_created_idx
  on public.albums (user_id, created_at desc);
create unique index if not exists albums_id_user_unique
  on public.albums (id, user_id);

alter table public.albums enable row level security;
revoke all on table public.albums from anon;
grant select, insert, update, delete on table public.albums to authenticated;

drop policy if exists albums_select_own on public.albums;
create policy albums_select_own on public.albums
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists albums_insert_own on public.albums;
create policy albums_insert_own on public.albums
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists albums_update_own on public.albums;
create policy albums_update_own on public.albums
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists albums_delete_own on public.albums;
create policy albums_delete_own on public.albums
  for delete to authenticated
  using (user_id = (select auth.uid()));

alter table public.photos
  add column if not exists album_id uuid;

create index if not exists photos_album_user_created_idx
  on public.photos (album_id, user_id, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'photos_album_user_fkey'
      and conrelid = 'public.photos'::regclass
  ) then
    alter table public.photos
      add constraint photos_album_user_fkey
      foreign key (album_id, user_id)
      references public.albums (id, user_id)
      on delete restrict;
  end if;
end
$$;
