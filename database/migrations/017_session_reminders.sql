-- Apply after 016. In-app reminders for confirmed session participants.
BEGIN;
CREATE TABLE IF NOT EXISTS public.session_reminder_deliveries (
  enrollment_id uuid NOT NULL REFERENCES public.offering_enrollments(id),
  scheduled_start timestamptz NOT NULL,
  minutes_before integer NOT NULL CHECK(minutes_before IN (60,5)),
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(enrollment_id,scheduled_start,minutes_before)
);
ALTER TABLE public.session_reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_reminder_deliveries FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.send_session_reminders()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_row record; v_count integer:=0;
BEGIN
  FOR v_row IN
    WITH due AS (
      SELECT e.id enrollment_id,m.user_id,o.title,
        (o.start_date+o.program_time) AT TIME ZONE 'Asia/Kolkata' scheduled_start,
        reminder.minutes_before
      FROM public.offering_enrollments e
      JOIN public.members m ON m.id=e.member_id
      JOIN public.users u ON u.id=m.user_id
      JOIN public.offerings o ON o.id=e.offering_id
      CROSS JOIN (VALUES(60),(5)) reminder(minutes_before)
      WHERE e.status='active' AND u.is_active AND o.is_active
        AND o.kind='program' AND o.start_date IS NOT NULL AND o.program_time IS NOT NULL
    ), inserted AS (
      INSERT INTO public.session_reminder_deliveries(enrollment_id,scheduled_start,minutes_before)
      SELECT enrollment_id,scheduled_start,minutes_before FROM due
      WHERE now()>=scheduled_start-make_interval(mins=>minutes_before)
        AND now()<scheduled_start
        -- The hour reminder stops being useful once the five-minute window begins.
        AND (minutes_before=5 OR now()<scheduled_start-interval '5 minutes')
      ON CONFLICT DO NOTHING RETURNING enrollment_id,scheduled_start,minutes_before
    )
    SELECT d.* FROM due d JOIN inserted i USING(enrollment_id,scheduled_start,minutes_before)
  LOOP
    INSERT INTO public.notifications(user_id,type,payload)
      VALUES(v_row.user_id,'info',jsonb_build_object(
        'title',CASE WHEN v_row.minutes_before=60 THEN 'Session reminder: 1 hour' ELSE 'Session reminder: 5 minutes' END,
        'message',v_row.title || ' starts at ' || to_char(v_row.scheduled_start AT TIME ZONE 'Asia/Kolkata','FMHH12:MI AM') || ' IST.',
        'category','system','link','/events'));
    v_count:=v_count+1;
  END LOOP;
  RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION public.send_session_reminders() FROM PUBLIC,anon,authenticated;
DO $schedule$ BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
    PERFORM cron.schedule('fsp-session-reminders','* * * * *','SELECT public.send_session_reminders()');
  EXCEPTION WHEN insufficient_privilege OR undefined_file OR feature_not_supported THEN
    RAISE NOTICE 'Enable pg_cron and schedule fsp-session-reminders every minute: SELECT public.send_session_reminders().';
  END;
END $schedule$;
COMMIT;
