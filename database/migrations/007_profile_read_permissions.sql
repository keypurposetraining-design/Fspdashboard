-- Restore explicit API privileges for profile/session/notification reads.
-- Policies still decide which rows each signed-in account may access.
BEGIN;
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','members','memberships','notifications'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = table_name AND c.relrowsecurity
    ) THEN
      RAISE EXCEPTION 'Missing table or RLS protection: public.%. Apply the base schema and security migrations first.', table_name;
    END IF;
  END LOOP;
END;
$$;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users, public.members, public.memberships, public.notifications TO authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

-- Refresh PostgREST's schema metadata after changing privileges.
NOTIFY pgrst, 'reload schema';
COMMIT;
