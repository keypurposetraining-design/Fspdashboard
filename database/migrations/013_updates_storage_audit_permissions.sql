-- Repair update feed, flyer storage, and Activity Log read access after 010–012.
BEGIN;
DO $$ BEGIN
  IF to_regclass('public.member_updates') IS NULL THEN
    RAISE EXCEPTION 'Run 010_member_updates.sql first, followed by 011 and 012, then re-run 013.';
  END IF;
END $$;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS audit_management_read ON public.audit_logs;
CREATE POLICY audit_management_read ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.audit_logs,public.member_updates TO authenticated;

DO $storage$ BEGIN
  BEGIN
    INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    VALUES('program-flyers','program-flyers',false,5242880,ARRAY['image/jpeg','image/png','image/webp'])
    ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=5242880,allowed_mime_types=EXCLUDED.allowed_mime_types;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Create program-flyers in Dashboard Storage: private, maximum 5 MB, JPEG/PNG/WebP.';
  END;
  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "program flyers upload" ON storage.objects';
    EXECUTE $p$CREATE POLICY "program flyers upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
      bucket_id='program-flyers' AND public.is_admin() AND (storage.foldername(name))[1]=auth.uid()::text
    )$p$;
    EXECUTE 'DROP POLICY IF EXISTS "program flyers read" ON storage.objects';
    EXECUTE $p$CREATE POLICY "program flyers read" ON storage.objects FOR SELECT TO authenticated USING (
      bucket_id='program-flyers' AND (public.is_admin() OR EXISTS (
        SELECT 1 FROM public.member_updates WHERE flyer_path=name AND is_published
      ))
    )$p$;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Add INSERT and SELECT program-flyers policies through Dashboard Storage Policies, using the expressions in this migration.';
  END;
END $storage$;
NOTIFY pgrst,'reload schema';
COMMIT;
