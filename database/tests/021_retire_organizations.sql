-- Run as database owner after migration 021. Read-only assertions.
BEGIN;
DO $checks$
DECLARE
  table_name text;
  signature text;
  caller text;
  target_function regprocedure;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['organizations','organization_memberships','client_organizations','trainer_profiles','audit_events'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN CONTINUE; END IF;
    FOREACH caller IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
      IF has_table_privilege(caller, format('public.%I', table_name), 'SELECT,INSERT,UPDATE,DELETE') THEN
        RAISE EXCEPTION 'Retired table % remains accessible to %', table_name, caller;
      END IF;
    END LOOP;
  END LOOP;
  FOREACH signature IN ARRAY ARRAY[
    'public.create_organization(text,text)', 'public.add_organization_member(uuid,text,text)',
    'public.accept_organization_invite(uuid)', 'public.set_organization_member_role(uuid,text,text)',
    'public.update_organization_settings(uuid,jsonb)', 'public.upsert_client_organization(uuid,text,text,text,uuid)',
    'public.upsert_trainer_profile(uuid,text,text,text[])', 'public.org_role(uuid)',
    'public.is_org_member(uuid)', 'public.has_org_role(uuid,text[])', 'public.can_admin_org(uuid)', 'public.my_org_ids()'
  ] LOOP
    target_function := to_regprocedure(signature);
    IF target_function IS NULL THEN CONTINUE; END IF;
    FOREACH caller IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
      IF has_function_privilege(caller, target_function, 'EXECUTE') THEN
        RAISE EXCEPTION 'Retired function % remains callable by %', signature, caller;
      END IF;
    END LOOP;
  END LOOP;
  target_function := to_regprocedure('public.platform_org_id()');
  IF target_function IS NOT NULL AND NOT has_function_privilege('authenticated', target_function, 'EXECUTE') THEN
    RAISE EXCEPTION 'Core row defaults still require platform_org_id()';
  END IF;
END $checks$;
ROLLBACK;
