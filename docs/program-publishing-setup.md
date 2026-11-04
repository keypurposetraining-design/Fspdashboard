# Add programs and publish updates

Apply `012_programs_dashboard_updates.sql` after migrations 010 and 011.
The private `program-flyers` bucket and its admin upload/member read policies
must be configured as described in `member-updates-setup.md`.

Both Admin and Super Admin use `/admin/courses`:

1. Choose Add Program. Select Program or Course.
2. Enter the title, full content, duration, venue/format, fee, and optional dates.
3. Upload a JPG, PNG, or WebP flyer (maximum 5 MB).
4. Leave availability enabled and choose Add & publish program.
5. The record appears in the member catalog and Today's Updates. All active
   member/trainer accounts receive an in-app notification.
6. Edit an existing record and choose Update & publish to update the same
   dashboard post. This avoids duplicate posts for repeated edits.

Members see updates on the dashboard within its one-minute refresh interval,
or immediately after clicking Refresh. Catalog changes appear on catalog Refresh.
Admin and Super Admin read the same database records. An unchanged save does not
send another notification. Disabling availability removes the program from the
active catalog and archives its linked dashboard update; existing enrollments
remain intact. Existing paid enrollment amounts remain unchanged.

Program creation/updates are transactional and admin-only; flyer ownership is
validated by the save RPC. Updates are audited. Adding a new paid program does
not automatically qualify it for membership activation: the existing 30DC, TTX,
and GTX codes remain the qualifying courses. No email is sent.
