BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES
('12000000-0000-0000-0000-000000000001','program-admin@example.invalid','admin',true),
('12000000-0000-0000-0000-000000000002','program-member@example.invalid','member',true),
('12000000-0000-0000-0000-000000000003','program-owner@example.invalid','super_admin',true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE denied boolean := false; BEGIN
  BEGIN PERFORM public.save_program('12000000-0000-0000-0000-000000000011','{}');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Administrator access required.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Member could create programs'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000001',true);
INSERT INTO storage.objects(bucket_id,name) VALUES ('program-flyers','12000000-0000-0000-0000-000000000001/program.png');
SELECT public.save_program('12000000-0000-0000-0000-000000000011',jsonb_build_object(
  'title','New program','description','Program content','kind','program','duration','2 Days',
  'price',15000,'is_active',true,'start_date','2026-12-01','end_date','2026-12-02',
  'flyer_path','12000000-0000-0000-0000-000000000001/program.png'));
DO $$ BEGIN
  IF (SELECT count(*) FROM public.member_updates WHERE offering_id='12000000-0000-0000-0000-000000000011') <> 1 THEN RAISE EXCEPTION 'Dashboard program post not created'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000003',true);
SELECT public.save_program('12000000-0000-0000-0000-000000000011',jsonb_build_object(
  'title','Updated program','description','Updated content','kind','program','duration','2 Days',
  'price',20000,'is_active',true,'start_date','2026-12-01','end_date','2026-12-02',
  'flyer_path','12000000-0000-0000-0000-000000000001/program.png'));
SELECT set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000002',true);
DO $$ BEGIN
  IF (SELECT count(*) FROM public.member_updates WHERE offering_id='12000000-0000-0000-0000-000000000011') <> 1 THEN RAISE EXCEPTION 'Editing duplicated dashboard posts'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.member_updates WHERE offering_id='12000000-0000-0000-0000-000000000011' AND title='Updated program' AND message='Updated content') THEN RAISE EXCEPTION 'Members cannot see updated program'; END IF;
  IF (SELECT count(*) FROM public.notifications WHERE user_id=auth.uid()) <> 2 THEN RAISE EXCEPTION 'Create/update notifications missing'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000003',true);
DO $$ DECLARE values_json jsonb; BEGIN
  SELECT jsonb_build_object('title',title,'description',description,'kind',kind,'duration',duration,'price',price,'is_active',is_active,
    'start_date',start_date,'end_date',end_date,'flyer_path',flyer_path,'format',format) INTO values_json FROM public.offerings WHERE id='12000000-0000-0000-0000-000000000011';
  PERFORM public.save_program('12000000-0000-0000-0000-000000000011',values_json);
  IF (SELECT count(*) FROM public.notifications WHERE user_id='12000000-0000-0000-0000-000000000002') <> 2 THEN RAISE EXCEPTION 'Unchanged save sent notifications'; END IF;
  PERFORM public.save_program('12000000-0000-0000-0000-000000000011',values_json || '{"is_active":false}'::jsonb);
END $$;
SELECT set_config('request.jwt.claim.sub','12000000-0000-0000-0000-000000000002',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.member_updates WHERE offering_id='12000000-0000-0000-0000-000000000011') THEN RAISE EXCEPTION 'Disabled program remains on dashboard'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
