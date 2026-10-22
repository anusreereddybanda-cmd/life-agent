# Frontend Integration Plan (not applied yet)

The existing Antigravity React + Vite frontend is **not touched** by this folder. When you approve,
these are the only changes needed **in the frontend folder**.

## 1. Install (frontend folder only)
```
npm install @supabase/supabase-js
```

## 2. Environment variables
Create `.env.local` in the frontend folder (ensure it is git-ignored):
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```
Restart `npm run dev` after editing. Never use the service_role key here.

## 3. One client file: `src/lib/supabaseClient.js`
```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

## 4. Auth (email/password)
```js
await supabase.auth.signUp({ email, password, options: { data: { display_name } } })
await supabase.auth.signInWithPassword({ email, password })
await supabase.auth.signOut()
supabase.auth.onAuthStateChange((event, session) => { /* update app state */ })
```
Protected pages should check the session, but remember: the real protection is RLS.

## 5. Data access examples
```js
// Omit user_id: it defaults to the logged-in user.
await supabase.from('memories').insert({ title, description, memory_date })
await supabase.from('memories').select('*').order('memory_date', { ascending: false })
await supabase.from('education_memories').select('*').eq('level', 'btech')
```

## 6. Private photos
Upload, then record metadata:
```js
const { data: { user } } = await supabase.auth.getUser()
const photoId = crypto.randomUUID()
const path = `${user.id}/${photoId}.${ext}`

const { error: upErr } = await supabase.storage.from('memory-photos').upload(path, file, { contentType: file.type })
if (!upErr) {
  const { error } = await supabase.from('photos').insert({
    id: photoId, storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size
  })
  if (error) await supabase.storage.from('memory-photos').remove([path]) // clean up
}
```
Display with a signed URL:
```js
const { data } = await supabase.storage.from('memory-photos').createSignedUrl(path, 3600)
```
Delete both parts: remove the file from Storage, then delete the `photos` row.

## 7. Suggested rollout order
Client + login → profile → memories → education → family/friends → events → photos → link tables.
Test each step against the real project before the next. Replace local/mock data screen by screen,
keeping the current UI and styling.
