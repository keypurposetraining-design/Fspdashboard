-- Run as database owner after migration 020. No persistent changes.
BEGIN;
DO $$
BEGIN
  IF has_function_privilege('anon','public.admin_membership_users()','EXECUTE')
     OR has_function_privilege('anon','public.admin_membership_history(uuid)','EXECUTE')
     OR has_function_privilege('anon','public.admin_save_membership(uuid,uuid,date,text,text,boolean)','EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous callers must not execute membership management functions';
  END IF;
  IF NOT has_function_privilege('authenticated','public.admin_membership_users()','EXECUTE') THEN
    RAISE EXCEPTION 'Authenticated callers require execute privilege';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{}', true);
SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.admin_membership_users();
    RAISE EXCEPTION 'Listing allowed an unauthorized caller';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.admin_membership_history('00000000-0000-0000-0000-000000000000');
    RAISE EXCEPTION 'History allowed an unauthorized caller';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.admin_save_membership('00000000-0000-0000-0000-000000000000',null,CURRENT_DATE,'active','test',false);
    RAISE EXCEPTION 'Save allowed an unauthorized caller';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
