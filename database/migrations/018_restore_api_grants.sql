-- 018_restore_api_grants.sql
-- Apply LAST, after every other migration (001-017).
-- Read-safe and idempotent: re-running it changes nothing.
--
-- WHY THIS EXISTS
-- ---------------
-- This project's public schema was rebuilt with `DROP SCHEMA public CASCADE`.
-- That also drops the ALTER DEFAULT PRIVILEGES entries Supabase attaches to
-- the schema, which are what normally grant anon/authenticated/service_role
-- access to every new table. Without them, a table is reachable only if some
-- migration GRANTed it by hand.
--
-- Migrations 006, 007, 009 and 010 grant 9 tables between them. Every other
-- table in the schema has no API privilege at all, so PostgREST answers
--   401 / 42501  "permission denied for table <name>"
-- even where the row-level policy would have allowed the read. In the client
-- this surfaces as an empty error object (see src/lib/data/errors.ts), which
-- is why the failures are hard to read.
--
-- This migration restores the default privileges so later migrations behave
-- normally again, and grants the tables that already exist.
--
-- SECURITY NOTE
-- -------------
-- Table privileges are deliberately coarse here, exactly as on a stock
-- Supabase project: RLS stays the security boundary. Every table in this
-- schema has RLS enabled and RLS denies by default, so an operation with no
-- matching policy remains denied even when the privilege is granted. The
-- tighter, column-level models that 006 and 010 define for their own tables
-- are re-applied at the end, so this migration cannot loosen them.

BEGIN;

-- Refuse to run if anything in public lacks RLS: granting DML on an
-- unprotected table would expose every row to any signed-in account.
DO $$
DECLARE
  v_unprotected text;
BEGIN
  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO v_unprotected
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;

  IF v_unprotected IS NOT NULL THEN
    RAISE EXCEPTION
      'Refusing to grant API access: RLS is disabled on public.%. Apply the base schema and security migrations first.',
      v_unprotected;
  END IF;
END;
$$;

-- 1) Schema access for the API roles.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2) Restore the default privileges the schema drop removed, so tables created
--    by future migrations are reachable without another hand-written grant.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;

-- 3) Grant the tables that already exist. RLS still decides which rows.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

-- 4) Anonymous stays closed except the one documented case: the sign-in page
--    records failed attempts before a session exists. The policy
--    "Allow anonymous failed login logs" constrains what may be written.
GRANT INSERT ON public.member_activity_logs TO anon;

-- 5) Re-apply 006's stricter model so step 3 cannot have widened it:
--    members read the catalog and their own enrollments; only the RPCs write.
REVOKE ALL ON public.offerings, public.offering_enrollments, public.enrollment_payment_settings
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.offerings, public.offering_enrollments, public.enrollment_payment_settings
  TO authenticated;
GRANT UPDATE (price, is_active) ON public.offerings TO authenticated;
GRANT UPDATE (instructions) ON public.enrollment_payment_settings TO authenticated;

-- 6) Re-apply 010's stricter model for announcements (read-only; the RPCs write).
DO $$
BEGIN
  IF to_regclass('public.member_updates') IS NOT NULL THEN
    REVOKE ALL ON public.member_updates FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.member_updates TO authenticated;
  END IF;
END;
$$;

-- 7) Re-apply 009's column-level profile edits (step 3 granted whole-table
--    UPDATE; narrow it back to the editable fields only).
REVOKE UPDATE ON public.members FROM authenticated;
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (first_name, last_name, phone, address, city, state, postal_code, country,
              occupation, organization, avatar_url, updated_at)
  ON public.members TO authenticated;
GRANT UPDATE (name) ON public.users TO authenticated;

-- 8) Re-apply the org foundation's read-only model (019). These tables are
--    written only through SECURITY DEFINER RPCs, so step 3 must not leave DML
--    on them. Guarded so 018 still applies on a database without 019.
DO $$
DECLARE
  v_table text;
  v_tables text[] := ARRAY['organizations','organization_memberships',
                           'client_organizations','trainer_profiles','audit_events'];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_table) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', v_table);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v_table);
    END IF;
  END LOOP;
END;
$$;

-- 9) Tell PostgREST to pick up the new privileges immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
