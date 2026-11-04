# Enrolled courses and daily tasks

Apply `016_course_daily_tasks.sql` after 015, then refresh the dashboard.
The account box lists the member's enrolled courses. Pending enrollments are
shown with their payment status; daily tasks unlock only for active enrollments.

FSP 30 Days Challenge has thirty editable starter facilitation exercises. In the
dashboard's admin Program setup panel, find FSP 30 Days Challenge and expand
Edit 30 daily tasks. Review/change each title and instructions for your curriculum.
Re-running 016 preserves those edits and member completion records.

The member sees only the first unfinished day. Done saves its completion in
Supabase and advances to the next task immediately. This is sequential progress,
not a calendar-day timer; there is no overnight wait before the next task.
Refreshing or signing in elsewhere resumes the saved progress. At 30/30 the
challenge is marked complete in the task panel. Enrollment/payment status is
not changed by marking a task done. Other courses show their titles but no
invented daily curriculum; their tasks can be configured separately.

RLS isolates member progress. The completion RPC locks the enrollment, checks
ownership and active status, prevents skipping, and treats repeat completion
requests idempotently. Members cannot write progress directly. Administrators
can edit task instructions. Completions are audited.

Run the PostgreSQL harness to verify thirty-day progression, skip prevention,
duplicate Done requests, unpaid enrollment restrictions, and owner isolation.
