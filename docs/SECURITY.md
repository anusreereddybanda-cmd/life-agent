# Security Model

## Principles
- **The database enforces privacy, not the frontend.** The anon/publishable key is public by design;
  Row Level Security (RLS) is what protects data.
- **Default deny.** RLS is enabled on every table at creation. Only explicit policies grant access.
- **Authenticated only.** The `anon` role has all table privileges revoked and no policies.

## Row Level Security
- Standard tables: SELECT / UPDATE / DELETE need `user_id = auth.uid()`.
- INSERT and UPDATE use `WITH CHECK`, so a user cannot create or reassign a row to another user.
- `user_id` defaults to `auth.uid()`; the frontend does not need to send it, and cannot spoof it.
- `profiles` is keyed on `id = auth.uid()`; clients cannot delete profiles (only account deletion cascades).

## Link tables (`memory_photos`, `memory_people`)
Ownership of both sides is validated twice:
1. **Composite foreign keys** `(memory_id, user_id)`, `(photo_id, user_id)`, etc. The database rejects
   any link whose parts have different owners, even for privileged roles.
2. **RLS `WITH CHECK` + `EXISTS`** confirms the memory, photo, family member or friend belongs to the caller.

## Signup trigger (`handle_new_user`)
- `SECURITY DEFINER` with empty `search_path` and schema-qualified names.
- Inserts only a row for `NEW.id`, so it cannot read or modify another user's profile.
- `ON CONFLICT DO NOTHING`: never overwrites an existing profile.
- Reads only `display_name` from signup metadata, trimmed and capped at 100 chars.
- `EXECUTE` revoked from `public`, `anon`, `authenticated`: it cannot be called from the API.

## Photo storage
- Bucket `memory-photos` is **private**, 10 MB limit, JPEG/PNG/WebP only.
- Policies on `storage.objects` require the first folder in the path to equal `auth.uid()`.
- The frontend displays photos through **short-lived signed URLs**, never permanent public URLs.
- `photos.storage_path` has a CHECK constraint forcing the same `<user_id>/` prefix, and rejects `..`.
- Deleting a `photos` row does **not** delete the file. The frontend must remove the file through the
  Storage API as well (see FRONTEND_INTEGRATION.md).

## Secrets
| Item | Where it may live |
|---|---|
| Project URL, anon/publishable key | Frontend `.env.local` (`VITE_` variables) |
| service_role / secret key | Never in the browser or git; only in a server/Edge Function if ever needed |
| Database password, JWT secret | Password manager only |

Anything starting with `VITE_` is bundled into public JavaScript. Never put a secret in one.

## Known limitations / future work
- Email/password only; add rate limiting, password policy and Google login later in Auth settings.
- Orphaned files are possible if an upload succeeds but the metadata insert fails; the frontend should clean up.
- Account deletion requires a server-side step (Edge Function) because it needs the service-role key.
