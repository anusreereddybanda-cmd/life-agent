-- =============================================================================
-- verify_setup.sql  -  READ-ONLY checks. Run AFTER migrations 0001-0007.
-- Contains only SELECT statements; it changes nothing.
-- Run each block separately in the SQL Editor and compare with "Expect".
-- =============================================================================

-- 1) Tables in public WITHOUT row level security.   Expect: 0 rows
select tablename
from pg_tables
where schemaname = 'public' and not rowsecurity;

-- 2) The 11 app tables exist.                       Expect: 11 rows
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles','memories','education_memories','family_members',
                    'friends','achievements','milestones','special_occasions',
                    'photos','memory_photos','memory_people')
order by tablename;

-- 3) Policies per table.  Expect: profiles = 3; memory_* and the other 8 = 4 each
select tablename, count(*) as policy_count
from pg_policies
where schemaname = 'public'
group by tablename
order by tablename;

-- 4) Any policy that applies to anon/public?        Expect: 0 rows
select tablename, policyname, roles
from pg_policies
where schemaname in ('public', 'storage')
  and (roles && array['anon', 'public']::name[])
  and (schemaname = 'public' or policyname like 'memory_photos_%');

-- 5) The anon role has no table privileges.         Expect: 0 rows
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon';

-- 6) Bucket exists and is PRIVATE.                  Expect: public = false
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'memory-photos';

-- 7) Storage policies present.                      Expect: 4 rows
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname like 'memory_photos_%'
order by policyname;

-- 8) Signup trigger present.                        Expect: 1 row
select tgname
from pg_trigger
where tgname = 'on_auth_user_created' and not tgisinternal;
