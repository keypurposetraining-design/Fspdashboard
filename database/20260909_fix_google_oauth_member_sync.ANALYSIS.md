# Analysis: `20260909_fix_google_oauth_member_sync.sql`

**Reviewed:** 2026-09-24
**File:** [database/20260909_fix_google_oauth_member_sync.sql](20260909_fix_google_oauth_member_sync.sql)
**Related code:** [src/components/auth/AuthProvider.tsx](../src/components/auth/AuthProvider.tsx), [src/app/api/auth/sync/route.ts](../src/app/api/auth/sync/route.ts), [database/supabase_migrations.sql](supabase_migrations.sql)

---

## 1. What the migration does

| # | Section | Effect |
|---|---------|--------|
| 1 | Unique constraint (L14–27) | Deletes duplicate `members` rows (keeps the oldest per `user_id`), then adds `members_user_id_unique`. |
| 2 | `handle_new_user()` (L30–135) | Trigger function. Builds a name from Google metadata (`full_name` → `name` → `given_name family_name` → email prefix), upserts `public.users`, upserts `public.members`, and creates an `active` membership if none exists. |
| 3 | Trigger (L138–141) | Re-creates `on_auth_user_created` as `AFTER INSERT OR UPDATE` on `auth.users`, so every auth-row update also runs the sync. |
| 4 | Backfill (L144–203) | Loops over all `auth.users` and applies the same upserts to existing accounts. |
| 5 | `sync_current_user()` RPC (L208–326) | The same logic for the caller (`auth.uid()`), returned as JSONB. `AuthProvider` calls it when no `public.users` row is found, and so does `POST /api/auth/sync`. |

Flow on Google sign-in:

```
Google OAuth ─► auth.users INSERT/UPDATE ─► handle_new_user()
                                              ├─ upsert public.users   (id = auth id)
                                              ├─ upsert public.members (user_id unique)
                                              └─ insert public.memberships ('active') if none
Client: AuthProvider.fetchUserProfile ─► users row missing? ─► rpc('sync_current_user') ─► refetch
```

## 2. What works well

- **Idempotent.** It uses `ON CONFLICT` upserts, `IF NOT EXISTS` on the constraint, and `DROP TRIGGER IF EXISTS`, so it can be re-run safely (with the exceptions in §3).
- **Won't overwrite data a person entered.** Names are replaced only when they are empty or still equal to the email prefix.
- **Existing roles are kept.** The trigger and RPC keep `public.users.role` once it is set, and the backfill never updates `role` on conflict.
- **`SECURITY DEFINER ... SET search_path = public`** is correct and prevents search-path hijacking.
- **Self-healing path.** The RPC plus the client fallback cover accounts created before the trigger existed.

## 3. Issues found

### 🔴 Critical

**3.1 Privilege escalation: role comes from user-controlled metadata**
Lines 71, 166, 256: `v_role := COALESCE(new.raw_user_meta_data->>'role', 'member')`.
In Supabase, `raw_user_meta_data` is **written by the client**, through `supabase.auth.signUp({ options: { data: { role: 'super_admin' } } })` or `supabase.auth.updateUser({ data: { role: 'admin' } })`. Anyone can sign up as `admin`/`super_admin`, and `is_admin()` will trust it.
- **Fix:** never read the role from `raw_user_meta_data`. Default to `'member'`. If a trusted source is needed, use `raw_app_meta_data` (only the service role can write it).

**3.2 An email collision blocks sign-in**
`public.users.email` is `UNIQUE`, but the upsert only handles `ON CONFLICT (id)`. Suppose a `public.users` row already exists with the same email and a different id (the "drifted id" case that `supabase_migrations.sql` §"Auth/profile link repair" documents). The INSERT then raises `unique_violation`:
- inside the **trigger**, this aborts the `auth.users` insert/update, so Google sign-in fails with *"Database error saving new user"*;
- inside the **backfill**, the whole `DO` block rolls back.
- **Fix:** run the id-alignment repair first, or handle the email conflict explicitly (for example, look up by email and re-point it, or wrap the sync in `BEGIN ... EXCEPTION WHEN unique_violation THEN RAISE WARNING ... END` so auth never fails).

### 🟠 High

**3.3 Any trigger error now breaks every login, not just signup**
With `AFTER INSERT OR UPDATE`, the function runs on every `auth.users` update, including `last_sign_in_at` on each login and email confirmations. Any exception (constraint, RLS, enum, the email clash above) now blocks **existing** users from logging in.
- **Fix:** add an exception guard so the trigger never fails auth. Also consider `AFTER UPDATE OF raw_user_meta_data, email` so it doesn't run on every sign-in.

**3.4 The dedup DELETE can fail or be incomplete**
- `members.id` is referenced by `memberships`, `course_enrollments`, `payments`, and others **without `ON DELETE CASCADE`**. Deleting a duplicate that has any dependents raises an FK violation, and the migration aborts.
- Duplicates with an **identical `created_at`** are not removed, because the check is a strict `>`. `ADD CONSTRAINT` then fails.
- **Fix:** re-point dependents to the surviving member before deleting, and break ties with `id` (`m1.created_at > m2.created_at OR (m1.created_at = m2.created_at AND m1.id > m2.id)`).

**3.5 Every account gets a free `active` membership**
Every user, including admins and pre-existing accounts during the backfill, gets `status = 'active'`, `end_date = NULL`. This bypasses the renewal fee (`app_settings.renewal_fee`, ₹3000) and makes membership-based gating meaningless. The table's own default is `'pending'`.
- **Fix:** insert `'pending'` (or skip admins), unless free lifetime membership is intended.

### 🟡 Medium / Low

**3.6 The same logic is copied three times.** Name parsing and the upserts are repeated in the trigger, the backfill, and the RPC, and the copies have already drifted: the backfill does not set `updated_at` and does not apply the "name = email prefix" replacement rule. Extract a single `public._sync_user(auth_user auth.users)` and call it from all three.

**3.7 Duplicate of the main schema file.** The same function, trigger, and RPC also exist in `supabase_migrations.sql` (L243–870). Whichever runs last wins, so keep one source of truth.

**3.8 Name parsing edge cases.**
- `CONCAT_WS` returns `''`, never `NULL`, so the email-prefix branch of the `COALESCE` is unreachable. The `IF v_full_name = ''` check covers this, so it isn't a bug, just dead code.
- `split_part(...)` never returns `NULL`, so the `, v_full_name` fallback in `v_first_name` is also dead.
- Single-word names give `last_name = ''`, which is fine.

**3.9 `sync_current_user` execute grant.** Functions are executable by `PUBLIC` by default. The `auth.uid() IS NULL` check makes anon calls harmless, but `REVOKE EXECUTE ... FROM PUBLIC, anon;` is cleaner.

**3.10 Backfill runs row by row.** For a small user base this is fine. For thousands of users, a set-based `INSERT ... SELECT ... ON CONFLICT` would be faster and would hold the lock for less time.

**3.11 Client fallback trusts metadata role.** `AuthProvider.tsx` and `api/auth/sync/route.ts` fall back to `user_metadata.role` when the DB row is missing. This only affects the UI (RLS still uses `public.users`), but it can render admin UI to a spoofed user. Fall back to `'member'` instead.

## 4. Recommended changes (priority order)

1. Remove `raw_user_meta_data->>'role'` from all three places. Default to `'member'`. (3.1)
2. Wrap the trigger body in an exception handler so auth never fails, and narrow the trigger to `UPDATE OF email, raw_user_meta_data`. (3.2, 3.3)
3. Run the id/email alignment before the backfill, or handle the email conflict. (3.2)
4. Make the dedup FK-safe and tie-safe. (3.4)
5. Decide on default membership status: `'pending'` vs `'active'`. (3.5)
6. Consolidate into one helper function and remove the duplicate from `supabase_migrations.sql`. (3.6, 3.7)
7. Change the client fallback role to `'member'`. (3.11)

### Sketch of a safer trigger wrapper

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    PERFORM public._sync_user(NEW);          -- shared helper, role defaults to 'member'
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;                                -- never block auth
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. Verification queries (run after applying)

```sql
-- Auth users without a profile / member / membership
SELECT au.id, au.email FROM auth.users au
LEFT JOIN public.users u   ON u.id = au.id
LEFT JOIN public.members m ON m.user_id = au.id
WHERE u.id IS NULL OR m.id IS NULL;

-- Anyone whose role came from metadata (audit for escalation)
SELECT u.id, u.email, u.role, au.raw_user_meta_data->>'role' AS meta_role
FROM public.users u JOIN auth.users au ON au.id = u.id
WHERE u.role IN ('admin','super_admin');

-- Email/id drift that would break the trigger
SELECT u.email, u.id AS public_id, au.id AS auth_id
FROM public.users u JOIN auth.users au ON au.email = u.email
WHERE u.id <> au.id;
```
