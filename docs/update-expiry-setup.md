# Program time and automatic expiry

Apply `014_update_time_expiry.sql` after migration 013. Admin and Super Admin
can enter Program time in India time on Today's Updates and Courses & Dates.
Choose a flyer, click the yellow Upload Image button, then publish/save. Uploading
alone does not publish the post; publishing also uploads a selected file if needed.

Updates with a program date expire at 12 AM immediately after that date in
Asia/Kolkata. Linked multi-day programs expire after their end date when provided.
Undated updates do not expire. The catalog/enrollment records remain intact;
automatic deletion applies to dashboard update posts, not courses or payment history.

RLS hides expired updates from members immediately when queried. Dashboard Refresh
or the one-minute refresh removes already-loaded posts. Migration 014 attempts
to enable pg_cron and schedules `fsp-expire-updates` every minute to delete expired
posts. Check Supabase Cron for the job. If a NOTICE reports scheduling unavailable,
enable pg_cron in Extensions, then rerun 014, or schedule this SQL every minute:

```sql
SELECT public.expire_member_updates();
```

The first run removes any already-expired posts. Flyer files remain in private
Storage; this job does not delete Storage objects directly. Existing signed flyer
links may remain valid until their one-hour expiration. Apply migrations in order
and rerun 014 last if an older migration restores previous function signatures.
