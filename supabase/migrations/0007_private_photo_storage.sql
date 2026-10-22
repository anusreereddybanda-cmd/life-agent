-- =============================================================================
-- 0007_private_photo_storage.sql
-- Private Storage bucket "memory-photos" and its access policies.
-- Requires: 0005 (photos table uses the same path convention)
-- Safe to re-run.
--
-- File path convention:   <user_id>/<anything>.<ext>
--   e.g. 3f2a.../b81c....jpg    or   3f2a.../avatars/me.webp
-- The FIRST folder must equal the logged-in user's id. That single rule is what
-- keeps one user's files invisible to every other user.
-- =============================================================================

-- ---- Bucket: PRIVATE, 10 MB limit, images only ------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memory-photos',
  'memory-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = false,
      file_size_limit    = 10485760,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ---- Policies on storage.objects (authenticated users only) -----------------
drop policy if exists "memory_photos_select_own_folder" on storage.objects;
create policy "memory_photos_select_own_folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "memory_photos_insert_own_folder" on storage.objects;
create policy "memory_photos_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "memory_photos_update_own_folder" on storage.objects;
create policy "memory_photos_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "memory_photos_delete_own_folder" on storage.objects;
create policy "memory_photos_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'memory-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
