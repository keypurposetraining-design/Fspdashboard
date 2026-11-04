-- Apply after 007. Private payment receipts and one-year course-paid membership.
BEGIN;
ALTER TABLE public.offering_enrollments ADD COLUMN IF NOT EXISTS receipt_path text;
DROP FUNCTION IF EXISTS public.submit_enrollment_payment(uuid,text);
CREATE OR REPLACE FUNCTION public.submit_enrollment_payment(p_enrollment_id uuid, p_reference text, p_receipt_path text DEFAULT NULL)
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
  IF p_receipt_path IS NULL OR p_receipt_path NOT LIKE auth.uid()::text || '/' || v_row.id::text || '/%'
     OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'payment-receipts' AND name = p_receipt_path) THEN
    RAISE EXCEPTION 'Upload your payment screenshot before submitting.';
  END IF;
  UPDATE public.offering_enrollments SET receipt_path = p_receipt_path, payment_reference = btrim(p_reference), status = 'payment_review',
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
DECLARE v_row public.offering_enrollments%ROWTYPE; v_user uuid; v_membership uuid;
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
  IF p_approve AND v_row.amount > 0 AND EXISTS (
    SELECT 1 FROM public.offerings WHERE id = v_row.offering_id AND code IN ('FSP-30DC','FSP-TTX','FSP-GTX')
  ) THEN
    -- Lock the member so simultaneous approvals cannot create duplicate terms.
    PERFORM 1 FROM public.members WHERE id = v_row.member_id FOR UPDATE;
    SELECT id INTO v_membership FROM public.memberships WHERE member_id = v_row.member_id
      ORDER BY created_at DESC, id DESC LIMIT 1 FOR UPDATE;
    IF v_membership IS NULL THEN
      INSERT INTO public.memberships(member_id,start_date,end_date,status,membership_type,created_by)
      VALUES (v_row.member_id,CURRENT_DATE,(CURRENT_DATE + interval '1 year')::date,'active','standard',auth.uid())
      RETURNING id INTO v_membership;
    ELSE
      UPDATE public.memberships SET status = 'active',
        start_date = CASE WHEN status = 'active' AND (end_date IS NULL OR end_date >= CURRENT_DATE) THEN start_date ELSE CURRENT_DATE END,
        end_date = CASE WHEN status = 'active' AND end_date IS NULL THEN NULL ELSE greatest(end_date,(CURRENT_DATE + interval '1 year')::date) END,
        updated_at = now(), updated_by = auth.uid() WHERE id = v_membership;
    END IF;
    PERFORM public._audit('MEMBERSHIP_UPDATED','memberships',v_membership,
      jsonb_build_object('reason','Qualifying course payment approved','enrollment_id',v_row.id));
    PERFORM public._notify(v_user,'info','Membership activated','Your qualifying course payment has activated your one-year FSP membership.','membership','/membership');
  END IF;
  PERFORM public._audit(CASE WHEN p_approve THEN 'enrollment payment approved' ELSE 'enrollment payment returned' END,
    'offering_enrollments', v_row.id, jsonb_build_object('note', p_note, 'amount', v_row.amount));
  PERFORM public._notify(v_user, 'info', CASE WHEN p_approve THEN 'Enrollment active' ELSE 'Payment needs attention' END,
    CASE WHEN p_approve THEN 'Your payment has been verified and your enrollment is active.' ELSE p_note END,
    'system', '/courses');
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_enrollment_payment(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_enrollment_payment(uuid,text,text) TO authenticated;
DO $storage$
BEGIN
  BEGIN
    INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    VALUES ('payment-receipts','payment-receipts',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
    ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880, allowed_mime_types = EXCLUDED.allowed_mime_types;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Create payment-receipts in Storage: private, 5 MB, JPEG/PNG/WebP.';
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "payment receipts upload" ON storage.objects';
    EXECUTE $p$CREATE POLICY "payment receipts upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
      bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text
      AND EXISTS (SELECT 1 FROM public.offering_enrollments e JOIN public.members m ON m.id = e.member_id
        WHERE e.id::text = (storage.foldername(name))[2] AND m.user_id = auth.uid() AND e.status = 'pending_payment')
    )$p$;
    EXECUTE 'DROP POLICY IF EXISTS "payment receipts read" ON storage.objects';
    EXECUTE $p$CREATE POLICY "payment receipts read" ON storage.objects FOR SELECT TO authenticated USING (
      bucket_id = 'payment-receipts' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
    )$p$;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Add payment receipts upload/read policies in Dashboard Storage Policies using the expressions in this file.';
  END;
END
$storage$;
NOTIFY pgrst, 'reload schema';
COMMIT;