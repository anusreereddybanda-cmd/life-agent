-- =============================================================================
-- 0006_row_level_security.sql
-- Table privileges + Row Level Security policies for every table.
-- Requires: 0002, 0003, 0004, 0005
-- Safe to re-run (drops and recreates policies by name).
--
-- Rules:
--   * Only the "authenticated" role (logged-in users) gets access. "anon" gets nothing.
--   * SELECT/UPDATE/DELETE: only rows where user_id = auth.uid().
--   * INSERT/UPDATE: WITH CHECK also forces user_id = auth.uid(), so a user can
--     never create a row for someone else or hand a row to someone else.
--   * Link tables additionally verify that BOTH linked records belong to the user.
--   * (select auth.uid()) is used so Postgres evaluates it once per query.
-- =============================================================================

-- ---- 1. Privileges ----------------------------------------------------------
revoke all on table
  public.profiles, public.memories, public.education_memories,
  public.family_members, public.friends, public.achievements,
  public.milestones, public.special_occasions, public.photos,
  public.memory_photos, public.memory_people
from anon;

grant select, insert, update, delete on table
  public.memories, public.education_memories,
  public.family_members, public.friends, public.achievements,
  public.milestones, public.special_occasions, public.photos,
  public.memory_photos, public.memory_people
to authenticated;

-- Profiles are removed only through account deletion (cascade), never by the client.
grant select, insert, update on table public.profiles to authenticated;

-- ---- 2. Make sure RLS is on everywhere --------------------------------------
alter table public.profiles           enable row level security;
alter table public.memories           enable row level security;
alter table public.education_memories enable row level security;
alter table public.family_members     enable row level security;
alter table public.friends            enable row level security;
alter table public.achievements       enable row level security;
alter table public.milestones         enable row level security;
alter table public.special_occasions  enable row level security;
alter table public.photos             enable row level security;
alter table public.memory_photos      enable row level security;
alter table public.memory_people      enable row level security;

-- ---- 3. profiles (keyed by id, not user_id) ---------------------------------
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

-- Normally the signup trigger creates the profile. This lets a user create ONLY
-- their own profile if it is ever missing (e.g. accounts made before the trigger).
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---- 4. Standard "owner only" tables ----------------------------------------
-- The same four policies are generated for each table below.
do $$
declare
  t text;
begin
  foreach t in array array[
    'memories', 'education_memories', 'family_members', 'friends',
    'achievements', 'milestones', 'special_occasions', 'photos'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = (select auth.uid()))',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = (select auth.uid()))',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = (select auth.uid()))',
      t || '_delete_own', t);
  end loop;
end
$$;

-- ---- 5. memory_photos: validate ownership of memory AND photo ---------------
drop policy if exists memory_photos_select_own on public.memory_photos;
create policy memory_photos_select_own on public.memory_photos
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists memory_photos_insert_own on public.memory_photos;
create policy memory_photos_insert_own on public.memory_photos
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.memories m
                where m.id = memory_photos.memory_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.photos p
                where p.id = memory_photos.photo_id and p.user_id = (select auth.uid()))
  );

drop policy if exists memory_photos_update_own on public.memory_photos;
create policy memory_photos_update_own on public.memory_photos
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.memories m
                where m.id = memory_photos.memory_id and m.user_id = (select auth.uid()))
    and exists (select 1 from public.photos p
                where p.id = memory_photos.photo_id and p.user_id = (select auth.uid()))
  );

drop policy if exists memory_photos_delete_own on public.memory_photos;
create policy memory_photos_delete_own on public.memory_photos
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---- 6. memory_people: validate ownership of memory AND the tagged person ---
drop policy if exists memory_people_select_own on public.memory_people;
create policy memory_people_select_own on public.memory_people
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists memory_people_insert_own on public.memory_people;
create policy memory_people_insert_own on public.memory_people
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.memories m
                where m.id = memory_people.memory_id and m.user_id = (select auth.uid()))
    and (memory_people.family_member_id is null
         or exists (select 1 from public.family_members f
                    where f.id = memory_people.family_member_id and f.user_id = (select auth.uid())))
    and (memory_people.friend_id is null
         or exists (select 1 from public.friends fr
                    where fr.id = memory_people.friend_id and fr.user_id = (select auth.uid())))
  );

drop policy if exists memory_people_update_own on public.memory_people;
create policy memory_people_update_own on public.memory_people
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.memories m
                where m.id = memory_people.memory_id and m.user_id = (select auth.uid()))
    and (memory_people.family_member_id is null
         or exists (select 1 from public.family_members f
                    where f.id = memory_people.family_member_id and f.user_id = (select auth.uid())))
    and (memory_people.friend_id is null
         or exists (select 1 from public.friends fr
                    where fr.id = memory_people.friend_id and fr.user_id = (select auth.uid())))
  );

drop policy if exists memory_people_delete_own on public.memory_people;
create policy memory_people_delete_own on public.memory_people
  for delete to authenticated
  using (user_id = (select auth.uid()));
