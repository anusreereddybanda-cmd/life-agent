-- =============================================================================
-- 0001_extensions_and_helpers.sql
-- Shared helper functions used by later migrations.
-- Safe to re-run (uses CREATE OR REPLACE).
-- =============================================================================

-- Keeps the "updated_at" column current whenever a row is updated.
-- search_path is pinned to empty so the function cannot be hijacked by a
-- look-alike object in another schema.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
