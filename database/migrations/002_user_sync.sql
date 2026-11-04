-- ==============================================================================
-- 002_user_sync.sql
-- ==============================================================================
-- Replaces the three drifting copies of the auth -> profile sync (trigger,
-- backfill, sync_current_user RPC) with ONE function, public._sync_user().
--
-- Rules enforced by _sync_user:
--   * New public.users rows ALWAYS get role 'member'. raw_user_meta_data.role is
--     never read. An existing role is never modified.
--   * No membership row is created. Membership becomes active only when an admin
--     approves the member's application (decision A, docs/member-management-plan.md).
--   * If the email already belongs to a different public.users id (email/id
--     drift) nothing is written; the case is recorded in public.auth_sync_issues
--     for 003_data_repair.sql / a super admin to resolve.
--   * Works whether or not members_user_id_unique exists yet (no ON CONFLICT on
--     members.user_id), so it can run before the duplicate-member repair.
--
-- The auth.users triggers wrap the call in an exception handler: a profile-sync
-- failure is logged and NEVER blocks sign-in / sign-up.
--
-- Requires 001_security_hotfix.sql. Idempotent; safe to re-run.
-- ==============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Queue for sync problems that need a human
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auth_sync_issues (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id  UUID NOT NULL,
  email         TEXT,
  issue         TEXT NOT NULL,          -- 'email_conflict' | 'sync_failed'
  detail        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES public.users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS auth_sync_issues_open_uniq
  ON public.auth_sync_issues (auth_user_id, issue) WHERE resolved_at IS NULL;

ALTER TABLE public.auth_sync_issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins read sync issues" ON public.auth_sync_issues;
CREATE POLICY "Admins read sync issues" ON public.auth_sync_issues
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Super admins resolve sync issues" ON public.auth_sync_issues;
CREATE POLICY "Super admins resolve sync issues" ON public.auth_sync_issues
  FOR UPDATE USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

CREATE OR REPLACE FUNCTION public._record_sync_issue(
  p_auth_user_id UUID, p_email TEXT, p_issue TEXT, p_detail TEXT
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.auth_sync_issues (auth_user_id, email, issue, detail)
  VALUES (p_auth_user_id, p_email, p_issue, p_detail)
  ON CONFLICT (auth_user_id, issue) WHERE resolved_at IS NULL
  DO UPDATE SET detail = EXCLUDED.detail, created_at = now();
$$;

-- ---------------------------------------------------------------------------
-- 2. The single sync implementation
--    Returns the member id, or NULL when the user could not be synced
--    (an auth_sync_issues row explains why).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._sync_user(p_user auth.users)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meta       JSONB := COALESCE(p_user.raw_user_meta_data, '{}'::jsonb);
  v_email      TEXT  := lower(trim(p_user.email));
  v_prefix     TEXT  := split_part(lower(trim(p_user.email)), '@', 1);
  v_full_name  TEXT;
  v_first_name TEXT;
  v_last_name  TEXT;
  v_member_id  UUID;
BEGIN
  IF p_user.id IS NULL OR v_email IS NULL OR v_email = '' THEN
    RETURN NULL;  -- phone-only / anonymous auth users have no profile
  END IF;

  -- Display name: full_name -> name -> given + family -> email prefix
  v_full_name := NULLIF(trim(COALESCE(
                   v_meta->>'full_name',
                   v_meta->>'name',
                   concat_ws(' ', v_meta->>'given_name', v_meta->>'family_name'))), '');
  v_full_name := COALESCE(v_full_name, v_prefix);

  v_first_name := COALESCE(NULLIF(trim(v_meta->>'given_name'), ''),
                           split_part(v_full_name, ' ', 1));
  v_last_name  := COALESCE(NULLIF(trim(v_meta->>'family_name'), ''),
                           CASE WHEN position(' ' IN v_full_name) > 0
                                THEN trim(substring(v_full_name FROM position(' ' IN v_full_name) + 1))
                                ELSE '' END);

  -- Email/id drift: the email is owned by a different public.users row.
  IF EXISTS (SELECT 1 FROM public.users
              WHERE lower(email) = v_email AND id <> p_user.id) THEN
    PERFORM public._record_sync_issue(
      p_user.id, v_email, 'email_conflict',
      'public.users already has this email under a different id; run 003_data_repair.sql');
    RETURN NULL;
  END IF;

  -- public.users: role is 'member' for new rows and is NEVER updated here.
  INSERT INTO public.users (id, email, name, role, updated_at)
  VALUES (p_user.id, v_email, v_full_name, 'member', now())
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name  = CASE WHEN public.users.name IS NULL OR public.users.name = ''
                       OR public.users.name = split_part(public.users.email, '@', 1)
                     THEN EXCLUDED.name ELSE public.users.name END,
        updated_at = now();

  -- public.members: oldest row wins if duplicates still exist (see 003).
  SELECT id INTO v_member_id FROM public.members
   WHERE user_id = p_user.id ORDER BY created_at, id LIMIT 1;

  IF v_member_id IS NULL THEN
    INSERT INTO public.members (user_id, first_name, last_name, updated_at)
    VALUES (p_user.id, v_first_name, v_last_name, now())
    RETURNING id INTO v_member_id;
  ELSE
    UPDATE public.members
       SET first_name = CASE WHEN COALESCE(first_name, '') = '' THEN v_first_name ELSE first_name END,
           last_name  = CASE WHEN COALESCE(last_name,  '') = '' THEN v_last_name  ELSE last_name  END,
           updated_at = now()
     WHERE id = v_member_id
       AND (COALESCE(first_name, '') = '' OR COALESCE(last_name, '') = '');
  END IF;

  RETURN v_member_id;
END $$;

REVOKE ALL ON FUNCTION public._sync_user(auth.users) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._record_sync_issue(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. auth.users triggers: never block authentication
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    PERFORM public._sync_user(NEW);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile sync failed for %: %', NEW.id, SQLERRM;
    BEGIN
      PERFORM public._record_sync_issue(NEW.id, NEW.email, 'sync_failed', SQLERRM);
    EXCEPTION WHEN OTHERS THEN
      NULL;  -- logging must not block auth either
    END;
  END;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Only re-sync when profile-relevant data actually changed, not on every
-- sign-in (last_sign_in_at) or token event.
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email
        OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Self-healing RPC for the signed-in user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_current_user()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user      auth.users%ROWTYPE;
  v_member_id UUID;
  v_role      TEXT;
  v_active    BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'auth_user_not_found');
  END IF;

  BEGIN
    v_member_id := public._sync_user(v_user);
  EXCEPTION WHEN OTHERS THEN
    PERFORM public._record_sync_issue(v_user.id, v_user.email, 'sync_failed', SQLERRM);
    RETURN jsonb_build_object('success', false, 'error', 'sync_failed');
  END;

  SELECT role, is_active INTO v_role, v_active FROM public.users WHERE id = v_user.id;
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'profile_conflict');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'role', v_role,
    'is_active', v_active,
    'member_id', v_member_id
  );
END $$;

REVOKE ALL ON FUNCTION public.sync_current_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sync_current_user() TO authenticated;

COMMIT;

-- ---------------------------------------------------------------------------
-- 5. Backfill: create missing users/members rows for existing auth users.
--    Insert-only for missing rows (plus filling empty names); never changes
--    roles or memberships. One bad row does not abort the rest.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r auth.users%ROWTYPE;
  v_ok INT := 0;
  v_skipped INT := 0;
BEGIN
  FOR r IN SELECT * FROM auth.users LOOP
    BEGIN
      IF public._sync_user(r) IS NULL THEN
        v_skipped := v_skipped + 1;
      ELSE
        v_ok := v_ok + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_skipped := v_skipped + 1;
      PERFORM public._record_sync_issue(r.id, r.email, 'sync_failed', SQLERRM);
    END;
  END LOOP;
  RAISE NOTICE 'Backfill: % synced, % skipped (see public.auth_sync_issues)', v_ok, v_skipped;
END $$;
