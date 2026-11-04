-- 019_org_foundation.sql
-- Apply after 017 (and 018_restore_api_grants). Multi-tenant foundation.
--
-- MODEL
-- -----
-- public.users.role stays the PLATFORM role (member/trainer/admin/super_admin)
-- and is still only changeable through set_user_role(). Organization roles are
-- a separate axis stored on organization_memberships.role, so this migration
-- does not touch users_role_check or guard_users_write().
--
--   FSP platform administrator -> users.role in ('admin','super_admin')
--   Organization owner         -> organization_memberships.role = 'owner'
--   Trainer                    -> organization_memberships.role = 'trainer'
--   Client stakeholder         -> organization_memberships.role = 'stakeholder'
--   Learner                    -> organization_memberships.role = 'learner'
--
-- ENTITY MAPPING (no duplicate entities)
-- -------------------------------------
--   User              -> public.users              (exists)
--   TrainingProgram   -> public.offerings          (exists; gains org_id)
--   LearnerEnrollment -> public.offering_enrollments (exists; gains org_id)
--   Notification      -> public.notifications      (exists)
--   AuditEvent        -> public.audit_events       (new, org-scoped; the older
--                        global public.audit_logs is left untouched)
--   Organization, OrganizationMembership, ClientOrganization, TrainerProfile
--                     -> new tables below
--   TrainingCohort, Assessment, AssessmentAttempt, LearningActivity
--                     -> deliberately NOT created in this pass.
--
-- SECURITY
-- --------
-- An org id arriving from the browser is treated as an identifier, never as a
-- claim. Every policy and RPC re-derives the caller's role from auth.uid(), so
-- substituting another organization's id in a URL or API call returns zero
-- rows / raises. Tables are read-only to the API (REVOKE ALL, then GRANT
-- SELECT); all writes go through SECURITY DEFINER RPCs, matching the
-- convention in 006 and 017.
--
-- Safe defaults: a new membership is 'invited' (not active) and the lowest
-- privilege role is 'learner'. trainer_profiles holds professional details
-- only -- no date of birth, government identifier or other sensitive learner
-- data is stored anywhere in this migration.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,47}[a-z0-9])?$'),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  kind text NOT NULL DEFAULT 'customer' CHECK (kind IN ('platform','customer')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id)
);
-- Exactly one platform organization (FSP itself).
CREATE UNIQUE INDEX IF NOT EXISTS organizations_single_platform_idx
  ON public.organizations((kind)) WHERE kind = 'platform';

CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'learner'
    CHECK (role IN ('owner','org_admin','trainer','stakeholder','learner')),
  status text NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited','active','suspended')),
  invited_by uuid REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);
CREATE INDEX IF NOT EXISTS organization_memberships_user_idx
  ON public.organization_memberships(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS organization_memberships_org_idx
  ON public.organization_memberships(org_id);

-- A tenant's own customers. Distinct from organizations: these are records
-- owned BY an organization, not tenants that can sign in.
CREATE TABLE IF NOT EXISTS public.client_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  contact_email text CHECK (contact_email IS NULL OR contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.users(id),
  UNIQUE (org_id, name)
);
CREATE INDEX IF NOT EXISTS client_organizations_org_idx ON public.client_organizations(org_id);

-- Professional profile for a trainer within one organization.
CREATE TABLE IF NOT EXISTS public.trainer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL UNIQUE
    REFERENCES public.organization_memberships(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  headline text CHECK (headline IS NULL OR char_length(headline) <= 160),
  bio text CHECK (bio IS NULL OR char_length(bio) <= 4000),
  specialisms text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS trainer_profiles_org_idx ON public.trainer_profiles(org_id);

-- Org-scoped, append-only audit trail for administrative actions.
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.users(id),
  action text NOT NULL CHECK (char_length(action) BETWEEN 3 AND 80),
  entity_type text CHECK (entity_type IS NULL OR char_length(entity_type) <= 60),
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_org_created_idx
  ON public.audit_events(org_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 2. Authorization helpers. STABLE so the planner can reuse them inside RLS.
--    Each one derives everything from auth.uid(); none accepts a role claim.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.current_app_role() IN ('admin','super_admin'), false);
$$;

-- The caller's role in one organization, or NULL when they are not an active
-- member of an active organization. Platform admins are NOT given an implicit
-- org role here: read access for them is granted explicitly in the policies,
-- so org-role checks stay honest.
CREATE OR REPLACE FUNCTION public.org_role(p_org_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.role
  FROM public.organization_memberships m
  JOIN public.organizations o ON o.id = m.org_id
  JOIN public.users u ON u.id = m.user_id
  WHERE m.org_id = p_org_id
    AND m.user_id = auth.uid()
    AND m.status = 'active'
    AND o.is_active
    AND u.is_active;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.org_role(p_org_id) IS NOT NULL;
$$;

-- COALESCE is load-bearing: org_role() is NULL for a foreign organization and
-- `NULL = ANY(...)` is NULL, so a caller writing `IF NOT has_org_role(...)`
-- would never take the branch and the check would silently pass.
CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id uuid, p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(public.org_role(p_org_id) = ANY(p_roles), false);
$$;

-- Owners and org_admins administer an organization.
CREATE OR REPLACE FUNCTION public.can_admin_org(p_org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_org_role(p_org_id, ARRAY['owner','org_admin']);
$$;

-- Every organization the caller actively belongs to. Used by RLS and by the
-- server DAL to resolve an active organization without trusting the client.
CREATE OR REPLACE FUNCTION public.my_org_ids()
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.org_id
  FROM public.organization_memberships m
  JOIN public.organizations o ON o.id = m.org_id
  JOIN public.users u ON u.id = m.user_id
  WHERE m.user_id = auth.uid()
    AND m.status = 'active'
    AND o.is_active
    AND u.is_active;
$$;

CREATE OR REPLACE FUNCTION public.platform_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.organizations WHERE kind = 'platform';
$$;

-- ---------------------------------------------------------------------------
-- 3. RLS. Read-only to the API; writes happen in the RPCs in section 5.
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_organizations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events           ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organizations_read ON public.organizations;
CREATE POLICY organizations_read ON public.organizations FOR SELECT TO authenticated
  USING (public.is_org_member(id) OR public.is_platform_admin());

-- A member sees their own membership row and, if they administer the org, all
-- of its memberships. They never see another organization's rows.
DROP POLICY IF EXISTS organization_memberships_read ON public.organization_memberships;
CREATE POLICY organization_memberships_read ON public.organization_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_admin_org(org_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS client_organizations_read ON public.client_organizations;
CREATE POLICY client_organizations_read ON public.client_organizations
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS trainer_profiles_read ON public.trainer_profiles;
CREATE POLICY trainer_profiles_read ON public.trainer_profiles
  FOR SELECT TO authenticated
  USING (public.is_org_member(org_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS audit_events_read ON public.audit_events;
CREATE POLICY audit_events_read ON public.audit_events FOR SELECT TO authenticated
  USING (public.can_admin_org(org_id) OR public.is_platform_admin());

REVOKE ALL ON public.organizations, public.organization_memberships,
  public.client_organizations, public.trainer_profiles, public.audit_events
  FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.organizations, public.organization_memberships,
  public.client_organizations, public.trainer_profiles, public.audit_events
  TO authenticated;

-- audit_events is append-only even for a privileged caller.
CREATE OR REPLACE FUNCTION public.guard_audit_events()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only' USING ERRCODE = '42501';
END $$;
DROP TRIGGER IF EXISTS audit_events_append_only ON public.audit_events;
CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE ON public.audit_events
  FOR EACH ROW EXECUTE FUNCTION public.guard_audit_events();

-- ---------------------------------------------------------------------------
-- 4. Internal audit writer.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._audit_event(
  p_org_id uuid, p_action text, p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_events(org_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (p_org_id, auth.uid(), p_action, p_entity_type, p_entity_id, COALESCE(p_metadata, '{}'::jsonb));
END $$;
REVOKE ALL ON FUNCTION public._audit_event(uuid,text,text,uuid,jsonb) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Mutations. Every one re-derives authority from auth.uid().
-- ---------------------------------------------------------------------------

-- Any signed-in active account may create an organization and becomes its
-- owner. The slug is normalised server-side.
CREATE OR REPLACE FUNCTION public.create_organization(p_name text, p_slug text DEFAULT NULL)
RETURNS public.organizations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org public.organizations; v_slug text;
BEGIN
  IF auth.uid() IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'Please sign in with an active account.' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Enter an organization name of at least 2 characters.' USING ERRCODE = '22023';
  END IF;

  v_slug := lower(regexp_replace(COALESCE(nullif(btrim(p_slug), ''), btrim(p_name)), '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := btrim(v_slug, '-');
  IF v_slug = '' THEN
    RAISE EXCEPTION 'Could not derive a URL slug from that name.' USING ERRCODE = '22023';
  END IF;
  v_slug := left(v_slug, 49);
  IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'That organization slug is already taken.' USING ERRCODE = '23505';
  END IF;

  -- kind is forced to 'customer': the platform organization is seeded, never
  -- created through the API.
  INSERT INTO public.organizations(slug, name, kind, created_by)
    VALUES (v_slug, btrim(p_name), 'customer', auth.uid())
    RETURNING * INTO v_org;

  INSERT INTO public.organization_memberships(org_id, user_id, role, status, invited_by)
    VALUES (v_org.id, auth.uid(), 'owner', 'active', auth.uid());

  PERFORM public._audit_event(v_org.id, 'organization.created', 'organizations', v_org.id,
    jsonb_build_object('slug', v_org.slug));
  RETURN v_org;
END $$;

-- Invite an existing platform account into an organization. Returns the
-- membership. Owners and org_admins only; nobody may grant 'owner'.
CREATE OR REPLACE FUNCTION public.add_organization_member(
  p_org_id uuid, p_email text, p_role text DEFAULT 'learner')
RETURNS public.organization_memberships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_row public.organization_memberships;
BEGIN
  IF NOT public.can_admin_org(p_org_id) THEN
    RAISE EXCEPTION 'Organization administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('org_admin','trainer','stakeholder','learner') THEN
    RAISE EXCEPTION 'Invalid organization role: %', p_role USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_user FROM public.users WHERE lower(email) = lower(btrim(p_email)) AND is_active;
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'No active account with that email address.' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM public.organization_memberships
              WHERE org_id = p_org_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'That account is already a member of this organization.' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.organization_memberships(org_id, user_id, role, status, invited_by)
    VALUES (p_org_id, v_user, p_role, 'invited', auth.uid())
    RETURNING * INTO v_row;

  PERFORM public._audit_event(p_org_id, 'membership.invited', 'organization_memberships', v_row.id,
    jsonb_build_object('role', p_role));
  RETURN v_row;
END $$;

-- The invited account accepts its own invitation. Nobody can activate a
-- membership on someone else's behalf.
CREATE OR REPLACE FUNCTION public.accept_organization_invite(p_org_id uuid)
RETURNS public.organization_memberships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.organization_memberships;
BEGIN
  UPDATE public.organization_memberships
     SET status = 'active', updated_at = now()
   WHERE org_id = p_org_id AND user_id = auth.uid() AND status = 'invited'
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending invitation for this organization.' USING ERRCODE = 'P0002';
  END IF;
  PERFORM public._audit_event(p_org_id, 'membership.accepted', 'organization_memberships', v_row.id, '{}'::jsonb);
  RETURN v_row;
END $$;

-- Owners change roles and suspend members. The last active owner is protected,
-- mirroring the last-super-admin rule in set_user_role().
CREATE OR REPLACE FUNCTION public.set_organization_member_role(
  p_membership_id uuid, p_role text, p_status text DEFAULT NULL)
RETURNS public.organization_memberships
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_old public.organization_memberships; v_row public.organization_memberships; v_status text;
BEGIN
  SELECT * INTO v_old FROM public.organization_memberships WHERE id = p_membership_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found.' USING ERRCODE = 'P0002';
  END IF;
  -- COALESCE for the same reason as in has_org_role(): a NULL role must read
  -- as "not an owner", not as unknown.
  IF COALESCE(public.org_role(v_old.org_id), '') <> 'owner' THEN
    RAISE EXCEPTION 'Only an organization owner can change membership roles.' USING ERRCODE = '42501';
  END IF;
  IF p_role NOT IN ('owner','org_admin','trainer','stakeholder','learner') THEN
    RAISE EXCEPTION 'Invalid organization role: %', p_role USING ERRCODE = '22023';
  END IF;
  v_status := COALESCE(p_status, v_old.status);
  IF v_status NOT IN ('invited','active','suspended') THEN
    RAISE EXCEPTION 'Invalid membership status: %', v_status USING ERRCODE = '22023';
  END IF;

  IF v_old.role = 'owner' AND v_old.status = 'active'
     AND (p_role <> 'owner' OR v_status <> 'active')
     AND (SELECT count(*) FROM public.organization_memberships
           WHERE org_id = v_old.org_id AND role = 'owner' AND status = 'active'
             AND id <> p_membership_id) = 0 THEN
    RAISE EXCEPTION 'Cannot remove the last active owner of this organization.' USING ERRCODE = '42501';
  END IF;

  UPDATE public.organization_memberships
     SET role = p_role, status = v_status, updated_at = now()
   WHERE id = p_membership_id RETURNING * INTO v_row;

  PERFORM public._audit_event(v_old.org_id, 'membership.role_changed',
    'organization_memberships', v_row.id,
    jsonb_build_object('from_role', v_old.role, 'to_role', p_role,
                       'from_status', v_old.status, 'to_status', v_status));
  RETURN v_row;
END $$;

-- Organization settings. Only name is editable; slug and kind are immutable.
CREATE OR REPLACE FUNCTION public.update_organization_settings(p_org_id uuid, p_values jsonb)
RETURNS public.organizations LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_org public.organizations; v_name text;
BEGIN
  IF NOT public.can_admin_org(p_org_id) THEN
    RAISE EXCEPTION 'Organization administrator access required.' USING ERRCODE = '42501';
  END IF;
  v_name := btrim(COALESCE(p_values->>'name', ''));
  IF char_length(v_name) < 2 OR char_length(v_name) > 120 THEN
    RAISE EXCEPTION 'Organization name must be 2 to 120 characters.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.organizations SET name = v_name, updated_at = now()
   WHERE id = p_org_id RETURNING * INTO v_org;

  PERFORM public._audit_event(p_org_id, 'organization.settings_updated', 'organizations', p_org_id,
    jsonb_build_object('name', v_name));
  RETURN v_org;
END $$;

-- Client organizations: owners and org_admins manage; trainers and
-- stakeholders read through RLS.
CREATE OR REPLACE FUNCTION public.upsert_client_organization(
  p_org_id uuid, p_name text, p_contact_email text DEFAULT NULL,
  p_notes text DEFAULT NULL, p_client_id uuid DEFAULT NULL)
RETURNS public.client_organizations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.client_organizations;
BEGIN
  IF NOT public.can_admin_org(p_org_id) THEN
    RAISE EXCEPTION 'Organization administrator access required.' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) < 2 THEN
    RAISE EXCEPTION 'Enter a client name of at least 2 characters.' USING ERRCODE = '22023';
  END IF;

  IF p_client_id IS NULL THEN
    INSERT INTO public.client_organizations(org_id, name, contact_email, notes, created_by)
      VALUES (p_org_id, btrim(p_name), nullif(btrim(p_contact_email), ''), nullif(btrim(p_notes), ''), auth.uid())
      RETURNING * INTO v_row;
    PERFORM public._audit_event(p_org_id, 'client.created', 'client_organizations', v_row.id, '{}'::jsonb);
  ELSE
    -- org_id is part of the predicate, so a client id from another tenant
    -- simply does not match.
    UPDATE public.client_organizations
       SET name = btrim(p_name), contact_email = nullif(btrim(p_contact_email), ''),
           notes = nullif(btrim(p_notes), ''), updated_at = now()
     WHERE id = p_client_id AND org_id = p_org_id
    RETURNING * INTO v_row;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Client not found in this organization.' USING ERRCODE = 'P0002';
    END IF;
    PERFORM public._audit_event(p_org_id, 'client.updated', 'client_organizations', v_row.id, '{}'::jsonb);
  END IF;
  RETURN v_row;
END $$;

-- A trainer maintains their own profile; an org admin may maintain any
-- trainer's profile in their own organization.
CREATE OR REPLACE FUNCTION public.upsert_trainer_profile(
  p_membership_id uuid, p_headline text DEFAULT NULL,
  p_bio text DEFAULT NULL, p_specialisms text[] DEFAULT '{}')
RETURNS public.trainer_profiles
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_m public.organization_memberships; v_row public.trainer_profiles;
BEGIN
  SELECT * INTO v_m FROM public.organization_memberships WHERE id = p_membership_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Membership not found.' USING ERRCODE = 'P0002';
  END IF;
  -- auth.uid() is NULL without a session, so the equality must be coalesced or
  -- `IF NOT (...)` evaluates to NULL and skips the guard.
  IF NOT COALESCE(v_m.user_id = auth.uid(), false)
     AND NOT public.can_admin_org(v_m.org_id) THEN
    RAISE EXCEPTION 'You cannot edit that trainer profile.' USING ERRCODE = '42501';
  END IF;
  IF v_m.role <> 'trainer' THEN
    RAISE EXCEPTION 'Only trainer memberships have a trainer profile.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.trainer_profiles(membership_id, org_id, headline, bio, specialisms)
    VALUES (p_membership_id, v_m.org_id, nullif(btrim(p_headline), ''),
            nullif(btrim(p_bio), ''), COALESCE(p_specialisms, '{}'))
  ON CONFLICT (membership_id) DO UPDATE
    SET headline = EXCLUDED.headline, bio = EXCLUDED.bio,
        specialisms = EXCLUDED.specialisms, updated_at = now()
  RETURNING * INTO v_row;

  PERFORM public._audit_event(v_m.org_id, 'trainer_profile.saved', 'trainer_profiles', v_row.id, '{}'::jsonb);
  RETURN v_row;
END $$;

REVOKE ALL ON FUNCTION
  public.create_organization(text,text),
  public.add_organization_member(uuid,text,text),
  public.accept_organization_invite(uuid),
  public.set_organization_member_role(uuid,text,text),
  public.update_organization_settings(uuid,jsonb),
  public.upsert_client_organization(uuid,text,text,text,uuid),
  public.upsert_trainer_profile(uuid,text,text,text[])
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION
  public.create_organization(text,text),
  public.add_organization_member(uuid,text,text),
  public.accept_organization_invite(uuid),
  public.set_organization_member_role(uuid,text,text),
  public.update_organization_settings(uuid,jsonb),
  public.upsert_client_organization(uuid,text,text,text,uuid),
  public.upsert_trainer_profile(uuid,text,text,text[])
  TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_platform_admin(), public.org_role(uuid),
  public.is_org_member(uuid), public.has_org_role(uuid,text[]),
  public.can_admin_org(uuid), public.my_org_ids(), public.platform_org_id()
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Seed the platform organization, then adopt existing domain rows into it.
--    org_id is nullable so the existing single-tenant portal keeps working
--    while call sites are migrated in the next pass.
-- ---------------------------------------------------------------------------

INSERT INTO public.organizations(slug, name, kind)
VALUES ('fsp', 'Facilitator Support Program', 'platform')
ON CONFLICT (slug) DO NOTHING;

DO $backfill$
DECLARE
  v_org uuid;
  v_table text;
  v_tables text[] := ARRAY[
    'members','memberships','membership_applications','member_documents',
    'member_updates','offerings','offering_enrollments','events'
  ];
BEGIN
  SELECT id INTO v_org FROM public.organizations WHERE kind = 'platform';

  FOREACH v_table IN ARRAY v_tables LOOP
    IF to_regclass('public.' || v_table) IS NULL THEN
      RAISE NOTICE 'SKIP %: table not present on this database.', v_table;
      CONTINUE;
    END IF;
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id)', v_table);
    -- The guard_* triggers only fire for is_api_caller(), so a migration-time
    -- backfill does not trip them.
    EXECUTE format('UPDATE public.%I SET org_id = $1 WHERE org_id IS NULL', v_table) USING v_org;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN org_id SET DEFAULT public.platform_org_id()', v_table);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(org_id)', v_table || '_org_idx', v_table);
  END LOOP;
END $backfill$;

-- Give every existing active account a membership in the platform
-- organization so the current portal keeps resolving an active org.
-- Platform admins become owners; trainers stay trainers; everyone else is a
-- learner (least privilege).
INSERT INTO public.organization_memberships(org_id, user_id, role, status)
SELECT public.platform_org_id(), u.id,
       CASE WHEN u.role IN ('admin','super_admin') THEN 'owner'
            WHEN u.role = 'trainer' THEN 'trainer'
            ELSE 'learner' END,
       'active'
FROM public.users u
WHERE u.is_active
ON CONFLICT (org_id, user_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;
