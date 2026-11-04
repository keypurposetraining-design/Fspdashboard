# Course and program enrollment

## Enable in Supabase

For a new Supabase project, set up the application schema first. Run each complete
file separately in SQL Editor, in this order:

1. `database/supabase_migrations.sql` (base schema, once on a fresh project)
2. `database/migrations/001_security_hotfix.sql`
3. `database/migrations/002_user_sync.sql`
4. `database/migrations/004_member_workflow.sql`
5. `database/migrations/005_workflow_rpcs.sql`
6. `database/migrations/006_offering_enrollments.sql`
7. `database/migrations/007_profile_read_permissions.sql`
8. `database/migrations/008_payment_receipts_membership.sql`
9. `database/migrations/009_profile_edit_permissions.sql`
10. `database/migrations/010_member_updates.sql`
11. `database/migrations/011_course_details_dates.sql`
12. `database/migrations/012_programs_dashboard_updates.sql`
13. `database/migrations/013_updates_storage_audit_permissions.sql`
14. `database/migrations/014_update_time_expiry.sql`
15. `database/migrations/015_unified_dashboard_programs.sql`
16. `database/migrations/016_course_daily_tasks.sql`
17. `database/migrations/017_session_reminders.sql`

For admin course editing and program dates, see `docs/course-update-setup.md`.

For dashboard announcements and program flyers, see `docs/member-updates-setup.md`.

For a permission error when saving `/profile/edit`, apply migration 009. It
grants updates only for editable member fields and the user display name, with
existing ownership policies and protected-column triggers still enforced.

See `docs/payment-receipt-setup.md` for screenshot uploads, Storage policies, and
the one-year membership activation flow after qualifying course payment approval.

If profile loading reports `permission denied for table users`, `members`, or
notifications, run migration 007. It grants authenticated reads explicitly and
permits marking notifications read; existing RLS policies remain enforced.

Stop if a file reports an error. If base tables already exist, inspect the existing
schema before re-running the historical base file: it is not idempotent. The
error `relation public.members does not exist` means the base schema is missing
or incomplete; migration 006 cannot create the application's member profiles.

Run `database/migrations/006_offering_enrollments.sql` in Supabase SQL Editor after
the existing base schema and migrations 001, 002, 004, and 005. This transaction
creates a database catalog, enrollments, payment settings, RLS policies, and RPCs.
It seeds the three courses and seven programs, including the requested fees.
Re-running it preserves administrator fee changes.

The migration has not been applied to the hosted project by this code change.
No database administrator credential is available in this workspace.

Open `/admin/courses` (also available from Content Hub → Courses) and save the
official payee, UPI/bank information, and support contact under Payment instructions.
Do not include private banking credentials. The default instructions are empty,
so members are told to contact support before paying.

## Member flow

1. Sign in and have a synced member profile in `public.members`.
2. Open `/courses`, select a course/program, read its details, and confirm.
3. Free offerings become active immediately; paid offerings become pending payment.
4. Pay using the official instructions, then submit the transaction/UTR reference.
5. The enrollment becomes payment under review. An administrator verifies the actual
   receipt of funds, checks the confirmation box, and approves it or returns it with a reason.
6. Refresh My Enrollments to see payment and enrollment status. Returned payments
   can be corrected and resubmitted. Members receive status notifications.

## Data and security

- `offerings.id` is the UUID used by enrollment; `code` is only a catalog identifier.
- Courses and programs share `offering_enrollments`; programs are not fake events.
- Fees come from the database. `enroll_offering` snapshots the amount/currency in
  a transaction. Later price changes affect only new enrollments.
- Members cannot insert/update enrollment rows directly. RPCs require an active
  authenticated account and check ownership; approval requires an active admin.
- A member can read only their own enrollments; admins can read all.
- Unique member/offering pairs prevent duplicate enrollment, including concurrent
  attempts. Transaction references cannot be reused across enrollments.
- Manual payment verification is used; no gateway charge or refund is performed.
- Registration, reference submission, and payment review write audit entries.
- Existing `courses`, `course_enrollments`, `events`, payments, certificates, and
  resources remain intact. Historical enrollment migration and automatic course
  content access are separate from this registration flow. Legacy certificate/task
  relations continue using the legacy courses table.

## Verification

Run `npx.cmd tsc --noEmit` and targeted ESLint for the changed TypeScript files.
For a local in-memory PostgreSQL check, install `@electric-sql/pglite` in a
temporary directory and run:

```text
node database/tests/run-enrollment-check.mjs <path-to-@electric-sql/pglite>
```

The harness uses a minimal prior schema and
the actual role, audit, and notification functions from migrations 001 and 005;
it does not replace a smoke test against the hosted project's complete schema.
`database/tests/006_offering_enrollments.sql` is a rollback-only integration test
for a disposable Supabase development database with the migrations applied. It
creates temporary test identities and offerings, checks fee snapshots, duplicate
enrollment, free confirmation, owner isolation, direct-write restrictions,
payment return/resubmission, and approval permissions. Run it through SQL Editor
or `psql -v ON_ERROR_STOP=1 -f database/tests/006_offering_enrollments.sql`.

Finally test using one member and one admin in the live app: free registration,
paid enrollment, reference submission, return with a reason, resubmission,
approval, and member refresh. Check `/admin/courses` after each action. A missing
migration produces an actionable availability error instead of silent failure.
