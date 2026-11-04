-- ==============================================================================
-- 004_member_workflow.sql  —  additive schema for the member workflow
-- ==============================================================================
-- Adds: extended member profile fields + human-readable member number,
-- membership applications, member documents (private bucket), avatars bucket,
-- 'suspended' membership status, membership_type.
--
-- Requires 001 and 002. Idempotent. No existing rows are deleted; existing
-- members receive a member_number (FSP-000001 …) in creation order.
-- ==============================================================================

-- Enum additions must be committed before use, so they run outside the txn.
ALTER TYPE public.membership_status ADD VALUE IF NOT EXISTS 'suspended';

DO $$ BEGIN
  CREATE TYPE public.application_status AS ENUM
    ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.document_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Member profile fields + member number
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.member_number_seq START 1;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS member_number TEXT,
  ADD COLUMN IF NOT EXISTS city          TEXT,
  ADD COLUMN IF NOT EXISTS state         TEXT,
  ADD COLUMN IF NOT EXISTS postal_code   TEXT,
  ADD COLUMN IF NOT EXISTS country       TEXT,
  ADD COLUMN IF NOT EXISTS occupation    TEXT,
  ADD COLUMN IF NOT EXISTS organization  TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url    TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'members_profile_lengths') THEN
    ALTER TABLE public.members ADD CONSTRAINT members_profile_lengths CHECK (
      char_length(COALESCE(city, ''))         <= 100 AND
      char_length(COALESCE(state, ''))        <= 100 AND
      char_length(COALESCE(postal_code, ''))  <= 12  AND
      char_length(COALESCE(country, ''))      <= 100 AND
      char_length(COALESCE(occupation, ''))   <= 150 AND
      char_length(COALESCE(organization, '')) <= 150 AND
      char_length(COALESCE(avatar_url, ''))   <= 500 AND
      char_length(COALESCE(address, ''))      <= 500
    ) NOT VALID;
  END IF;
END $$;

-- Backfill numbers for existing members in creation order.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.members WHERE member_number IS NULL ORDER BY created_at, id LOOP
    UPDATE public.members
       SET member_number = 'FSP-' || lpad(nextval('public.member_number_seq')::text, 6, '0')
     WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.members
  ALTER COLUMN member_number SET DEFAULT ('FSP-' || lpad(nextval('public.member_number_seq')::text, 6, '0'));
CREATE UNIQUE INDEX IF NOT EXISTS members_member_number_key ON public.members (member_number);

-- member_number joins the protected columns (no API caller may change it).
CREATE OR REPLACE FUNCTION public.guard_members_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF public.is_api_caller()
     AND (NEW.id IS DISTINCT FROM OLD.id
          OR NEW.user_id IS DISTINCT FROM OLD.user_id
          OR NEW.member_number IS DISTINCT FROM OLD.member_number
          OR NEW.created_at IS DISTINCT FROM OLD.created_at
          OR NEW.created_by IS DISTINCT FROM OLD.created_by) THEN
    RAISE EXCEPTION 'members.id, user_id, member_number and audit columns cannot be changed'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Memberships: type
-- ---------------------------------------------------------------------------
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'standard';

-- ---------------------------------------------------------------------------
-- 3. Membership applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_applications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id        UUID NOT NULL REFERENCES public.members(id),
  status           public.application_status NOT NULL DEFAULT 'draft',
  membership_type  TEXT NOT NULL DEFAULT 'standard',
  motivation       TEXT CHECK (char_length(motivation) <= 4000),
  experience       TEXT CHECK (char_length(experience) <= 4000),
  referral_source  TEXT CHECK (char_length(referral_source) <= 200),
  submitted_at     TIMESTAMPTZ,
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID REFERENCES public.users(id),
  decision_reason  TEXT CHECK (char_length(decision_reason) <= 2000),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- At most one open (not yet decided) application per member.
CREATE UNIQUE INDEX IF NOT EXISTS membership_applications_one_open
  ON public.membership_applications (member_id)
  WHERE status NOT IN ('approved', 'rejected');
CREATE INDEX IF NOT EXISTS idx_membership_applications_status
  ON public.membership_applications (status, submitted_at);

-- Members edit only their own draft / changes-requested content. Status and
-- review columns change only through the submit/review RPCs (005).
CREATE OR REPLACE FUNCTION public.guard_applications_write()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT public.is_api_caller() THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' OR NEW.submitted_at IS NOT NULL OR NEW.reviewed_at IS NOT NULL
       OR NEW.reviewed_by IS NOT NULL OR NEW.decision_reason IS NOT NULL THEN
      RAISE EXCEPTION 'Applications are created as drafts' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.member_id IS DISTINCT FROM OLD.member_id
  OR NEW.status IS DISTINCT FROM OLD.status
  OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
  OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
  OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
  OR NEW.decision_reason IS DISTINCT FROM OLD.decision_reason
  OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Application status can only change through submit/review actions'
      USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS guard_applications_write ON public.membership_applications;
CREATE TRIGGER guard_applications_write
  BEFORE INSERT OR UPDATE ON public.membership_applications
  FOR EACH ROW EXECUTE FUNCTION public.guard_applications_write();

ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own applications, admins read all" ON public.membership_applications;
CREATE POLICY "Members read own applications, admins read all" ON public.membership_applications
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Members create own draft application" ON public.membership_applications;
CREATE POLICY "Members create own draft application" ON public.membership_applications
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Members edit own open application" ON public.membership_applications;
CREATE POLICY "Members edit own open application" ON public.membership_applications
  FOR UPDATE
  USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    AND status IN ('draft', 'changes_requested')
  )
  WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4. Member documents (private storage)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.member_documents (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id             UUID NOT NULL REFERENCES public.members(id),
  application_id        UUID REFERENCES public.membership_applications(id),
  document_type         TEXT NOT NULL CHECK (document_type IN
                          ('identity_proof', 'address_proof', 'photograph', 'qualification', 'other')),
  file_name             TEXT NOT NULL CHECK (char_length(file_name) <= 255),
  storage_path          TEXT NOT NULL UNIQUE,
  mime_type             TEXT,
  size_bytes            BIGINT CHECK (size_bytes > 0 AND size_bytes <= 10485760),
  status                public.document_status NOT NULL DEFAULT 'pending',
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES public.users(id),
  rejection_reason      TEXT CHECK (char_length(rejection_reason) <= 2000),
  replaces_document_id  UUID REFERENCES public.member_documents(id)
);

CREATE INDEX IF NOT EXISTS idx_member_documents_member ON public.member_documents (member_id, document_type);
CREATE INDEX IF NOT EXISTS idx_member_documents_status ON public.member_documents (status, uploaded_at);

ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own documents, admins read all" ON public.member_documents;
CREATE POLICY "Members read own documents, admins read all" ON public.member_documents
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- Members may only register a pending, unreviewed document stored in their own folder.
-- No UPDATE/DELETE policies: review happens through review_document() (005).
DROP POLICY IF EXISTS "Members upload own documents" ON public.member_documents;
CREATE POLICY "Members upload own documents" ON public.member_documents
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
    AND status = 'pending'
    AND reviewed_at IS NULL AND reviewed_by IS NULL AND rejection_reason IS NULL
    AND storage_path LIKE auth.uid()::text || '/%'
  );

-- Storage: private bucket, 10 MB, documents and images only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('member-documents', 'member-documents', false, 10485760,
        ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = false, file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "member-documents: upload own folder" ON storage.objects;
CREATE POLICY "member-documents: upload own folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'member-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "member-documents: read own folder or admin" ON storage.objects;
CREATE POLICY "member-documents: read own folder or admin" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'member-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- Avatars: public-read profile photos, 2 MB images, each user writes only their folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = true, file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "avatars: write own folder" ON storage.objects;
CREATE POLICY "avatars: write own folder" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS "avatars: update own folder" ON storage.objects;
CREATE POLICY "avatars: update own folder" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
DROP POLICY IF EXISTS "avatars: delete own folder" ON storage.objects;
CREATE POLICY "avatars: delete own folder" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMIT;
