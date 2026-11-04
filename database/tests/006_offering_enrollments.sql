-- Run only on a development Supabase database after migrations 001-006.
-- All fixture rows are rolled back. Sequence counters may advance.
BEGIN;

INSERT INTO public.users(id,email,name,role,is_active) VALUES
('06000000-0000-0000-0000-000000000001','enrollment-test-one@example.invalid','Test One','member',true),
('06000000-0000-0000-0000-000000000002','enrollment-test-two@example.invalid','Test Two','member',true),
('06000000-0000-0000-0000-000000000003','enrollment-test-admin@example.invalid','Test Admin','admin',true),
('06000000-0000-0000-0000-000000000004','enrollment-test-no-profile@example.invalid','No profile','member',true),
('06000000-0000-0000-0000-000000000005','enrollment-test-disabled@example.invalid','Disabled','member',false);
INSERT INTO public.members(id,user_id,first_name) VALUES
('06000000-0000-0000-0000-000000000011','06000000-0000-0000-0000-000000000001','One'),
('06000000-0000-0000-0000-000000000012','06000000-0000-0000-0000-000000000002','Two');
INSERT INTO public.offerings(id,code,title,description,kind,duration,price) VALUES
('06000000-0000-0000-0000-000000000021','TEST-PAID','Test paid','Test','course','2 Days',15000),
('06000000-0000-0000-0000-000000000022','TEST-FREE','Test free','Test','program','Monthly',0);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000001',true);
DO $$
DECLARE a public.offering_enrollments; b public.offering_enrollments; denied boolean;
BEGIN
  a := public.enroll_offering('06000000-0000-0000-0000-000000000021');
  PERFORM set_config('enrollment_test.owner_id',a.id::text,true);
  b := public.enroll_offering('06000000-0000-0000-0000-000000000021');
  IF a.id <> b.id OR a.amount <> 15000 OR a.status <> 'pending_payment' THEN RAISE EXCEPTION 'Paid enrollment or deduplication failed'; END IF;
  b := public.enroll_offering('06000000-0000-0000-0000-000000000022');
  IF b.status <> 'active' OR b.amount <> 0 THEN RAISE EXCEPTION 'Free registration failed'; END IF;
  denied := false;
  BEGIN PERFORM public.submit_enrollment_payment(b.id,'FREE-REFERENCE');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'This enrollment is not awaiting payment.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Payment accepted for free registration'; END IF;
  denied := false;
  BEGIN UPDATE public.offering_enrollments SET amount = 1 WHERE id = a.id;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Members can modify protected enrollment data'; END IF;
  denied := false;
  BEGIN UPDATE public.offerings SET price = 1 WHERE id = a.offering_id;
    IF FOUND THEN RAISE EXCEPTION 'Member changed catalog fee'; END IF;
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  a := public.submit_enrollment_payment(a.id,'TEST-UTR-ONE');
  IF a.status <> 'payment_review' THEN RAISE EXCEPTION 'Payment submission failed'; END IF;
  denied := false;
  BEGIN PERFORM public.review_enrollment_payment(a.id,true,'');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Administrator access required.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Member approved their own payment'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000002',true);
DO $$
DECLARE a public.offering_enrollments; denied boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM public.offering_enrollments WHERE member_id = '06000000-0000-0000-0000-000000000011') THEN RAISE EXCEPTION 'RLS exposed another member enrollment'; END IF;
  BEGIN PERFORM public.submit_enrollment_payment(current_setting('enrollment_test.owner_id')::uuid,'OTHER-USER-REFERENCE');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Enrollment not found.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Member modified another member payment'; END IF;
  denied := false;
  a := public.enroll_offering('06000000-0000-0000-0000-000000000021');
  BEGIN PERFORM public.submit_enrollment_payment(a.id,'TEST-UTR-ONE');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'That transaction reference has already been submitted.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Duplicate payment reference accepted'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000003',true);
DO $$
DECLARE a public.offering_enrollments; denied boolean := false;
BEGIN
  UPDATE public.offerings SET price = 60000 WHERE code = 'TEST-PAID';
  SELECT * INTO a FROM public.offering_enrollments WHERE member_id = '06000000-0000-0000-0000-000000000011' AND status = 'payment_review';
  IF a.amount <> 15000 THEN RAISE EXCEPTION 'Existing enrollment fee changed'; END IF;
  BEGIN PERFORM public.review_enrollment_payment(a.id,false,'');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Provide a reason when returning a payment.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Return accepted without a reason'; END IF;
  a := public.review_enrollment_payment(a.id,false,'Please correct the reference.');
  IF a.status <> 'pending_payment' OR a.review_note IS NULL THEN RAISE EXCEPTION 'Payment return failed'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000001',true);
DO $$
DECLARE a public.offering_enrollments;
BEGIN
  SELECT * INTO a FROM public.offering_enrollments WHERE offering_id = '06000000-0000-0000-0000-000000000021';
  a := public.submit_enrollment_payment(a.id,'TEST-UTR-CORRECTED');
  IF a.status <> 'payment_review' THEN RAISE EXCEPTION 'Resubmission failed'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000003',true);
DO $$
DECLARE a public.offering_enrollments; denied boolean := false;
BEGIN
  SELECT * INTO a FROM public.offering_enrollments WHERE member_id = '06000000-0000-0000-0000-000000000011' AND status = 'payment_review';
  a := public.review_enrollment_payment(a.id,true,'Verified against bank statement.');
  IF a.status <> 'active' OR a.reviewed_by <> auth.uid() THEN RAISE EXCEPTION 'Approval failed'; END IF;
  BEGIN PERFORM public.review_enrollment_payment(a.id,true,'');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Payment is no longer awaiting review. Refresh the list.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Repeated review accepted'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000004',true);
DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN PERFORM public.enroll_offering('06000000-0000-0000-0000-000000000021');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Complete your member profile before enrolling.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Enrollment accepted without member profile'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','06000000-0000-0000-0000-000000000005',true);
DO $$
DECLARE denied boolean := false;
BEGIN
  BEGIN PERFORM public.enroll_offering('06000000-0000-0000-0000-000000000021');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Please sign in with an active account.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Disabled account enrolled'; END IF;
END $$;
RESET ROLE;
DO $$ BEGIN
  IF has_function_privilege('anon','public.enroll_offering(uuid)','EXECUTE') OR
     has_function_privilege('anon','public.submit_enrollment_payment(uuid,text)','EXECUTE') OR
     has_function_privilege('anon','public.review_enrollment_payment(uuid,boolean,text)','EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous user can call enrollment RPCs';
  END IF;
END $$;
ROLLBACK;
