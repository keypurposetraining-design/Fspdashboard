-- Apply after 007. Allow editable profile fields while retaining RLS.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = to_regclass('public.members') AND relrowsecurity)
     OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = to_regclass('public.users') AND relrowsecurity) THEN
    RAISE EXCEPTION 'Apply the base schema and security migrations before enabling profile edits.';
  END IF;
END;
$$;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.members, public.users TO authenticated;
GRANT UPDATE (first_name,last_name,phone,address,city,state,postal_code,country,
              occupation,organization,avatar_url,updated_at)
  ON public.members TO authenticated;
GRANT UPDATE (name) ON public.users TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
