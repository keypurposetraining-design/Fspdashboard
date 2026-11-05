-- Run as database owner in the Supabase SQL editor.
-- Restore the existing anonymous failed-login logging contract without
-- allowing anonymous reads or changes to existing activity records.
BEGIN;

ALTER TABLE public.member_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous failed login logs" ON public.member_activity_logs;
CREATE POLICY "Allow anonymous failed login logs"
  ON public.member_activity_logs
  FOR INSERT TO anon
  WITH CHECK (
    action = 'AUTH_LOGIN_FAILED'
    AND user_id IS NULL
    AND member_id IS NULL
  );

GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.member_activity_logs TO anon;

NOTIFY pgrst, 'reload schema';
COMMIT;
