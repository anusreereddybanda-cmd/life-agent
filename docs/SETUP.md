# Setup via the Supabase Dashboard (beginner steps)

Do these only when you are ready. Nothing here has been run yet.

## A. Create the project (once)
1. Sign in at supabase.com and create a new project.
2. Choose a strong database password and store it in a password manager. **Do not** save it in this folder.
3. Wait until the project finishes provisioning.

## B. Configure email/password auth
1. **Authentication → Providers**: keep **Email** enabled. Leave Google and others off for now.
2. **Authentication → URL Configuration**: set **Site URL** to your frontend address
   (local Vite is usually `http://localhost:5173`). Add the same under **Redirect URLs**.
   Add your live domain later when you deploy.
3. Decide on **Confirm email** (recommended on for a real site; off can be handy while testing).

## C. Apply the SQL in order
Open **SQL Editor → New query**. For each file below: copy the entire file, paste, click **Run**,
and expect `Success. No rows returned` before moving on.

1. `supabase/migrations/0001_extensions_and_helpers.sql`
2. `supabase/migrations/0002_profiles_and_signup_trigger.sql`
3. `supabase/migrations/0003_memories_and_education.sql`
4. `supabase/migrations/0004_people_and_events.sql`
5. `supabase/migrations/0005_photos_and_link_tables.sql`
6. `supabase/migrations/0006_row_level_security.sql`
7. `supabase/migrations/0007_private_photo_storage.sql`

If one fails, **stop** and send me the exact error. Do not skip ahead.

If the Dashboard shows a warning about a "destructive operation" it is reacting to the
`drop policy if exists` / `drop trigger if exists` lines. Those only remove objects this
project created earlier, so confirming is expected on re-runs.

## D. Verify
Run each query in `supabase/verification/verify_setup.sql` one at a time and compare to the
"Expect" comments. They are read-only.

## E. Two-account isolation test (after the frontend has real login)
1. Create two test users (A and B).
2. As A, create a memory and upload a photo.
3. As B, confirm you cannot list, open, update or delete A's rows or files.
4. Confirm a logged-out visitor sees nothing.

## F. Keys you will need later
In **Project Settings → API** you will find:
- **Project URL** and **anon / publishable key** → safe for the frontend.
- **service_role / secret key** → **never** in the frontend, never in git.
