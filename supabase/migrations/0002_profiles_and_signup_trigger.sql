-- =============================================================================
-- 0002_profiles_and_signup_trigger.sql
-- One profile row per user, created automatically at signup.
-- Requires: 0001
-- Safe to re-run.
-- =============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text check (display_name is null or char_length(display_name) <= 100),
  bio           text check (bio is null or char_length(bio) <= 2000),
  date_of_birth date check (date_of_birth is null or date_of_birth >= date '1900-01-01'),
  -- Path of the avatar inside the private "memory-photos" bucket.
  -- Must start with the user's own id (their folder).
  avatar_path   text check (avatar_path is null or split_part(avatar_path, '/', 1) = id::text),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Lock the table immediately. With RLS on and no policies yet, nobody
-- using the public API can read or write it. Policies come in 0006.
alter table public.profiles enable row level security;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Signup trigger: creates the profile for the NEW user only.
--
-- Security notes:
--  * SECURITY DEFINER lets it insert even though no client may insert for others.
--  * It only ever uses NEW.id (the user being created) - it cannot touch any
--    other user's profile.
--  * search_path is empty, and every object is schema-qualified.
--  * display_name comes from signup metadata, trimmed and length-limited.
--  * ON CONFLICT DO NOTHING means it never overwrites an existing profile.
--  * EXECUTE is revoked from all API roles so it cannot be called directly.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), 100), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
