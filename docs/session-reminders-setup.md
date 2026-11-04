# Session reminders

Apply migration `017_session_reminders.sql` after 016. Check Supabase Cron for
`fsp-session-reminders`, running every minute. If scheduling was skipped, enable
pg_cron in Extensions and rerun 017, or schedule this SQL every minute:

```sql
SELECT public.send_session_reminders();
```

Set the actual program date and start time through admin Program setup. Confirmed
active participants receive an in-app notification one hour before start and
another five minutes before start, using Asia/Kolkata. The notification links to
Events & Calendar. The bell count refreshes every 30 seconds and on window focus.
No email, browser push, or SMS is sent.

The job runs even if the member is not online; the notification is available at
their next visit. Minute scheduling and UI polling can delay visibility slightly.
Each enrollment/start-time/reminder combination is sent once. Disabled accounts,
inactive sessions, unconfirmed payments, and already-started sessions are excluded.
An enrollment made inside the reminder window gets the applicable upcoming reminder;
the one-hour reminder is not sent in the final five minutes. Rescheduled sessions
use the new start time. Existing notifications are retained as history.
