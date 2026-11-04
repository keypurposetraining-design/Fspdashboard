BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES
('10000000-0000-0000-0000-000000000001','update-member@example.invalid','member',true),
('10000000-0000-0000-0000-000000000002','update-admin@example.invalid','admin',true),
('10000000-0000-0000-0000-000000000003','update-disabled@example.invalid','member',false);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE denied boolean := false; BEGIN
  BEGIN PERFORM public.publish_member_update('Forbidden','Member cannot publish');
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Administrator access required.' THEN RAISE; END IF;
    denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Member published an announcement'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE v_id uuid; BEGIN
  INSERT INTO storage.objects(bucket_id,name) VALUES ('program-flyers',auth.uid()::text || '/flyer.png');
  v_id := public.publish_member_update('Upcoming TTX','Join our upcoming experience.',CURRENT_DATE,'Chennai',auth.uid()::text || '/flyer.png');
  PERFORM set_config('update_test.id',v_id::text,true);
  IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = '10000000-0000-0000-0000-000000000001') THEN RAISE EXCEPTION 'Active member not notified'; END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE user_id = '10000000-0000-0000-0000-000000000003') THEN RAISE EXCEPTION 'Disabled member notified'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.member_updates WHERE id = current_setting('update_test.id')::uuid) THEN RAISE EXCEPTION 'Member cannot read update'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'program-flyers') THEN RAISE EXCEPTION 'Member cannot read published flyer'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
SELECT public.archive_member_update(current_setting('update_test.id')::uuid);
SELECT set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.member_updates WHERE id = current_setting('update_test.id')::uuid) THEN RAISE EXCEPTION 'Member can see archived update'; END IF;
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'program-flyers') THEN RAISE EXCEPTION 'Archived flyer remains accessible'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
