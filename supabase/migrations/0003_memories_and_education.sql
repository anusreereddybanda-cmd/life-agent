-- =============================================================================
-- 0003_memories_and_education.sql
-- Personal memories and education memories (school / intermediate / BTech).
-- Requires: 0001, 0002
-- Safe to re-run.
--
-- Every private table has:
--   user_id  -> the owner. Defaults to the logged-in user (auth.uid()).
--   unique (id, user_id) -> lets link tables prove both sides share one owner.
-- =============================================================================

create table if not exists public.memories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null check (char_length(btrim(title)) between 1 and 200),
  description text check (description is null or char_length(description) <= 10000),
  memory_date date,
  location    text check (location is null or char_length(location) <= 200),
  category    text check (category is null or char_length(category) <= 100),
  mood        text check (mood is null or char_length(mood) <= 50),
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists memories_user_date_idx
  on public.memories (user_id, memory_date desc);

alter table public.memories enable row level security;

drop trigger if exists set_memories_updated_at on public.memories;
create trigger set_memories_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------

create table if not exists public.education_memories (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  level            text not null check (level in ('school', 'intermediate', 'btech')),
  institution_name text not null check (char_length(btrim(institution_name)) between 1 and 200),
  course_or_branch text check (course_or_branch is null or char_length(course_or_branch) <= 200),
  start_year       smallint check (start_year is null or start_year between 1900 and 2100),
  end_year         smallint check (end_year is null or end_year between 1900 and 2100),
  description      text check (description is null or char_length(description) <= 10000),
  grade_or_result  text check (grade_or_result is null or char_length(grade_or_result) <= 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (start_year is null or end_year is null or end_year >= start_year),
  unique (id, user_id)
);

create index if not exists education_memories_user_level_idx
  on public.education_memories (user_id, level, start_year);

alter table public.education_memories enable row level security;

drop trigger if exists set_education_memories_updated_at on public.education_memories;
create trigger set_education_memories_updated_at
  before update on public.education_memories
  for each row execute function public.set_updated_at();
