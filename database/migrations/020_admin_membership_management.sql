-- Requires migrations 001–019. Run in the Supabase SQL editor as database owner.
BEGIN;

-- CURRENT_DATE can change between statements; this helper must not be IMMUTABLE.
CREATE OR REPLACE FUNCTION public.membership_effective_status(
  p_status public.membership_status, p_end_date date
) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT CASE WHEN p_status = 'active' AND p_end_date IS NOT NULL AND p_end_date < CURRENT_DATE
    THEN 'expired' ELSE p_status::text END;
$$;

CREATE OR REPLACE FUNCTION public.admin_membership_users()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN (SELECT coalesce(jsonb_agg(x ORDER BY x.created_at DESC), '[]'::jsonb) FROM (
    SELECT a.id AS user_id, coalesce(u.name, a.raw_user_meta_data->>'full_name', a.email) AS name,
      a.email, a.created_at, a.last_sign_in_at,
      coalesce(a.raw_app_meta_data->'providers', '[]'::jsonb) AS providers,
      coalesce(u.role, 'member') AS role, m.id AS member_id,
      ms.id AS membership_id, ms.start_date, ms.end_date,
      coalesce(public.membership_effective_status(ms.status, ms.end_date), 'none') AS status
    FROM auth.users a LEFT JOIN public.users u ON u.id = a.id
    LEFT JOIN LATERAL (SELECT id FROM public.members WHERE user_id = a.id ORDER BY created_at, id LIMIT 1) m ON true
    LEFT JOIN LATERAL (SELECT * FROM public.memberships WHERE member_id = m.id ORDER BY created_at DESC, id DESC LIMIT 1) ms ON true
    WHERE a.deleted_at IS NULL AND NOT coalesce(a.is_anonymous, false)
  ) x);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_membership_history(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  RETURN jsonb_build_object(
    'memberships', (SELECT coalesce(jsonb_agg(x ORDER BY x.created_at DESC), '[]'::jsonb) FROM (
      SELECT ms.* FROM public.memberships ms JOIN public.members m ON m.id = ms.member_id WHERE m.user_id = p_user_id
    ) x),
    'logins', (SELECT coalesce(jsonb_agg(x ORDER BY x.created_at DESC), '[]'::jsonb) FROM (
      SELECT id, action, created_at, metadata FROM public.member_activity_logs
      WHERE user_id = p_user_id AND action IN ('AUTH_LOGIN','AUTH_LOGOUT') ORDER BY created_at DESC LIMIT 100
    ) x),
    'changes', (SELECT coalesce(jsonb_agg(x ORDER BY x.performed_at DESC), '[]'::jsonb) FROM (
      SELECT l.action, l.details, l.performed_at, u.name AS admin_name, u.email AS admin_email
      FROM public.audit_logs l LEFT JOIN public.users u ON u.id = l.performed_by
      WHERE l.table_name = 'memberships' AND l.record_id IN (
        SELECT ms.id FROM public.memberships ms JOIN public.members m ON m.id = ms.member_id WHERE m.user_id = p_user_id
      ) ORDER BY l.performed_at DESC LIMIT 100
    ) x));
END; $$;

CREATE OR REPLACE FUNCTION public.admin_save_membership(
  p_user_id uuid, p_membership_id uuid, p_start_date date, p_status text, p_reason text, p_renew boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member uuid; v_latest uuid; v_old public.memberships; v_new public.memberships; v_end date;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
  IF p_start_date IS NULL OR p_status NOT IN ('active','pending','expired','cancelled','suspended')
     OR p_status IS NULL OR length(trim(coalesce(p_reason,''))) < 3 OR length(p_reason) > 1000 THEN
    RAISE EXCEPTION 'Select a start date, valid status and a reason (3–1000 characters).';
  END IF;
  -- Lock one account for the entire assignment/renewal to prevent duplicate concurrent terms.
  PERFORM 1 FROM auth.users WHERE id = p_user_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;
  SELECT id INTO v_member FROM public.members WHERE user_id = p_user_id ORDER BY created_at, id LIMIT 1;
  IF v_member IS NULL THEN
    PERFORM public._sync_user(a) FROM auth.users a WHERE a.id = p_user_id;
    SELECT id INTO v_member FROM public.members WHERE user_id = p_user_id ORDER BY created_at, id LIMIT 1;
  END IF;
  IF v_member IS NULL THEN RAISE EXCEPTION 'Profile sync failed. Resolve the account sync issue first.'; END IF;
  SELECT id INTO v_latest FROM public.memberships WHERE member_id = v_member ORDER BY created_at DESC, id DESC LIMIT 1;
  IF p_membership_id IS DISTINCT FROM v_latest THEN RAISE EXCEPTION 'Membership changed. Refresh before saving.'; END IF;
  SELECT * INTO v_old FROM public.memberships WHERE id = p_membership_id FOR UPDATE;
  IF p_renew AND v_old.id IS NULL THEN RAISE EXCEPTION 'Assign a membership before renewing.'; END IF;
  v_end := (p_start_date + interval '1 year')::date;
  IF p_status = 'active' AND v_end < CURRENT_DATE THEN p_status := 'expired'; END IF;
  IF v_old.id IS NULL OR p_renew THEN
    IF p_renew THEN
      IF v_old.end_date IS NULL OR p_start_date < v_old.end_date THEN
        RAISE EXCEPTION 'Renewal must start on or after the current expiry date. Use Edit to correct existing dates.';
      END IF;
    END IF;
    INSERT INTO public.memberships(member_id,start_date,end_date,status,created_by)
      VALUES(v_member,p_start_date,v_end,p_status::public.membership_status,auth.uid()) RETURNING * INTO v_new;
  ELSE
    UPDATE public.memberships SET start_date=p_start_date,end_date=v_end,status=p_status::public.membership_status,
      updated_at=now(),updated_by=auth.uid() WHERE id=v_old.id RETURNING * INTO v_new;
  END IF;
  PERFORM public._audit(CASE WHEN p_renew THEN 'MEMBERSHIP_RENEWED' WHEN v_old.id IS NULL THEN 'MEMBERSHIP_ASSIGNED' ELSE 'MEMBERSHIP_UPDATED' END,
    'memberships',v_new.id,jsonb_build_object('reason',trim(p_reason),'old_value',to_jsonb(v_old),'new_value',to_jsonb(v_new),'user_id',p_user_id));
  PERFORM public._notify(p_user_id,'info','Membership updated',
    'Your membership dates are ' || p_start_date::text || ' to ' || v_end::text || '. Status: ' || p_status,
    'membership','/membership');
  RETURN v_new.id;
END; $$;

REVOKE ALL ON FUNCTION public.admin_membership_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_membership_history(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_save_membership(uuid,uuid,date,text,text,boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_membership_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_membership_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_save_membership(uuid,uuid,date,text,text,boolean) TO authenticated;
COMMIT;
