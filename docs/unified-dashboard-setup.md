# Integrated FSP dashboard

The existing `/dashboard` and `/admin` overview now render the same role-aware
dashboard. No program or enrollment management pages were added for this change.
Existing legacy routes remain available for compatibility and existing admin tools.

## Enable

1. Apply migrations through 014, then run `015_unified_dashboard_programs.sql`.
2. Expand Program setup & payment instructions inside the admin dashboard. Set
   the actual program start date, start time, end time, mode (online/offline),
   poster, fee, and registration availability. Existing Admin Courses & Dates
   remains available for compatibility.
3. Open `/dashboard` as a member or administrator. Admin Overview also shows it.

Existing dated announcements are linked to persistent programs by migration 015.
Publishing a new dated update creates a schedulable program as well. Because an
announcement has no verified price, its registration starts closed: confirm the
fee/mode/end time in the existing admin editor and open registration. Undated
announcements remain informational. No member is silently enrolled.

The dashboard order is Membership Overview, Today's Programs, Upcoming Programs,
My Enrollments, then admin-only Enrollment Overview and Program Enrollment Details.
Undated catalog items remain accessible in an expandable panel. Other announcements
are retained below the primary sections without duplicating linked program posts.

## Behavior

- Dates and grouping use Asia/Kolkata. Published/created dates do not determine
  today's or upcoming categories. Future records sort by scheduled date/time.
- Past and inactive programs are excluded from active scheduled sections. Undated
  programs are not assigned fictional dates. Unknown modes/times are shown as
  awaiting confirmation; fill them in through the admin editor.
- Online cards use blue badges; offline cards use green badges. Posters remain
  centered and retain their aspect ratio. The dashboard uses normal page scrolling.
- Enrollment confirmation and manual payment submission stay inside the dashboard
  dialog. My Enrollments updates from the server response immediately.
- Both RLS and an explicit member-id filter limit My Enrollments to the signed-in
  member, including when an admin has a personal historical enrollment.
- The enrollment RPC checks account/profile, program availability, registration
  closure, past dates, and today's end time in India time. Unique member/program
  constraints and quoted fees remain unchanged.
- Admin statistics derive from database enrollment records. Successful enrollment
  counts mean active/confirmed records; the management table includes all statuses.
  Programs with no enrollment means no records of any status.
- Admin records support search, program/status filters, 10-record pagination, and
  inline program/member details. Payment verification is available in expandable
  rows. Pagination is client-side over the admin's authorized enrollment dataset.
- Membership/program/record data refresh every minute and programs refresh on
  window focus. Administrative statistics refresh after payment review.

## Verification

Run TypeScript, targeted ESLint, `npm run build`, and:

```text
node database/tests/program-schedule.cjs
node database/tests/admin-navigation.cjs
node --wasm-lazy-compilation --liftoff-only database/tests/run-enrollment-check.mjs <PGlite-package-directory>
```

The PostgreSQL harness covers registration closure, date eligibility, duplicate
prevention, payment review, role/owner restrictions, and migration re-runs. It
uses a minimal prior schema; smoke-test against the hosted project after applying
015. Google Fonts must be reachable for the existing production build.
