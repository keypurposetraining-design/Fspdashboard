-- Apply after 001, 002, 004 and 005. Legacy course/event records remain intact.
BEGIN;

-- Explain missing prerequisites before creating any enrollment objects.
DO $$
BEGIN
  IF to_regclass('public.users') IS NULL OR to_regclass('public.members') IS NULL THEN
    RAISE EXCEPTION 'Base schema is missing. Set up database/supabase_migrations.sql first, then apply migrations 001, 002, 004, 005 and 006 in order.';
  END IF;
  IF to_regprocedure('public.is_admin()') IS NULL
     OR to_regprocedure('public._audit(text,text,uuid,jsonb)') IS NULL
     OR to_regprocedure('public._notify(uuid,public.notification_type,text,text,text,text)') IS NULL
     OR to_regprocedure('public._notify_admins(text,text,text,text)') IS NULL THEN
    RAISE EXCEPTION 'Enrollment prerequisites are missing. Apply migrations 001, 002, 004 and 005 before running 006.';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('course', 'program')),
  duration text NOT NULL,
  format text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.offering_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid NOT NULL REFERENCES public.offerings(id),
  member_id uuid NOT NULL REFERENCES public.members(id),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL CHECK (status IN ('pending_payment', 'payment_review', 'active')),
  payment_reference text CHECK (char_length(payment_reference) BETWEEN 3 AND 120),
  review_note text CHECK (char_length(review_note) <= 1000),
  reviewed_by uuid REFERENCES public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, offering_id)
);
CREATE INDEX IF NOT EXISTS offering_enrollments_review_idx ON public.offering_enrollments(status);
CREATE UNIQUE INDEX IF NOT EXISTS offering_enrollments_reference_idx
  ON public.offering_enrollments(lower(payment_reference)) WHERE payment_reference IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.enrollment_payment_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  instructions text NOT NULL DEFAULT '' CHECK (char_length(instructions) <= 4000)
);
INSERT INTO public.enrollment_payment_settings(id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS offerings_read ON public.offerings;
CREATE POLICY offerings_read ON public.offerings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS offerings_admin ON public.offerings;
CREATE POLICY offerings_admin ON public.offerings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS enrollments_read ON public.offering_enrollments;
CREATE POLICY enrollments_read ON public.offering_enrollments FOR SELECT TO authenticated
  USING (public.is_admin() OR member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS payment_settings_read ON public.enrollment_payment_settings;
CREATE POLICY payment_settings_read ON public.enrollment_payment_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS payment_settings_admin ON public.enrollment_payment_settings;
CREATE POLICY payment_settings_admin ON public.enrollment_payment_settings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

REVOKE ALL ON public.offerings, public.offering_enrollments, public.enrollment_payment_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.offerings, public.offering_enrollments, public.enrollment_payment_settings TO authenticated;
GRANT UPDATE (price, is_active) ON public.offerings TO authenticated;
GRANT UPDATE (instructions) ON public.enrollment_payment_settings TO authenticated;

CREATE OR REPLACE FUNCTION public.enroll_offering(p_offering_id uuid)
RETURNS public.offering_enrollments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member uuid;
  v_offer public.offerings%ROWTYPE;
  v_result public.offering_enrollments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'Please sign in with an active account.';
  END IF;
  SELECT id INTO v_member FROM public.members WHERE user_id = auth.uid();
  IF v_member IS NULL THEN RAISE EXCEPTION 'Complete your member profile before enrolling.'; END IF;
  SELECT * INTO v_offer FROM public.offerings WHERE id = p_offering_id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This course or program is no longer available.'; END IF;
  INSERT INTO public.offering_enrollments(offering_id, member_id, amount, currency, status)
    VALUES (v_offer.id, v_member, v_offer.price, v_offer.currency,
            CASE WHEN v_offer.price = 0 THEN 'active' ELSE 'pending_payment' END)
    ON CONFLICT (member_id, offering_id) DO NOTHING RETURNING * INTO v_result;
  IF v_result.id IS NULL THEN
    SELECT * INTO v_result FROM public.offering_enrollments WHERE offering_id = p_offering_id AND member_id = v_member;
  ELSE
    PERFORM public._audit('offering enrolled', 'offering_enrollments', v_result.id,
      jsonb_build_object('offering_id', v_offer.id, 'amount', v_offer.price));
    PERFORM public._notify(auth.uid(), 'info', 'Enrollment saved',
      v_offer.title || CASE WHEN v_offer.price = 0 THEN ': registration confirmed.' ELSE ': payment is pending.' END,
      'system', '/courses');
  END IF;
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_enrollment_payment(p_enrollment_id uuid, p_reference text)
RETURNS public.offering_enrollments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.offering_enrollments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'Please sign in with an active account.';
  END IF;
  SELECT e.* INTO v_row FROM public.offering_enrollments e JOIN public.members m ON m.id = e.member_id
    WHERE e.id = p_enrollment_id AND m.user_id = auth.uid() FOR UPDATE OF e;
  IF NOT FOUND THEN RAISE EXCEPTION 'Enrollment not found.'; END IF;
  IF v_row.status <> 'pending_payment' OR v_row.amount = 0 THEN RAISE EXCEPTION 'This enrollment is not awaiting payment.'; END IF;
  IF p_reference IS NULL OR char_length(btrim(p_reference)) NOT BETWEEN 3 AND 120 THEN
    RAISE EXCEPTION 'Enter a transaction reference between 3 and 120 characters.';
  END IF;
  UPDATE public.offering_enrollments SET payment_reference = btrim(p_reference), status = 'payment_review',
    review_note = NULL, reviewed_at = NULL, reviewed_by = NULL, updated_at = now()
    WHERE id = v_row.id RETURNING * INTO v_row;
  PERFORM public._audit('enrollment payment submitted', 'offering_enrollments', v_row.id, '{}'::jsonb);
  PERFORM public._notify_admins('Enrollment payment awaiting review',
    'A member submitted a payment reference. Verify the payment before approving.', 'system', '/admin/courses');
  RETURN v_row;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'That transaction reference has already been submitted.';
END;
$$;

CREATE OR REPLACE FUNCTION public.review_enrollment_payment(p_enrollment_id uuid, p_approve boolean, p_note text DEFAULT '')
RETURNS public.offering_enrollments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.offering_enrollments%ROWTYPE; v_user uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required.'; END IF;
  IF p_approve IS NULL OR char_length(coalesce(p_note, '')) > 1000 THEN RAISE EXCEPTION 'Invalid review.'; END IF;
  IF NOT p_approve AND nullif(btrim(p_note), '') IS NULL THEN RAISE EXCEPTION 'Provide a reason when returning a payment.'; END IF;
  SELECT * INTO v_row FROM public.offering_enrollments WHERE id = p_enrollment_id FOR UPDATE;
  IF NOT FOUND OR v_row.status <> 'payment_review' THEN RAISE EXCEPTION 'Payment is no longer awaiting review. Refresh the list.'; END IF;
  UPDATE public.offering_enrollments SET status = CASE WHEN p_approve THEN 'active' ELSE 'pending_payment' END,
    review_note = nullif(btrim(p_note), ''), reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now(),
    payment_reference = CASE WHEN p_approve THEN payment_reference ELSE NULL END
    WHERE id = v_row.id RETURNING * INTO v_row;
  SELECT user_id INTO v_user FROM public.members WHERE id = v_row.member_id;
  PERFORM public._audit(CASE WHEN p_approve THEN 'enrollment payment approved' ELSE 'enrollment payment returned' END,
    'offering_enrollments', v_row.id, jsonb_build_object('note', p_note, 'amount', v_row.amount));
  PERFORM public._notify(v_user, 'info', CASE WHEN p_approve THEN 'Enrollment active' ELSE 'Payment needs attention' END,
    CASE WHEN p_approve THEN 'Your payment has been verified and your enrollment is active.' ELSE p_note END,
    'system', '/courses');
  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.enroll_offering(uuid), public.submit_enrollment_payment(uuid,text),
  public.review_enrollment_payment(uuid,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enroll_offering(uuid), public.submit_enrollment_payment(uuid,text),
  public.review_enrollment_payment(uuid,boolean,text) TO authenticated;

-- Initial catalog. Re-running the migration preserves admin-edited fees.
INSERT INTO public.offerings(code,title,description,kind,duration,format,price,sort_order) VALUES
('FSP-30DC','FSP 30 Days Challenge','A 30-day daily practice program to build facilitation habits, sharpen core skills, and develop reflective practice through structured exercises and peer accountability.','course','30 Days',NULL,12000,1),
('FSP-TTX','FSP TTX — 2-Day Transformational Residential Experience','Step away from your routine. Step into an immersive two-day residential experience focused on self-discovery, meaningful connection, and personal growth. Return with renewed clarity and practical next steps.','course','2 Days','Residential',15000,2),
('FSP-GTX','FSP GTX — Growth Transformation Experience','A six-month journey to turn growth goals into consistent action. Strengthen your facilitation practice, build confidence, and develop habits that support personal and professional progress through intentional practice and reflection.','course','6 Months',NULL,60000,3),
('FSP-MM','FSP Mastermind','Peer-to-peer mastermind for senior facilitators, exploring facilitation challenges, business growth, and thought leadership.','program','Monthly','Live Online + In-Person Retreats',0,4),
('FSP-CC','FSP Catalyst Connect','Networking and collaboration for trainers, HR professionals, and facilitators. Connect, collaborate, and grow.','program','Quarterly','Offline',0,5),
('FSP-WM','FSP Wednesday Masterclass','Weekly live masterclasses sharing advanced techniques, case studies, and interactive practice.','program','Weekly (Wednesdays)','Live Online',0,6),
('FSP-HC','FSP Habit Circle','Daily micro-practices, accountability, and reflection to embed facilitation habits into professional life.','program','Daily','Online Community + Weekly Live',0,7),
('FSP-GST','FSP Goal Setting Time','Guided goal setting to clarify priorities, set measurable objectives, and create actionable plans.','program','Monthly','Live Online',0,8),
('FSP-BB','FSP Beyond Barriers','Explore facilitation in high-stakes, cross-cultural, and conflict-intensive environments.','program','Bi-Monthly','Live Online + Workshops',3000,9),
('FSP-FD','FSP Fun Day','Community celebration with games, peer recognition, and informal networking.','program','Quarterly','Offline / Hybrid',0,10)
ON CONFLICT (code) DO NOTHING;
COMMIT;
