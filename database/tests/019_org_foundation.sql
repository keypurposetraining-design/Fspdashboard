-- Run only on a development database after migrations 001-019.
-- All fixture rows are rolled back. Sequence counters may advance.
--
-- Covers: authentication gating, organization role enforcement, and
-- cross-organization data isolation (an id from another tenant must not grant
-- access, whether it arrives through a query or an RPC argument).
BEGIN;

-- Fixtures: two unrelated organizations plus a platform admin.
--   org A: owner A1, trainer A2, learner A3, invited A4
--   org B: owner B1
INSERT INTO public.users(id,email,name,role,is_active) VALUES
('19000000-0000-0000-0000-000000000001','org-a-owner@example.invalid','A Owner','member',true),
('19000000-0000-0000-0000-000000000002','org-a-trainer@example.invalid','A Trainer','trainer',true),
('19000000-0000-0000-0000-000000000003','org-a-learner@example.invalid','A Learner','member',true),
('19000000-0000-0000-0000-000000000004','org-a-invited@example.invalid','A Invited','member',true),
('19000000-0000-0000-0000-000000000005','org-b-owner@example.invalid','B Owner','member',true),
('19000000-0000-0000-0000-000000000006','platform-admin@example.invalid','Platform','super_admin',true),
('19000000-0000-0000-0000-000000000007','disabled@example.invalid','Disabled','member',false);

INSERT INTO public.organizations(id,slug,name,kind) VALUES
('19000000-0000-0000-0000-0000000000a1','test-org-a','Test Org A','customer'),
('19000000-0000-0000-0000-0000000000b1','test-org-b','Test Org B','customer');

INSERT INTO public.organization_memberships(id,org_id,user_id,role,status) VALUES
('19000000-0000-0000-0000-0000000000d1','19000000-0000-0000-0000-0000000000a1','19000000-0000-0000-0000-000000000001','owner','active'),
('19000000-0000-0000-0000-0000000000d2','19000000-0000-0000-0000-0000000000a1','19000000-0000-0000-0000-000000000002','trainer','active'),
('19000000-0000-0000-0000-0000000000d3','19000000-0000-0000-0000-0000000000a1','19000000-0000-0000-0000-000000000003','learner','active'),
('19000000-0000-0000-0000-0000000000d4','19000000-0000-0000-0000-0000000000a1','19000000-0000-0000-0000-000000000004','learner','invited'),
('19000000-0000-0000-0000-0000000000d5','19000000-0000-0000-0000-0000000000b1','19000000-0000-0000-0000-000000000005','owner','active');

INSERT INTO public.client_organizations(id,org_id,name) VALUES
('19000000-0000-0000-0000-0000000000c1','19000000-0000-0000-0000-0000000000a1','Client of A'),
('19000000-0000-0000-0000-0000000000c2','19000000-0000-0000-0000-0000000000b1','Client of B');

INSERT INTO public.audit_events(org_id,actor_id,action) VALUES
('19000000-0000-0000-0000-0000000000a1','19000000-0000-0000-0000-000000000001','test.seed.a'),
('19000000-0000-0000-0000-0000000000b1','19000000-0000-0000-0000-000000000005','test.seed.b');

-- ===========================================================================
-- 1. Unauthenticated access is denied (no JWT subject at all).
-- ===========================================================================
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.organizations) THEN
    RAISE EXCEPTION 'Anonymous session can read organizations';
  END IF;
  IF public.org_role('19000000-0000-0000-0000-0000000000a1') IS NOT NULL THEN
    RAISE EXCEPTION 'org_role resolved without a session';
  END IF;
END $$;

-- ===========================================================================
-- 2. Cross-organization isolation for reads. Org A's owner must see only A.
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id='19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Owner cannot read own organization';
  END IF;
  -- Reading org B by its primary key is the URL-tampering case.
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id='19000000-0000-0000-0000-0000000000b1') THEN
    RAISE EXCEPTION 'Owner of A can read organization B';
  END IF;
  IF EXISTS (SELECT 1 FROM public.client_organizations WHERE id='19000000-0000-0000-0000-0000000000c2') THEN
    RAISE EXCEPTION 'Owner of A can read a client of B';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organization_memberships WHERE org_id='19000000-0000-0000-0000-0000000000b1') THEN
    RAISE EXCEPTION 'Owner of A can read memberships of B';
  END IF;
  IF EXISTS (SELECT 1 FROM public.audit_events WHERE org_id='19000000-0000-0000-0000-0000000000b1') THEN
    RAISE EXCEPTION 'Owner of A can read audit events of B';
  END IF;
  IF public.is_org_member('19000000-0000-0000-0000-0000000000b1') THEN
    RAISE EXCEPTION 'is_org_member true for a foreign organization';
  END IF;
  IF (SELECT count(*) FROM public.my_org_ids()) <> 1 THEN
    RAISE EXCEPTION 'my_org_ids leaked organizations';
  END IF;
END $$;

-- ===========================================================================
-- 3. Cross-organization isolation for writes. A forged org id in an RPC
--    argument must raise, not act.
-- ===========================================================================
DO $$ DECLARE denied boolean := false; BEGIN
  BEGIN PERFORM public.add_organization_member(
      '19000000-0000-0000-0000-0000000000b1','org-a-learner@example.invalid','learner');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Owner of A added a member to organization B'; END IF;

  denied := false;
  BEGIN PERFORM public.update_organization_settings(
      '19000000-0000-0000-0000-0000000000b1', '{"name":"Hijacked"}'::jsonb);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Owner of A renamed organization B'; END IF;

  denied := false;
  BEGIN PERFORM public.set_organization_member_role(
      '19000000-0000-0000-0000-0000000000d5','learner');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Owner of A demoted the owner of B'; END IF;

  -- Updating B's client while passing A's org id must match nothing.
  denied := false;
  BEGIN PERFORM public.upsert_client_organization(
      '19000000-0000-0000-0000-0000000000a1','Renamed',NULL,NULL,
      '19000000-0000-0000-0000-0000000000c2');
  EXCEPTION WHEN no_data_found OR raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Client of B edited through org A'; END IF;
  IF EXISTS (SELECT 1 FROM public.client_organizations
              WHERE id='19000000-0000-0000-0000-0000000000c2' AND name='Renamed') THEN
    RAISE EXCEPTION 'Client of B was modified across tenants';
  END IF;
END $$;

-- ===========================================================================
-- 4. Role enforcement inside one organization.
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000003',true);
DO $$ DECLARE denied boolean := false; BEGIN
  IF public.can_admin_org('19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Learner reported as organization administrator';
  END IF;
  BEGIN PERFORM public.add_organization_member(
      '19000000-0000-0000-0000-0000000000a1','org-b-owner@example.invalid','learner');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Learner invited a member'; END IF;

  -- A learner must not see other members of their own organization either.
  IF EXISTS (SELECT 1 FROM public.organization_memberships
              WHERE org_id='19000000-0000-0000-0000-0000000000a1'
                AND user_id <> '19000000-0000-0000-0000-000000000003') THEN
    RAISE EXCEPTION 'Learner can read other memberships';
  END IF;
  -- ...but does see their own, and the organization itself.
  IF NOT EXISTS (SELECT 1 FROM public.organization_memberships
                  WHERE user_id='19000000-0000-0000-0000-000000000003') THEN
    RAISE EXCEPTION 'Learner cannot read own membership';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.organizations
                  WHERE id='19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Learner cannot read own organization';
  END IF;
  -- Audit events are administrative.
  IF EXISTS (SELECT 1 FROM public.audit_events) THEN
    RAISE EXCEPTION 'Learner can read audit events';
  END IF;
END $$;

-- A trainer may edit only their own profile.
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE denied boolean := false; BEGIN
  PERFORM public.upsert_trainer_profile('19000000-0000-0000-0000-0000000000d2','Facilitation lead');
  IF NOT EXISTS (SELECT 1 FROM public.trainer_profiles
                  WHERE membership_id='19000000-0000-0000-0000-0000000000d2') THEN
    RAISE EXCEPTION 'Trainer could not save own profile';
  END IF;
  BEGIN PERFORM public.upsert_trainer_profile('19000000-0000-0000-0000-0000000000d5','Hijack');
  EXCEPTION WHEN insufficient_privilege OR raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Trainer edited a profile in another organization'; END IF;
END $$;

-- ===========================================================================
-- 5. Invitations: only the invitee activates, and an invited membership has
--    no access until accepted (safe default).
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000004',true);
DO $$ DECLARE denied boolean := false; BEGIN
  IF public.is_org_member('19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Invited (not accepted) membership already grants access';
  END IF;
  PERFORM public.accept_organization_invite('19000000-0000-0000-0000-0000000000a1');
  IF NOT public.is_org_member('19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Accepting an invitation did not grant access';
  END IF;
  BEGIN PERFORM public.accept_organization_invite('19000000-0000-0000-0000-0000000000b1');
  EXCEPTION WHEN no_data_found OR raise_exception THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Accepted an invitation that was never issued'; END IF;
END $$;

-- ===========================================================================
-- 6. The last active owner is protected.
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE denied boolean := false; BEGIN
  BEGIN PERFORM public.set_organization_member_role('19000000-0000-0000-0000-0000000000d1','learner');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Demoted the last active owner'; END IF;
  -- With a second owner present the demotion is allowed.
  PERFORM public.set_organization_member_role('19000000-0000-0000-0000-0000000000d2','owner');
  PERFORM public.set_organization_member_role('19000000-0000-0000-0000-0000000000d1','learner');
  IF (SELECT role FROM public.organization_memberships
       WHERE id='19000000-0000-0000-0000-0000000000d1') <> 'learner' THEN
    RAISE EXCEPTION 'Owner demotion did not apply';
  END IF;
END $$;

-- ===========================================================================
-- 7. A suspended membership loses access immediately.
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000002',true);
DO $$ BEGIN
  PERFORM public.set_organization_member_role('19000000-0000-0000-0000-0000000000d3','learner','suspended');
END $$;
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000003',true);
DO $$ BEGIN
  IF public.is_org_member('19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Suspended membership still grants access';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id='19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Suspended member can still read the organization';
  END IF;
END $$;

-- A deactivated platform account loses org access even while active in the org.
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000007',true);
DO $$ BEGIN
  IF public.is_org_member(public.platform_org_id()) THEN
    RAISE EXCEPTION 'Disabled account resolved an organization role';
  END IF;
END $$;

-- ===========================================================================
-- 8. Platform administrators read across tenants but hold no org role.
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000006',true);
DO $$ BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'super_admin is not a platform admin';
  END IF;
  IF (SELECT count(*) FROM public.organizations
       WHERE id IN ('19000000-0000-0000-0000-0000000000a1','19000000-0000-0000-0000-0000000000b1')) <> 2 THEN
    RAISE EXCEPTION 'Platform admin cannot read every organization';
  END IF;
  -- Oversight is read-only: org mutations still require an org role.
  IF public.can_admin_org('19000000-0000-0000-0000-0000000000a1') THEN
    RAISE EXCEPTION 'Platform admin granted an implicit organization role';
  END IF;
END $$;

-- ===========================================================================
-- 9. Audit events are written by the RPCs and are append-only.
-- ===========================================================================
SELECT set_config('request.jwt.claim.sub','19000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE v_before bigint; v_after bigint; denied boolean := false; BEGIN
  SELECT count(*) INTO v_before FROM public.audit_events
    WHERE org_id='19000000-0000-0000-0000-0000000000a1';
  PERFORM public.update_organization_settings(
    '19000000-0000-0000-0000-0000000000a1', '{"name":"Test Org A renamed"}'::jsonb);
  SELECT count(*) INTO v_after FROM public.audit_events
    WHERE org_id='19000000-0000-0000-0000-0000000000a1';
  IF v_after <= v_before THEN
    RAISE EXCEPTION 'Administrative action wrote no audit event';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audit_events
                  WHERE org_id='19000000-0000-0000-0000-0000000000a1'
                    AND action='organization.settings_updated'
                    AND actor_id='19000000-0000-0000-0000-000000000002') THEN
    RAISE EXCEPTION 'Audit event did not record the acting user';
  END IF;
END $$;
RESET ROLE;
DO $$ DECLARE denied boolean := false; BEGIN
  BEGIN UPDATE public.audit_events SET action='tampered'
         WHERE org_id='19000000-0000-0000-0000-0000000000a1';
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'audit_events accepted an UPDATE'; END IF;
  denied := false;
  BEGIN DELETE FROM public.audit_events WHERE org_id='19000000-0000-0000-0000-0000000000a1';
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'audit_events accepted a DELETE'; END IF;
END $$;

-- ===========================================================================
-- 10. Grant surface: the API may only read these tables, and anon may not
--     call any organization RPC.
-- ===========================================================================
DO $$
DECLARE t text; f text;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations','organization_memberships',
                           'client_organizations','trainer_profiles','audit_events'] LOOP
    IF has_table_privilege('anon','public.'||t,'SELECT') THEN
      RAISE EXCEPTION 'anon can read public.%', t;
    END IF;
    IF has_table_privilege('authenticated','public.'||t,'INSERT')
       OR has_table_privilege('authenticated','public.'||t,'UPDATE')
       OR has_table_privilege('authenticated','public.'||t,'DELETE') THEN
      RAISE EXCEPTION 'authenticated can write public.% directly', t;
    END IF;
  END LOOP;

  FOREACH f IN ARRAY ARRAY[
    'public.create_organization(text,text)',
    'public.add_organization_member(uuid,text,text)',
    'public.accept_organization_invite(uuid)',
    'public.set_organization_member_role(uuid,text,text)',
    'public.update_organization_settings(uuid,jsonb)',
    'public.upsert_client_organization(uuid,text,text,text,uuid)',
    'public.upsert_trainer_profile(uuid,text,text,text[])'] LOOP
    IF has_function_privilege('anon', f, 'EXECUTE') THEN
      RAISE EXCEPTION 'anon can execute %', f;
    END IF;
  END LOOP;

  -- The platform organization must exist and be unique.
  IF (SELECT count(*) FROM public.organizations WHERE kind='platform') <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one platform organization';
  END IF;
END $$;

ROLLBACK;
