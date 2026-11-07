-- Run as database owner in the production Supabase SQL editor.
-- The server account-creation API uses the service role for profile writes
-- and compensating rollback. RLS bypass does not replace SQL table grants.
BEGIN;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['users', 'members', 'memberships', 'audit_logs'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = target AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'Missing table or RLS protection: public.%', target;
    END IF;
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users, public.members, public.memberships TO service_role;
GRANT INSERT ON public.audit_logs TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
