-- =============================================================================
-- 0005_photos_and_link_tables.sql
-- Photo METADATA (the image files live in Supabase Storage), plus link tables
-- connecting memories to photos and to family/friends.
-- Requires: 0001, 0003, 0004
-- Safe to re-run.
--
-- Ownership is enforced TWICE:
--   1. Here, with composite foreign keys: (memory_id, user_id) must match a
--      memory that belongs to that SAME user_id. The database itself refuses
--      a link that mixes two owners.
--   2. In 0006, with RLS policies that also check ownership.
-- =============================================================================

create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Object path inside the private "memory-photos" bucket: <user_id>/<file>
  storage_path text not null unique
               check (char_length(storage_path) <= 500
                      and storage_path !~ '\.\.'
                      and split_part(storage_path, '/', 1) = user_id::text),
  file_name    text check (file_name is null or char_length(file_name) <= 255),
  mime_type    text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes   bigint not null check (size_bytes > 0 and size_bytes <= 10485760), -- 10 MB
  caption      text check (caption is null or char_length(caption) <= 1000),
  taken_at     timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (id, user_id)
);
create index if not exists photos_user_created_idx on public.photos (user_id, created_at desc);
alter table public.photos enable row level security;
drop trigger if exists set_photos_updated_at on public.photos;
create trigger set_photos_updated_at
  before update on public.photos
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- memory_photos: which photos belong to which memory (many-to-many).
-- -----------------------------------------------------------------------------
create table if not exists public.memory_photos (
  memory_id  uuid not null,
  photo_id   uuid not null,
  user_id    uuid not null default auth.uid(),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (memory_id, photo_id),
  foreign key (memory_id, user_id) references public.memories (id, user_id) on delete cascade,
  foreign key (photo_id, user_id)  references public.photos (id, user_id)   on delete cascade
);
create index if not exists memory_photos_user_idx  on public.memory_photos (user_id);
create index if not exists memory_photos_photo_idx on public.memory_photos (photo_id);
alter table public.memory_photos enable row level security;

-- -----------------------------------------------------------------------------
-- memory_people: which family members OR friends appear in a memory.
-- Exactly one of family_member_id / friend_id is set on each row.
-- -----------------------------------------------------------------------------
create table if not exists public.memory_people (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid(),
  memory_id        uuid not null,
  family_member_id uuid,
  friend_id        uuid,
  created_at       timestamptz not null default now(),
  check (num_nonnulls(family_member_id, friend_id) = 1),
  foreign key (memory_id, user_id)        references public.memories (id, user_id)        on delete cascade,
  foreign key (family_member_id, user_id) references public.family_members (id, user_id)  on delete cascade,
  foreign key (friend_id, user_id)        references public.friends (id, user_id)         on delete cascade
);
-- No duplicate tagging of the same person in the same memory.
create unique index if not exists memory_people_family_unique
  on public.memory_people (memory_id, family_member_id) where family_member_id is not null;
create unique index if not exists memory_people_friend_unique
  on public.memory_people (memory_id, friend_id) where friend_id is not null;
create index if not exists memory_people_user_idx on public.memory_people (user_id);
alter table public.memory_people enable row level security;
