BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES
('08000000-0000-0000-0000-000000000001','receipt-member@example.invalid','member',true),
('08000000-0000-0000-0000-000000000002','receipt-admin@example.invalid','admin',true),
('08000000-0000-0000-0000-000000000003','receipt-other@example.invalid','member',true);
INSERT INTO public.members(id,user_id) VALUES ('08000000-0000-0000-0000-000000000011','08000000-0000-0000-0000-000000000001');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','08000000-0000-0000-0000-000000000001',true);
DO $$
DECLARE e public.offering_enrollments; denied boolean := false; path text;
BEGIN
  e := public.enroll_offering((SELECT id FROM public.offerings WHERE code = 'FSP-TTX'));
  PERFORM set_config('receipt_test.enrollment',e.id::text,true);
  BEGIN PERFORM public.submit_enrollment_payment(e.id,'TEST-RECEIPT-UTR',NULL);
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Upload your payment screenshot before submitting.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Payment submitted without proof'; END IF;
  path := auth.uid()::text || '/' || e.id::text || '/receipt.png';
  INSERT INTO storage.objects(bucket_id,name) VALUES ('payment-receipts',path);
  e := public.submit_enrollment_payment(e.id,'TEST-RECEIPT-UTR',path);
  IF e.status <> 'payment_review' OR e.receipt_path <> path THEN RAISE EXCEPTION 'Receipt submission failed'; END IF;
  IF EXISTS (SELECT 1 FROM public.memberships) THEN RAISE EXCEPTION 'Membership activated before verification'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','08000000-0000-0000-0000-000000000003',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'payment-receipts') THEN RAISE EXCEPTION 'Private receipt exposed to another member'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','08000000-0000-0000-0000-000000000002',true);
DO $$
DECLARE e public.offering_enrollments;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'payment-receipts') THEN RAISE EXCEPTION 'Admin cannot read payment receipt'; END IF;
  e := public.review_enrollment_payment(current_setting('receipt_test.enrollment')::uuid,true,'Receipt and transaction verified.');
  IF NOT EXISTS (SELECT 1 FROM public.memberships WHERE member_id = e.member_id AND status = 'active' AND end_date = (CURRENT_DATE + interval '1 year')::date) THEN
    RAISE EXCEPTION 'Approval did not activate one-year membership';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','08000000-0000-0000-0000-000000000001',true);
DO $$
DECLARE e public.offering_enrollments;
BEGIN
  e := public.enroll_offering((SELECT id FROM public.offerings WHERE code = 'FSP-MM'));
  IF (SELECT count(*) FROM public.memberships) <> 1 THEN RAISE EXCEPTION 'Free program changed membership'; END IF;
END $$;
DO $$
DECLARE v_code text; e public.offering_enrollments; path text;
BEGIN
  FOREACH v_code IN ARRAY ARRAY['FSP-30DC','FSP-GTX'] LOOP
    e := public.enroll_offering((SELECT o.id FROM public.offerings o WHERE o.code = v_code));
    path := auth.uid()::text || '/' || e.id::text || '/receipt.png';
    INSERT INTO storage.objects(bucket_id,name) VALUES ('payment-receipts',path);
    e := public.submit_enrollment_payment(e.id,'TEST-' || v_code,path);
    PERFORM set_config('request.jwt.claim.sub','08000000-0000-0000-0000-000000000002',true);
    e := public.review_enrollment_payment(e.id,true,'Verified');
    PERFORM set_config('request.jwt.claim.sub','08000000-0000-0000-0000-000000000001',true);
    IF (SELECT count(*) FROM public.memberships) <> 1 THEN RAISE EXCEPTION 'Multiple payments created duplicate memberships'; END IF;
  END LOOP;
END $$;
RESET ROLE;
ROLLBACK;
