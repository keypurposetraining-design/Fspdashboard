# Payment screenshots and membership activation

1. Run migration `007_profile_read_permissions.sql` if it has not succeeded yet.
2. Run the complete `008_payment_receipts_membership.sql` in Supabase SQL Editor.
3. Check Dashboard → Storage for a **private** `payment-receipts` bucket, maximum
   file size **5 MB**, allowed types `image/jpeg`, `image/png`, `image/webp`.
4. Check for the `payment receipts upload` and `payment receipts read` policies.
   Some Supabase projects restrict SQL ownership of `storage.objects`. If the
   migration prints a NOTICE about skipped policies, create them in Storage →
   Policies, targeting the authenticated role, with the expressions below.
5. Members enroll through Courses, then use Payments → My Enrollments → Payment
   details to upload a screenshot and enter the completed transaction reference.
6. Administrators use `/admin/payments` → Awaiting review. Click View payment
   screenshot, then Open payment screenshot. Verify the amount and reference
   against actual received funds, check the verification box, and choose
   **Approve & activate**. Return for correction requires a reason.
7. After approval, refresh Membership. An approved paid FSP-30DC, FSP-TTX, or
   FSP-GTX activates a one-year standard membership in the same transaction.
   Existing longer or lifetime terms are preserved. Multiple approvals do not
   stack extra years or create duplicate memberships. Free registrations and
   nonqualifying programs do not activate membership.

Uploading proof alone does not activate membership. Receipt files are private,
read with short-lived signed links, and cannot be overwritten through member
storage policies. Receipt approval and membership activation are audited.
Member Documents was removed from navigation; existing document records and
the admin document tools remain available. Membership loading no longer queries
documents or applications.

## INSERT policy expression

```sql
bucket_id = 'payment-receipts'
AND (storage.foldername(name))[1] = auth.uid()::text
AND EXISTS (
  SELECT 1 FROM public.offering_enrollments e
  JOIN public.members m ON m.id = e.member_id
  WHERE e.id::text = (storage.foldername(name))[2]
    AND m.user_id = auth.uid()
    AND e.status = 'pending_payment'
)
```

## SELECT policy expression

```sql
bucket_id = 'payment-receipts'
AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
```

No member UPDATE or DELETE policy is needed for receipts. Do not make the bucket
public. Apply migrations in order; re-running an older 006 after 008 would restore
the old payment-submission function. Re-run 008 last if that happens.
