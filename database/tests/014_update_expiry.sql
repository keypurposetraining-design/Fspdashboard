BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES ('14000000-0000-0000-0000-000000000001','expiry-admin@example.invalid','admin',true);
INSERT INTO public.member_updates(id,title,message,program_date,program_time,created_by)
VALUES('14000000-0000-0000-0000-000000000011','Past program','Past',CURRENT_DATE-3,'19:00','14000000-0000-0000-0000-000000000001'),
('14000000-0000-0000-0000-000000000012','Future program','Future','2099-12-01','19:00','14000000-0000-0000-0000-000000000001'),
('14000000-0000-0000-0000-000000000013','Undated program','No expiry',NULL,NULL,'14000000-0000-0000-0000-000000000001');
DO $$ BEGIN
  IF (SELECT expires_at FROM public.member_updates WHERE id='14000000-0000-0000-0000-000000000012') <> '2099-12-01 18:30:00+00'::timestamptz THEN RAISE EXCEPTION 'Expiry is not next midnight India time'; END IF;
END $$;
SELECT public.expire_member_updates();
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM public.member_updates WHERE id='14000000-0000-0000-0000-000000000011') THEN RAISE EXCEPTION 'Expired program not deleted'; END IF;
  IF (SELECT count(*) FROM public.member_updates WHERE id IN ('14000000-0000-0000-0000-000000000012','14000000-0000-0000-0000-000000000013')) <> 2 THEN RAISE EXCEPTION 'Future/undated programs deleted'; END IF;
END $$;
ROLLBACK;
