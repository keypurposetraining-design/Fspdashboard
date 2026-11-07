-- Restore authenticated activity logging without bypassing existing RLS.
-- Run as database owner after the base schema and migrations 001-022.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'member_activity_logs' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'member_activity_logs must exist with RLS enabled';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.member_activity_logs TO authenticated;

NOTIFY pgrst, 'reload schema';
COMMIT;
