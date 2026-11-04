-- Admin announcements, flyers, and in-app notifications to all active members.
BEGIN;
CREATE TABLE IF NOT EXISTS public.member_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 150),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  program_date date,
  location text CHECK (char_length(location) <= 200),
  flyer_path text,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.member_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS updates_read ON public.member_updates;
CREATE POLICY updates_read ON public.member_updates FOR SELECT TO authenticated USING (
  public.is_admin() OR (is_published AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active))
);
REVOKE ALL ON public.member_updates FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.member_updates TO authenticated;

-- Dashboard overview also reads these workflow tables. Keep their RLS enabled.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = to_regclass('public.membership_applications') AND relrowsecurity)
     OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = to_regclass('public.member_documents') AND relrowsecurity) THEN
    RAISE EXCEPTION 'Apply migration 004 before migration 010.';
  END IF;
END $$;
GRANT SELECT ON public.membership_applications,public.member_documents TO authenticated;

CREATE OR REPLACE FUNCTION public.publish_member_update(p_title text,p_message text,p_program_date date DEFAULT NULL,p_location text DEFAULT NULL,p_flyer_path text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required.'; END IF;
  IF nullif(btrim(p_title),'') IS NULL OR nullif(btrim(p_message),'') IS NULL THEN RAISE EXCEPTION 'Title and message are required.'; END IF;
  IF p_flyer_path IS NOT NULL AND (p_flyer_path NOT LIKE auth.uid()::text || '/%'
    OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'program-flyers' AND name = p_flyer_path)) THEN
    RAISE EXCEPTION 'Upload a valid program flyer.';
  END IF;
  INSERT INTO public.member_updates(title,message,program_date,location,flyer_path,created_by)
    VALUES(btrim(p_title),btrim(p_message),p_program_date,nullif(btrim(p_location),''),p_flyer_path,auth.uid()) RETURNING id INTO v_id;
  INSERT INTO public.notifications(user_id,type,payload,created_by)
    SELECT id,'info',jsonb_build_object('title',btrim(p_title),'message',left(btrim(p_message),300),'category','system','link','/dashboard'),auth.uid()
    FROM public.users WHERE is_active AND role IN ('member','trainer');
  PERFORM public._audit('member update published','member_updates',v_id,jsonb_build_object('title',p_title));
  RETURN v_id;
END $$;
CREATE OR REPLACE FUNCTION public.archive_member_update(p_update_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required.'; END IF;
  UPDATE public.member_updates SET is_published = false WHERE id = p_update_id AND is_published;
  IF NOT FOUND THEN RAISE EXCEPTION 'Update is already archived or missing.'; END IF;
  PERFORM public._audit('member update archived','member_updates',p_update_id,'{}'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.publish_member_update(text,text,date,text,text),public.archive_member_update(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.publish_member_update(text,text,date,text,text),public.archive_member_update(uuid) TO authenticated;

DO $storage$ BEGIN
  BEGIN
    INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
      VALUES('program-flyers','program-flyers',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
      ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
    EXECUTE 'DROP POLICY IF EXISTS "program flyers upload" ON storage.objects';
    EXECUTE $p$CREATE POLICY "program flyers upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
      bucket_id = 'program-flyers' AND public.is_admin() AND (storage.foldername(name))[1] = auth.uid()::text
    )$p$;
    EXECUTE 'DROP POLICY IF EXISTS "program flyers read" ON storage.objects';
    EXECUTE $p$CREATE POLICY "program flyers read" ON storage.objects FOR SELECT TO authenticated USING (
      bucket_id = 'program-flyers' AND (public.is_admin() OR EXISTS (
        SELECT 1 FROM public.member_updates WHERE flyer_path = name AND is_published
      ))
    )$p$;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Configure private program-flyers bucket (5 MB JPG/PNG/WebP) and upload/read policies in Storage Dashboard using expressions in migration 010.';
  END;
END $storage$;
NOTIFY pgrst,'reload schema';
COMMIT;
