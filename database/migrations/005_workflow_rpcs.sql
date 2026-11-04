-- ==============================================================================
-- 005_workflow_rpcs.sql  —  workflow actions, notifications, audit, admin stats
-- ==============================================================================
-- Every state-changing action runs server-side in ONE transaction:
--   status change + membership change + notification(s) + audit row.
-- Authorization is re-checked inside each function from public.users (never
-- from client input). Requires 001, 002, 004. Idempotent (CREATE OR REPLACE).
--
-- Notification payload convention (notifications.payload):
--   { "title": text, "message": text, "category": "membership"|"application"|
--     "documents"|"system", "link": "/path" }
-- ==============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by API clients)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._notify(
  p_user_id UUID, p_type public.notification_type,
  p_title TEXT, p_message TEXT, p_category TEXT, p_link TEXT
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, payload, created_by)
  VALUES (p_user_id, p_type,
          jsonb_build_object('title', p_title, 'message', p_message,
                             'category', p_category, 'link', p_link),
          auth.uid());
$$;

CREATE OR REPLACE FUNCTION public._notify_admins(
  p_title TEXT, p_message TEXT, p_category TEXT, p_link TEXT
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, type, payload, created_by)
  SELECT u.id, 'info',
         jsonb_build_object('title', p_title, 'message', p_message,
                            'category', p_category, 'link', p_link),
         auth.uid()
  FROM public.users u
  WHERE u.role IN ('admin', 'super_admin') AND u.is_active;
$$;

CREATE OR REPLACE FUNCTION public._audit(
  p_action TEXT, p_table TEXT, p_record UUID, p_details JSONB
)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.audit_logs (action, table_name, record_id, performed_by, details)
  VALUES (p_action, p_table, p_record, auth.uid(),
          COALESCE(p_details, '{}'::jsonb)
            || jsonb_build_object('actor_role', public.current_app_role()));
$$;

-- 'active' past its end_date reads as expired everywhere.
CREATE OR REPLACE FUNCTION public.membership_effective_status(
  p_status public.membership_status, p_end_date DATE
)
RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN p_status = 'active' AND p_end_date IS NOT NULL AND p_end_date < CURRENT_DATE
              THEN 'expired' ELSE p_status::text END;
$$;

REVOKE ALL ON FUNCTION public._notify(UUID, public.notification_type, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._notify_admins(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._audit(TEXT, TEXT, UUID, JSONB) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Member: submit an application
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_application(p_application_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app    public.membership_applications%ROWTYPE;
  v_member public.members%ROWTYPE;
BEGIN
  SELECT * INTO v_app FROM public.membership_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002';
  END IF;

  SELECT * INTO v_member FROM public.members WHERE id = v_app.member_id;
  IF v_member.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'You can only submit your own application' USING ERRCODE = '42501';
  END IF;
  IF v_app.status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'This application has already been submitted' USING ERRCODE = '22023';
  END IF;
  IF COALESCE(trim(v_member.first_name), '') = '' OR COALESCE(trim(v_member.last_name), '') = ''
     OR COALESCE(trim(v_member.phone), '') = '' THEN
    RAISE EXCEPTION 'Complete your name and phone number in your profile before submitting'
      USING ERRCODE = '22023';
  END IF;
  IF COALESCE(trim(v_app.motivation), '') = '' THEN
    RAISE EXCEPTION 'Tell us why you want to join before submitting' USING ERRCODE = '22023';
  END IF;

  UPDATE public.membership_applications
     SET status = 'submitted', submitted_at = now()
   WHERE id = p_application_id;

  PERFORM public._audit('APPLICATION_SUBMITTED', 'membership_applications', p_application_id,
    jsonb_build_object('old_value', jsonb_build_object('status', v_app.status),
                       'new_value', jsonb_build_object('status', 'submitted')));

  PERFORM public._notify(auth.uid(), 'info', 'Application submitted',
    'Your membership application has been submitted and is waiting for review.',
    'application', '/application/' || p_application_id);

  PERFORM public._notify_admins('New application to review',
    concat_ws(' ', v_member.first_name, v_member.last_name) || ' submitted a membership application.',
    'application', '/admin/applications/' || p_application_id);

  RETURN jsonb_build_object('success', true, 'status', 'submitted');
END $$;

-- ---------------------------------------------------------------------------
-- Admin: review an application
--   decision: under_review | approved | rejected | changes_requested
--   Approval activates (or creates) the membership for the configured term.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_application(
  p_application_id UUID,
  p_decision public.application_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_app        public.membership_applications%ROWTYPE;
  v_member     public.members%ROWTYPE;
  v_ms         public.memberships%ROWTYPE;
  v_months     INT;
  v_end        DATE;
  v_title      TEXT;
  v_message    TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('under_review', 'approved', 'rejected', 'changes_requested') THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE = '22023';
  END IF;
  IF p_decision IN ('rejected', 'changes_requested')
     AND char_length(COALESCE(trim(p_reason), '')) < 5 THEN
    RAISE EXCEPTION 'A reason is required to reject or request changes' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_app FROM public.membership_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_member FROM public.members WHERE id = v_app.member_id;

  IF v_member.user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot review your own application' USING ERRCODE = '42501';
  END IF;
  IF v_app.status NOT IN ('submitted', 'under_review') THEN
    RAISE EXCEPTION 'Only submitted applications can be reviewed (current status: %)', v_app.status
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.membership_applications
     SET status = p_decision,
         reviewed_at = CASE WHEN p_decision = 'under_review' THEN reviewed_at ELSE now() END,
         reviewed_by = auth.uid(),
         decision_reason = CASE WHEN p_decision = 'under_review' THEN decision_reason ELSE NULLIF(trim(p_reason), '') END
   WHERE id = p_application_id;

  PERFORM public._audit('APPLICATION_' || upper(p_decision::text), 'membership_applications', p_application_id,
    jsonb_build_object('old_value', jsonb_build_object('status', v_app.status),
                       'new_value', jsonb_build_object('status', p_decision),
                       'reason', NULLIF(trim(p_reason), ''),
                       'member_id', v_member.id));

  -- Approval activates the membership (decision A: admin approval only).
  IF p_decision = 'approved' THEN
    SELECT COALESCE((value->>'months')::int, 12) INTO v_months
      FROM public.app_settings WHERE key = 'membership_term_months';
    v_months := COALESCE(v_months, 12);
    v_end := (CURRENT_DATE + make_interval(months => v_months))::date;

    SELECT * INTO v_ms FROM public.memberships
     WHERE member_id = v_member.id ORDER BY created_at DESC LIMIT 1 FOR UPDATE;

    IF NOT FOUND THEN
      INSERT INTO public.memberships (member_id, start_date, end_date, status, membership_type, created_by)
      VALUES (v_member.id, CURRENT_DATE, v_end, 'active', v_app.membership_type, auth.uid())
      RETURNING * INTO v_ms;
      PERFORM public._audit('MEMBERSHIP_UPDATED', 'memberships', v_ms.id,
        jsonb_build_object('old_value', NULL,
                           'new_value', jsonb_build_object('status', 'active', 'end_date', v_end),
                           'reason', 'Application approved'));
    ELSIF public.membership_effective_status(v_ms.status, v_ms.end_date) <> 'active' THEN
      UPDATE public.memberships
         SET status = 'active', start_date = CURRENT_DATE, end_date = v_end,
             membership_type = v_app.membership_type,
             updated_at = now(), updated_by = auth.uid()
       WHERE id = v_ms.id;
      PERFORM public._audit('MEMBERSHIP_UPDATED', 'memberships', v_ms.id,
        jsonb_build_object('old_value', jsonb_build_object('status', v_ms.status, 'end_date', v_ms.end_date),
                           'new_value', jsonb_build_object('status', 'active', 'end_date', v_end),
                           'reason', 'Application approved'));
    END IF;
  END IF;

  v_title := CASE p_decision
    WHEN 'under_review'      THEN 'Application under review'
    WHEN 'approved'          THEN 'Membership approved'
    WHEN 'rejected'          THEN 'Application not approved'
    WHEN 'changes_requested' THEN 'Changes requested on your application' END;
  v_message := CASE p_decision
    WHEN 'under_review'      THEN 'An administrator has started reviewing your application.'
    WHEN 'approved'          THEN 'Your application was approved and your membership is now active.'
    ELSE COALESCE(NULLIF(trim(p_reason), ''), 'See your application for details.') END;

  PERFORM public._notify(v_member.user_id,
    CASE WHEN p_decision = 'rejected' THEN 'alert'::public.notification_type
         WHEN p_decision = 'changes_requested' THEN 'warning'::public.notification_type
         ELSE 'info'::public.notification_type END,
    v_title, v_message,
    CASE WHEN p_decision = 'approved' THEN 'membership' ELSE 'application' END,
    '/application/' || p_application_id);

  RETURN jsonb_build_object('success', true, 'status', p_decision);
END $$;

-- ---------------------------------------------------------------------------
-- Admin: review a document
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_document(
  p_document_id UUID,
  p_decision public.document_status,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doc    public.member_documents%ROWTYPE;
  v_member public.members%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision' USING ERRCODE = '22023';
  END IF;
  IF p_decision = 'rejected' AND char_length(COALESCE(trim(p_reason), '')) < 5 THEN
    RAISE EXCEPTION 'A reason is required to reject a document' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_doc FROM public.member_documents WHERE id = p_document_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Document not found' USING ERRCODE = 'P0002';
  END IF;
  SELECT * INTO v_member FROM public.members WHERE id = v_doc.member_id;
  IF v_member.user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot review your own document' USING ERRCODE = '42501';
  END IF;
  IF v_doc.status <> 'pending' THEN
    RAISE EXCEPTION 'This document has already been reviewed' USING ERRCODE = '22023';
  END IF;

  UPDATE public.member_documents
     SET status = p_decision, reviewed_at = now(), reviewed_by = auth.uid(),
         rejection_reason = CASE WHEN p_decision = 'rejected' THEN trim(p_reason) END
   WHERE id = p_document_id;

  PERFORM public._audit('DOCUMENT_' || upper(p_decision::text), 'member_documents', p_document_id,
    jsonb_build_object('old_value', jsonb_build_object('status', v_doc.status),
                       'new_value', jsonb_build_object('status', p_decision),
                       'reason', NULLIF(trim(p_reason), ''),
                       'document_type', v_doc.document_type,
                       'member_id', v_member.id));

  PERFORM public._notify(v_member.user_id,
    CASE WHEN p_decision = 'rejected' THEN 'warning'::public.notification_type ELSE 'info'::public.notification_type END,
    CASE WHEN p_decision = 'rejected' THEN 'Document needs to be re-uploaded' ELSE 'Document approved' END,
    CASE WHEN p_decision = 'rejected'
         THEN initcap(replace(v_doc.document_type, '_', ' ')) || ': ' || trim(p_reason)
         ELSE initcap(replace(v_doc.document_type, '_', ' ')) || ' was approved.' END,
    'documents', '/documents');

  RETURN jsonb_build_object('success', true, 'status', p_decision);
END $$;

-- ---------------------------------------------------------------------------
-- Audit + admin notification when a member uploads a document
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_document_uploaded()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name TEXT;
BEGIN
  SELECT concat_ws(' ', first_name, last_name) INTO v_name FROM public.members WHERE id = NEW.member_id;
  PERFORM public._audit('DOCUMENT_UPLOADED', 'member_documents', NEW.id,
    jsonb_build_object('document_type', NEW.document_type, 'member_id', NEW.member_id,
                       'replaces_document_id', NEW.replaces_document_id));
  PERFORM public._notify_admins('New document to review',
    COALESCE(NULLIF(v_name, ''), 'A member') || ' uploaded ' || replace(NEW.document_type, '_', ' ') || '.',
    'documents', '/admin/documents');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_document_uploaded ON public.member_documents;
CREATE TRIGGER on_document_uploaded
  AFTER INSERT ON public.member_documents
  FOR EACH ROW EXECUTE FUNCTION public.on_document_uploaded();

-- ---------------------------------------------------------------------------
-- Audit profile edits made through the API (who changed which fields)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_member_profile_updated()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old JSONB := to_jsonb(OLD) - ARRAY['updated_at', 'updated_by'];
  v_new JSONB := to_jsonb(NEW) - ARRAY['updated_at', 'updated_by'];
  v_changed JSONB;
BEGIN
  IF auth.uid() IS NULL OR v_old = v_new THEN
    RETURN NEW;  -- system/migration writes, or no real change
  END IF;
  SELECT jsonb_object_agg(k, v_new->k) INTO v_changed
    FROM jsonb_object_keys(v_new) k WHERE v_new->k IS DISTINCT FROM v_old->k;
  PERFORM public._audit('PROFILE_UPDATED', 'members', NEW.id,
    jsonb_build_object('new_value', v_changed,
                       'old_value', (SELECT jsonb_object_agg(k, v_old->k)
                                       FROM jsonb_object_keys(v_changed) k),
                       'self_edit', NEW.user_id = auth.uid()));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_member_profile_updated ON public.members;
CREATE TRIGGER on_member_profile_updated
  AFTER UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.on_member_profile_updated();

-- ---------------------------------------------------------------------------
-- Audit settings changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_setting_changed()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public._audit('SETTINGS_CHANGED', 'app_settings', NULL,
    jsonb_build_object('key', COALESCE(NEW.key, OLD.key),
                       'old_value', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.value END,
                       'new_value', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.value END));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS on_setting_changed ON public.app_settings;
CREATE TRIGGER on_setting_changed
  AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.on_setting_changed();

INSERT INTO public.app_settings (key, value)
VALUES ('membership_term_months', '{"months": 12}')
ON CONFLICT (key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Audit visibility: admins do not see role/security/settings entries
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT USING (
    public.is_super_admin()
    OR (public.is_admin()
        AND action NOT IN ('ROLE_CHANGED', 'USER_ENABLED', 'USER_DISABLED', 'SETTINGS_CHANGED'))
  );

-- ---------------------------------------------------------------------------
-- Admin: dashboard KPIs in one round trip
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  WITH latest_ms AS (
    SELECT DISTINCT ON (member_id) member_id,
           public.membership_effective_status(status, end_date) AS eff
    FROM public.memberships ORDER BY member_id, created_at DESC
  )
  SELECT jsonb_build_object(
    'total_members',        (SELECT count(*) FROM public.members),
    'membership', (SELECT COALESCE(jsonb_object_agg(eff, n), '{}'::jsonb)
                     FROM (SELECT eff, count(*) n FROM latest_ms GROUP BY eff) s),
    'members_without_membership',
                            (SELECT count(*) FROM public.members m
                              WHERE NOT EXISTS (SELECT 1 FROM latest_ms l WHERE l.member_id = m.id)),
    'applications', (SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb)
                       FROM (SELECT status::text, count(*) n
                               FROM public.membership_applications GROUP BY status) s),
    'documents', (SELECT COALESCE(jsonb_object_agg(status, n), '{}'::jsonb)
                    FROM (SELECT status::text, count(*) n
                            FROM public.member_documents GROUP BY status) s),
    'expiring_30_days', (SELECT count(*) FROM public.memberships
                          WHERE status = 'active' AND end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30)
  ) INTO v;
  RETURN v;
END $$;

-- ---------------------------------------------------------------------------
-- Admin: monthly series for charts/reports (date-filterable)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_monthly_series(p_from DATE, p_to DATE)
RETURNS TABLE (
  month DATE,
  new_members BIGINT,
  applications_submitted BIGINT,
  applications_approved BIGINT,
  applications_rejected BIGINT,
  documents_uploaded BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF p_to < p_from OR p_to - p_from > 3660 THEN
    RAISE EXCEPTION 'Invalid date range' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  WITH months AS (
    SELECT generate_series(date_trunc('month', p_from), date_trunc('month', p_to), interval '1 month')::date AS m
  )
  SELECT mo.m,
    (SELECT count(*) FROM public.members x
      WHERE x.created_at >= mo.m AND x.created_at < mo.m + interval '1 month'),
    (SELECT count(*) FROM public.membership_applications x
      WHERE x.submitted_at >= mo.m AND x.submitted_at < mo.m + interval '1 month'),
    (SELECT count(*) FROM public.membership_applications x
      WHERE x.status = 'approved' AND x.reviewed_at >= mo.m AND x.reviewed_at < mo.m + interval '1 month'),
    (SELECT count(*) FROM public.membership_applications x
      WHERE x.status = 'rejected' AND x.reviewed_at >= mo.m AND x.reviewed_at < mo.m + interval '1 month'),
    (SELECT count(*) FROM public.member_documents x
      WHERE x.uploaded_at >= mo.m AND x.uploaded_at < mo.m + interval '1 month')
  FROM months mo
  ORDER BY mo.m;
END $$;

-- ---------------------------------------------------------------------------
-- Admin: server-side member search / filter / sort / paginate
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_search_members(
  p_search TEXT DEFAULT NULL,
  p_membership TEXT DEFAULT NULL,     -- active|pending|expired|cancelled|suspended|none
  p_application TEXT DEFAULT NULL,    -- application_status value or 'none'
  p_sort TEXT DEFAULT 'created_at',   -- name|member_number|created_at|updated_at
  p_desc BOOLEAN DEFAULT true,
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_search TEXT := NULLIF(trim(p_search), '');
  v_limit  INT := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 100);
  v_offset INT := GREATEST(COALESCE(p_offset, 0), 0);
  v_result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  WITH base AS (
    SELECT m.id AS member_id, m.member_number, m.first_name, m.last_name, m.phone,
           m.created_at, m.updated_at, m.avatar_url,
           u.email, u.role, u.is_active,
           COALESCE((SELECT public.membership_effective_status(ms.status, ms.end_date)
                       FROM public.memberships ms WHERE ms.member_id = m.id
                      ORDER BY ms.created_at DESC LIMIT 1), 'none') AS membership_status,
           (SELECT ms.end_date FROM public.memberships ms WHERE ms.member_id = m.id
             ORDER BY ms.created_at DESC LIMIT 1) AS membership_end_date,
           COALESCE((SELECT a.status::text FROM public.membership_applications a
                      WHERE a.member_id = m.id ORDER BY a.created_at DESC LIMIT 1), 'none') AS application_status,
           (SELECT a.id FROM public.membership_applications a
             WHERE a.member_id = m.id ORDER BY a.created_at DESC LIMIT 1) AS application_id
    FROM public.members m
    JOIN public.users u ON u.id = m.user_id
  ), filtered AS (
    SELECT * FROM base b
    WHERE (v_search IS NULL
           OR concat_ws(' ', b.first_name, b.last_name) ILIKE '%' || v_search || '%'
           OR b.email ILIKE '%' || v_search || '%'
           OR b.member_number ILIKE '%' || v_search || '%'
           OR b.phone ILIKE '%' || v_search || '%')
      AND (p_membership IS NULL OR b.membership_status = p_membership)
      AND (p_application IS NULL OR b.application_status = p_application)
  )
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM filtered),
    'rows', COALESCE((
      SELECT jsonb_agg(to_jsonb(r)) FROM (
        SELECT * FROM filtered
        ORDER BY
          CASE WHEN p_sort = 'name' AND NOT p_desc THEN lower(concat_ws(' ', first_name, last_name)) END ASC,
          CASE WHEN p_sort = 'name' AND p_desc THEN lower(concat_ws(' ', first_name, last_name)) END DESC,
          CASE WHEN p_sort = 'member_number' AND NOT p_desc THEN member_number END ASC,
          CASE WHEN p_sort = 'member_number' AND p_desc THEN member_number END DESC,
          CASE WHEN p_sort = 'updated_at' AND NOT p_desc THEN updated_at END ASC,
          CASE WHEN p_sort = 'updated_at' AND p_desc THEN updated_at END DESC,
          CASE WHEN p_sort NOT IN ('name', 'member_number', 'updated_at') AND NOT p_desc THEN created_at END ASC,
          CASE WHEN p_sort NOT IN ('name', 'member_number', 'updated_at') AND p_desc THEN created_at END DESC,
          member_id
        LIMIT v_limit OFFSET v_offset
      ) r), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.submit_application(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_application(UUID, public.application_status, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_document(UUID, public.document_status, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_monthly_series(DATE, DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_search_members(TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT, INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.on_document_uploaded() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_member_profile_updated() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.on_setting_changed() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.submit_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_application(UUID, public.application_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_document(UUID, public.document_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_monthly_series(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_members(TEXT, TEXT, TEXT, TEXT, BOOLEAN, INT, INT) TO authenticated;

COMMIT;
