-- ==============================================================================
-- 001_security_hotfix.sql
-- ==============================================================================
-- Closes the privilege-escalation holes found in docs/member-management-plan.md §6:
--   * a member could UPDATE their own public.users.role (no column restriction)
--   * an admin could promote themselves / anyone to super_admin
--   * admins could INSERT public.users rows with any role
--   * a member could INSERT a payment with status = 'succeeded'
--   * a member could re-point their members row to another user_id
--   * audit_logs.performed_by was client-supplied; rows were not append-only
--   * any admin could change any app_settings key
--
-- Additive and idempotent: no rows are modified or deleted. Safe to re-run.
-- Role changes after this migration are only possible through
-- public.set_user_role() (super_admin only, audited) or the service role.
-- ==============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Trusted role helpers
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.users ALTER COLUMN role SET DEFAULT 'member';

-- NOT VALID: enforced for every new/updated row now; existing rows are checked
-- (and VALIDATEd) by 003_data_repair.sql after the diagnostics have been reviewed.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check') THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_role_check
      CHECK (role IN ('member', 'trainer', 'admin', 'super_admin')) NOT VALID;
  END IF;
END $$;

-- The caller's trusted role: public.users.role for auth.uid(), NULL when the
-- account is missing or disabled. Never reads JWT/user metadata.
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.current_app_role() IN ('admin', 'super_admin'), false);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.current_app_role() = 'super_admin', false);
$$;

-- True when the statement comes from an API client (PostgREST roles) rather than
-- from a SECURITY DEFINER function, the service role, or the SQL editor.
-- Guard triggers below are SECURITY INVOKER so current_user reflects the caller.
CREATE OR REPLACE FUNCTION public.is_api_caller()
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT current_user IN ('authenticated', 'anon');
$$;

-- ---------------------------------------------------------------------------
-- 2. public.users: protected columns
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_users_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.is_api_caller() THEN
    RETURN NEW;  -- definer functions (set_user_role, _sync_user), service role, SQL editor
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'member' OR NOT NEW.is_active THEN
      RAISE EXCEPTION 'New users can only be created with role member'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id         IS DISTINCT FROM OLD.id
  OR NEW.role       IS DISTINCT FROM OLD.role
  OR NEW.is_active  IS DISTINCT FROM OLD.is_active
  OR NEW.email      IS DISTINCT FROM OLD.email
  OR NEW.password_hash IS DISTINCT FROM OLD.password_hash
  OR NEW.created_at IS DISTINCT FROM OLD.created_at
  OR NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'id, role, is_active, email and audit columns cannot be changed directly; use set_user_role()'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_users_write ON public.users;
CREATE TRIGGER guard_users_write
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_users_write();

DROP POLICY IF EXISTS "Users can update own record or admins update all" ON public.users;
CREATE POLICY "Users can update own record or admins update all" ON public.users
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. The only way to change a role or disable an account
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_is_active BOOLEAN DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old public.users%ROWTYPE;
  v_new_active BOOLEAN;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only a super admin can change roles' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('member', 'trainer', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_old FROM public.users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  v_new_active := COALESCE(p_is_active, v_old.is_active);

  -- Never remove the last active super admin (including yourself).
  IF v_old.role = 'super_admin' AND v_old.is_active
     AND (p_role <> 'super_admin' OR NOT v_new_active)
     AND (SELECT count(*) FROM public.users
           WHERE role = 'super_admin' AND is_active AND id <> p_user_id) = 0 THEN
    RAISE EXCEPTION 'Cannot remove the last active super admin' USING ERRCODE = '42501';
  END IF;

  IF v_old.role = p_role AND v_old.is_active = v_new_active THEN
    RETURN jsonb_build_object('success', true, 'changed', false);
  END IF;

  UPDATE public.users
     SET role = p_role, is_active = v_new_active,
         updated_at = now(), updated_by = auth.uid()
   WHERE id = p_user_id;

  INSERT INTO public.audit_logs (action, table_name, record_id, performed_by, details)
  VALUES (
    CASE WHEN v_old.is_active <> v_new_active AND v_old.role = p_role
         THEN CASE WHEN v_new_active THEN 'USER_ENABLED' ELSE 'USER_DISABLED' END
         ELSE 'ROLE_CHANGED' END,
    'users', p_user_id, auth.uid(),
    jsonb_build_object(
      'old_value', jsonb_build_object('role', v_old.role, 'is_active', v_old.is_active),
      'new_value', jsonb_build_object('role', p_role, 'is_active', v_new_active),
      'reason', p_reason,
      'target_email', v_old.email
    )
  );

  RETURN jsonb_build_object('success', true, 'changed', true);
END $$;

REVOKE ALL ON FUNCTION public.set_user_role(UUID, TEXT, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT, BOOLEAN, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. public.members: user_id is immutable; policy gets WITH CHECK
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_members_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_api_caller()
     AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id
          OR NEW.created_at IS DISTINCT FROM OLD.created_at) THEN
    RAISE EXCEPTION 'members.id and members.user_id cannot be changed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_members_write ON public.members;
CREATE TRIGGER guard_members_write
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.guard_members_write();

DROP POLICY IF EXISTS "Members update own record or admins update all" ON public.members;
CREATE POLICY "Members update own record or admins update all" ON public.members
  FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. payments: members may only create pending payments for themselves
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Members can request renewal payments" ON public.payments;
CREATE POLICY "Members can request renewal payments" ON public.payments
  FOR INSERT
  WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    AND status = 'pending'
  );

-- ---------------------------------------------------------------------------
-- 6. notifications: a member may only change read_at on their own rows
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_notifications_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_api_caller() AND NOT public.is_admin()
     AND (NEW.user_id IS DISTINCT FROM OLD.user_id
          OR NEW.type IS DISTINCT FROM OLD.type
          OR NEW.payload IS DISTINCT FROM OLD.payload
          OR NEW.created_at IS DISTINCT FROM OLD.created_at
          OR NEW.created_by IS DISTINCT FROM OLD.created_by) THEN
    RAISE EXCEPTION 'Only read_at can be changed on a notification' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_notifications_write ON public.notifications;
CREATE TRIGGER guard_notifications_write
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.guard_notifications_write();

DROP POLICY IF EXISTS "Users can update own notification read status" ON public.notifications;
CREATE POLICY "Users can update own notification read status" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. audit_logs: server-stamped actor, append-only
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_audit_logs()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF public.is_api_caller() THEN
      NEW.performed_by := auth.uid();   -- never trust the client-supplied actor
      NEW.performed_at := now();
    END IF;
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = '42501';
END $$;

DROP TRIGGER IF EXISTS guard_audit_logs ON public.audit_logs;
CREATE TRIGGER guard_audit_logs
  BEFORE INSERT OR UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.guard_audit_logs();

REVOKE UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. app_settings: admins manage fee keys only; everything else super_admin
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_setting(p_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT public.is_super_admin()
      OR (public.is_admin() AND p_key IN ('renewal_fee'));
$$;

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings" ON public.app_settings
  FOR ALL
  USING (public.can_manage_setting(key))
  WITH CHECK (public.can_manage_setting(key));

COMMIT;
