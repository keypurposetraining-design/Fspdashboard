# Today's Updates

Run `database/migrations/010_member_updates.sql` after the prior migrations.
It adds the updates table, admin-only publish/archive RPCs, in-app notifications,
and explicit dashboard read privileges for applications/documents. RLS remains enabled.

Open `/admin/updates` or choose Today's Updates in the admin navigation. Enter
the title, program details, optional date/venue, and an optional JPG/PNG/WebP flyer
(maximum 5 MB). Publish to all members. Members see it on `/dashboard`; their
notification bell links to the dashboard. The feed refreshes every minute or with
Refresh. Older published updates remain available until archived. No email or
external message is sent. Archiving removes the post/flyer from member access;
already-created notifications remain as history, and previously issued signed
flyer links can remain valid for up to one hour.

Check Storage for a private `program-flyers` bucket with a 5 MB limit and allowed
types `image/jpeg`, `image/png`, `image/webp`. If SQL reports insufficient storage
ownership and skips setup, create the bucket and these policies in Storage →
Policies, for the authenticated role:

INSERT:
```sql
bucket_id = 'program-flyers'
AND public.is_admin()
AND (storage.foldername(name))[1] = auth.uid()::text
```

SELECT:
```sql
bucket_id = 'program-flyers'
AND (public.is_admin() OR EXISTS (
  SELECT 1 FROM public.member_updates
  WHERE flyer_path = name AND is_published
))
```

Keep the bucket private. No member upload, UPDATE, or DELETE grants are needed.
The local PostgreSQL test checks admin-only publishing, member read access,
notifications, disabled-account exclusion, and archive/flyer visibility.
