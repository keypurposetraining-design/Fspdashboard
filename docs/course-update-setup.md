# Admin course details and dates

Run `database/migrations/011_course_details_dates.sql` in Supabase SQL Editor
after the previous migrations. Open `/admin/courses` or Courses & Dates in the
admin menu. Update the title, description, duration, format/venue, fee,
availability, and optional start/end dates, then Save course details.

Member course cards and enrollment details read these values from the database.
Members can use Refresh on `/courses` to see updates. A past enrollment keeps
its quoted fee, while new enrollments use the current fee. Course codes remain
unchanged so membership activation continues working for 30DC, TTX, and GTX.

End dates require a start date and cannot precede it. Availability can be disabled
to stop new enrollments while preserving existing registrations. RLS restricts
edits to administrators, and changes are written to the Activity Log.
