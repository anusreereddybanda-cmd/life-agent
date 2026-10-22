-- =============================================================================
-- 0004_people_and_events.sql
-- Family, friends, achievements, milestones, special occasions.
-- Requires: 0001, 0002
-- Safe to re-run.
-- =============================================================================

create table if not exists public.family_members (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 200),
  relationship text check (relationship is null or char_length(relationship) <= 100),
  birth_date   date,
  notes        text check (notes is null or char_length(notes) <= 5000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists family_members_user_idx on public.family_members (user_id);
alter table public.family_members enable row level security;
drop trigger if exists set_family_members_updated_at on public.family_members;
create trigger set_family_members_updated_at
  before update on public.family_members
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------

create table if not exists public.friends (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(btrim(name)) between 1 and 200),
  how_we_met  text check (how_we_met is null or char_length(how_we_met) <= 2000),
  notes       text check (notes is null or char_length(notes) <= 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists friends_user_idx on public.friends (user_id);
alter table public.friends enable row level security;
drop trigger if exists set_friends_updated_at on public.friends;
create trigger set_friends_updated_at
  before update on public.friends
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------

create table if not exists public.achievements (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title            text not null check (char_length(btrim(title)) between 1 and 200),
  achievement_date date,
  description      text check (description is null or char_length(description) <= 10000),
  category         text check (category is null or char_length(category) <= 100),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists achievements_user_date_idx
  on public.achievements (user_id, achievement_date desc);
alter table public.achievements enable row level security;
drop trigger if exists set_achievements_updated_at on public.achievements;
create trigger set_achievements_updated_at
  before update on public.achievements
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------

create table if not exists public.milestones (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title          text not null check (char_length(btrim(title)) between 1 and 200),
  milestone_date date,
  description    text check (description is null or char_length(description) <= 10000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists milestones_user_date_idx
  on public.milestones (user_id, milestone_date desc);
alter table public.milestones enable row level security;
drop trigger if exists set_milestones_updated_at on public.milestones;
create trigger set_milestones_updated_at
  before update on public.milestones
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------

create table if not exists public.special_occasions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null check (char_length(btrim(title)) between 1 and 200),
  occasion_type text check (occasion_type is null or char_length(occasion_type) <= 100),
  occasion_date date,
  location      text check (location is null or char_length(location) <= 200),
  description   text check (description is null or char_length(description) <= 10000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists special_occasions_user_date_idx
  on public.special_occasions (user_id, occasion_date desc);
alter table public.special_occasions enable row level security;
drop trigger if exists set_special_occasions_updated_at on public.special_occasions;
create trigger set_special_occasions_updated_at
  before update on public.special_occasions
  for each row execute function public.set_updated_at();
