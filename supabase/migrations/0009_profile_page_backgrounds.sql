-- =============================================================================
-- 0009_profile_page_backgrounds.sql
-- Store each private page background path on the owner's existing profile row.
-- Requires: 0002 (profiles), 0006 (profile ownership policies), 0007 (private bucket)
-- Safe to re-run.
-- =============================================================================

alter table public.profiles
  add column if not exists memories_background_path text,
  add column if not exists gallery_background_path text,
  add column if not exists timeline_background_path text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_memories_background_owner_path'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_memories_background_owner_path
      check (
        memories_background_path is null
        or (
          split_part(memories_background_path, '/', 1) = id::text
          and memories_background_path like id::text || '/page-backgrounds/memories/%'
          and memories_background_path !~ '\.\.'
          and char_length(memories_background_path) <= 500
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_gallery_background_owner_path'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_gallery_background_owner_path
      check (
        gallery_background_path is null
        or (
          split_part(gallery_background_path, '/', 1) = id::text
          and gallery_background_path like id::text || '/page-backgrounds/gallery/%'
          and gallery_background_path !~ '\.\.'
          and char_length(gallery_background_path) <= 500
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_timeline_background_owner_path'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_timeline_background_owner_path
      check (
        timeline_background_path is null
        or (
          split_part(timeline_background_path, '/', 1) = id::text
          and timeline_background_path like id::text || '/page-backgrounds/timeline/%'
          and timeline_background_path !~ '\.\.'
          and char_length(timeline_background_path) <= 500
        )
      );
  end if;
end
$$;
