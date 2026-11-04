-- ##############################################################################
-- SUPERSEDED — DO NOT RUN. Kept for reference only (see the .ANALYSIS.md file).
-- This version trusts raw_user_meta_data.role (privilege escalation), grants a
-- free active membership, and can block sign-in. Use instead:
--   database/migrations/001_security_hotfix.sql
--   database/migrations/002_user_sync.sql
--   database/migrations/003_data_repair.sql
-- The statement below aborts the script if it is run by mistake.
-- ##############################################################################
DO $$ BEGIN RAISE EXCEPTION '20260909_fix_google_oauth_member_sync.sql is superseded by database/migrations/00*.sql'; END $$;

-- ==============================================================================
-- FSP DASHBOARD: GOOGLE OAUTH -> MEMBER SYNC FIX & RECONCILIATION
-- ==============================================================================
-- Date: 2026-09-09
-- Purpose:
-- 1. Enforce UNIQUE (user_id) on public.members to prevent duplicate records
-- 2. Upgrade handle_new_user() to support full Google OAuth metadata (full_name, avatar_url, etc.)
-- 3. Ensure idempotent upsert on public.users and public.members
-- 4. Never overwrite or demote admin/super_admin roles
-- 5. Attach trigger to AFTER INSERT OR UPDATE on auth.users for self-healing logins
-- 6. Automatically backfill and reconcile any existing auth.users missing from members
-- ==============================================================================

-- 1. Ensure UNIQUE constraint on public.members(user_id)
DO $$
BEGIN
  -- Deduplicate any existing duplicates keeping the oldest record
  DELETE FROM public.members m1
  USING public.members m2
  WHERE m1.user_id = m2.user_id AND m1.created_at > m2.created_at;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'members_user_id_unique'
  ) THEN
    ALTER TABLE public.members ADD CONSTRAINT members_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- 2. Robust, idempotent user & member synchronization function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_role text;
  v_existing_role text;
  v_member_id uuid;
BEGIN
  -- 1. Extract full display name from OAuth metadata or fallback to email prefix
  v_full_name := TRIM(COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    CONCAT_WS(' ', new.raw_user_meta_data->>'given_name', new.raw_user_meta_data->>'family_name'),
    split_part(new.email, '@', 1)
  ));
  IF v_full_name = '' THEN
    v_full_name := split_part(new.email, '@', 1);
  END IF;

  -- 2. Extract first and last name
  v_first_name := TRIM(COALESCE(
    new.raw_user_meta_data->>'given_name',
    split_part(v_full_name, ' ', 1),
    v_full_name
  ));
  v_last_name := TRIM(COALESCE(
    new.raw_user_meta_data->>'family_name',
    CASE
      WHEN position(' ' in v_full_name) > 0 THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE ''
    END
  ));

  -- 3. Check for existing role in public.users to NEVER overwrite/demote admin/super_admin
  SELECT role INTO v_existing_role FROM public.users WHERE id = new.id;
  IF v_existing_role IS NOT NULL THEN
    v_role := v_existing_role;
  ELSE
    -- Default to metadata role if explicitly provided, else 'member'
    v_role := COALESCE(new.raw_user_meta_data->>'role', 'member');
  END IF;

  -- 4. Idempotently insert/update public.users
  INSERT INTO public.users (id, email, name, role, updated_at)
  VALUES (
    new.id,
    new.email,
    v_full_name,
    v_role,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE
        WHEN public.users.name IS NULL OR public.users.name = '' OR public.users.name = split_part(public.users.email, '@', 1)
        THEN EXCLUDED.name
        ELSE public.users.name
      END,
      updated_at = now();

  -- 5. Always ensure a member profile exists in public.members
  INSERT INTO public.members (id, user_id, first_name, last_name, updated_at)
  VALUES (
    uuid_generate_v4(),
    new.id,
    COALESCE(v_first_name, ''),
    COALESCE(v_last_name, ''),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET first_name = CASE
        WHEN public.members.first_name IS NULL OR public.members.first_name = ''
        THEN EXCLUDED.first_name
        ELSE public.members.first_name
      END,
      last_name = CASE
        WHEN public.members.last_name IS NULL OR public.members.last_name = ''
        THEN EXCLUDED.last_name
        ELSE public.members.last_name
      END,
      updated_at = now()
  RETURNING id INTO v_member_id;

  -- If member already existed, grab member_id
  IF v_member_id IS NULL THEN
    SELECT id INTO v_member_id FROM public.members WHERE user_id = new.id;
  END IF;

  -- 6. Ensure member has an active or pending membership record
  IF v_member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.memberships WHERE member_id = v_member_id) THEN
    INSERT INTO public.memberships (id, member_id, start_date, status, created_at, updated_at)
    VALUES (
      uuid_generate_v4(),
      v_member_id,
      CURRENT_DATE,
      'active',
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Re-create trigger on auth.users for BOTH INSERT and UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Reconcile all existing auth.users that are missing from public.users or public.members
DO $$
DECLARE
  u_rec RECORD;
  v_fname text;
  v_lname text;
  v_fullname text;
  v_m_id uuid;
  v_u_role text;
BEGIN
  FOR u_rec IN SELECT * FROM auth.users LOOP
    -- Check full name
    v_fullname := TRIM(COALESCE(
      u_rec.raw_user_meta_data->>'full_name',
      u_rec.raw_user_meta_data->>'name',
      CONCAT_WS(' ', u_rec.raw_user_meta_data->>'given_name', u_rec.raw_user_meta_data->>'family_name'),
      split_part(u_rec.email, '@', 1)
    ));
    IF v_fullname = '' THEN
      v_fullname := split_part(u_rec.email, '@', 1);
    END IF;

    -- Determine role
    v_u_role := COALESCE(u_rec.raw_user_meta_data->>'role', 'member');

    -- Insert into public.users if not exists
    INSERT INTO public.users (id, email, name, role, updated_at)
    VALUES (u_rec.id, u_rec.email, v_fullname, v_u_role, now())
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        name = CASE WHEN public.users.name IS NULL OR public.users.name = '' THEN EXCLUDED.name ELSE public.users.name END;

    -- Determine names
    v_fname := TRIM(COALESCE(
      u_rec.raw_user_meta_data->>'given_name',
      split_part(v_fullname, ' ', 1),
      v_fullname
    ));
    v_lname := TRIM(COALESCE(
      u_rec.raw_user_meta_data->>'family_name',
      CASE
        WHEN position(' ' in v_fullname) > 0 THEN substring(v_fullname from position(' ' in v_fullname) + 1)
        ELSE ''
      END
    ));

    -- Insert into public.members if not exists
    INSERT INTO public.members (id, user_id, first_name, last_name, updated_at)
    VALUES (uuid_generate_v4(), u_rec.id, COALESCE(v_fname, ''), COALESCE(v_lname, ''), now())
    ON CONFLICT (user_id) DO UPDATE
    SET first_name = CASE WHEN public.members.first_name IS NULL OR public.members.first_name = '' THEN EXCLUDED.first_name ELSE public.members.first_name END,
        last_name = CASE WHEN public.members.last_name IS NULL OR public.members.last_name = '' THEN EXCLUDED.last_name ELSE public.members.last_name END;

    -- Ensure default membership
    SELECT id INTO v_m_id FROM public.members WHERE user_id = u_rec.id;
    IF v_m_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.memberships WHERE member_id = v_m_id) THEN
      INSERT INTO public.memberships (id, member_id, start_date, status)
      VALUES (uuid_generate_v4(), v_m_id, CURRENT_DATE, 'active');
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 5. Callable RPC function for self-healing sync from authenticated client/server
-- ============================================================================
CREATE OR REPLACE FUNCTION public.sync_current_user()
RETURNS JSONB AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_full_name text;
  v_first_name text;
  v_last_name text;
  v_role text;
  v_existing_role text;
  v_member_id uuid;
  v_result JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Auth user not found');
  END IF;

  v_full_name := TRIM(COALESCE(
    v_user.raw_user_meta_data->>'full_name',
    v_user.raw_user_meta_data->>'name',
    CONCAT_WS(' ', v_user.raw_user_meta_data->>'given_name', v_user.raw_user_meta_data->>'family_name'),
    split_part(v_user.email, '@', 1)
  ));
  IF v_full_name = '' THEN
    v_full_name := split_part(v_user.email, '@', 1);
  END IF;

  v_first_name := TRIM(COALESCE(
    v_user.raw_user_meta_data->>'given_name',
    split_part(v_full_name, ' ', 1),
    v_full_name
  ));
  v_last_name := TRIM(COALESCE(
    v_user.raw_user_meta_data->>'family_name',
    CASE
      WHEN position(' ' in v_full_name) > 0 THEN substring(v_full_name from position(' ' in v_full_name) + 1)
      ELSE ''
    END
  ));

  SELECT role INTO v_existing_role FROM public.users WHERE id = v_user.id;
  IF v_existing_role IS NOT NULL THEN
    v_role := v_existing_role;
  ELSE
    v_role := COALESCE(v_user.raw_user_meta_data->>'role', 'member');
  END IF;

  INSERT INTO public.users (id, email, name, role, updated_at)
  VALUES (
    v_user.id,
    v_user.email,
    v_full_name,
    v_role,
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = CASE
        WHEN public.users.name IS NULL OR public.users.name = '' OR public.users.name = split_part(public.users.email, '@', 1)
        THEN EXCLUDED.name
        ELSE public.users.name
      END,
      updated_at = now();

  INSERT INTO public.members (id, user_id, first_name, last_name, updated_at)
  VALUES (
    uuid_generate_v4(),
    v_user.id,
    COALESCE(v_first_name, ''),
    COALESCE(v_last_name, ''),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET first_name = CASE
        WHEN public.members.first_name IS NULL OR public.members.first_name = ''
        THEN EXCLUDED.first_name
        ELSE public.members.first_name
      END,
      last_name = CASE
        WHEN public.members.last_name IS NULL OR public.members.last_name = ''
        THEN EXCLUDED.last_name
        ELSE public.members.last_name
      END,
      updated_at = now()
  RETURNING id INTO v_member_id;

  IF v_member_id IS NULL THEN
    SELECT id INTO v_member_id FROM public.members WHERE user_id = v_user.id;
  END IF;

  IF v_member_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.memberships WHERE member_id = v_member_id) THEN
    INSERT INTO public.memberships (id, member_id, start_date, status, created_at, updated_at)
    VALUES (
      uuid_generate_v4(),
      v_member_id,
      CURRENT_DATE,
      'active',
      now(),
      now()
    );
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'user_id', v_user.id,
    'email', v_user.email,
    'role', v_role,
    'member_id', v_member_id
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.sync_current_user() TO authenticated;
