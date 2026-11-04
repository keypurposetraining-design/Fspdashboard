-- Retire the organization feature after 020. Idempotent; skips absent objects.
-- Existing records and foreign keys are retained. Core account, membership,
-- program and payment permissions are unchanged.
BEGIN;

DO $retire$
DECLARE
  target_table text;
  signature text;
  target_function regprocedure;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'organizations', 'organization_memberships', 'client_organizations',
    'trainer_profiles', 'audit_events'
  ] LOOP
    IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated, service_role', target_table);
    END IF;
  END LOOP;

  FOREACH signature IN ARRAY ARRAY[
    'public.create_organization(text,text)',
    'public.add_organization_member(uuid,text,text)',
    'public.accept_organization_invite(uuid)',
    'public.set_organization_member_role(uuid,text,text)',
    'public.update_organization_settings(uuid,jsonb)',
    'public.upsert_client_organization(uuid,text,text,text,uuid)',
    'public.upsert_trainer_profile(uuid,text,text,text[])',
    'public.org_role(uuid)',
    'public.is_org_member(uuid)',
    'public.has_org_role(uuid,text[])',
    'public.can_admin_org(uuid)',
    'public.my_org_ids()'
  ] LOOP
    target_function := to_regprocedure(signature);
    IF target_function IS NOT NULL THEN
      EXECUTE format('REVOKE ALL PRIVILEGES ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role', target_function);
    END IF;
  END LOOP;
END $retire$;

-- Keep platform_org_id(): migration 019 installed it as a default on core
-- tables. Its SECURITY DEFINER lookup must remain available for normal inserts.
-- Do not drop these tables or use CASCADE: existing domain records refer to them.
NOTIFY pgrst, 'reload schema';
COMMIT;
