BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES ('15000000-0000-0000-0000-000000000001','dashboard-member@example.invalid','member',true);
INSERT INTO public.users(id,email,role,is_active) VALUES ('15000000-0000-0000-0000-000000000002','dashboard-admin@example.invalid','admin',true);
INSERT INTO public.members(id,user_id) VALUES ('15000000-0000-0000-0000-000000000011','15000000-0000-0000-0000-000000000001');
INSERT INTO public.offerings(id,code,title,description,kind,duration,price,start_date,registration_open,mode,program_time,program_end_time) VALUES
('15000000-0000-0000-0000-000000000021','TEST-PAST','Past program','Past','program','1 Day',0,(now() AT TIME ZONE 'Asia/Kolkata')::date-1,true,'online','10:00','11:00'),
('15000000-0000-0000-0000-000000000022','TEST-CLOSED','Closed program','Closed','program','1 Day',0,(now() AT TIME ZONE 'Asia/Kolkata')::date+1,false,'offline','10:00','11:00'),
('15000000-0000-0000-0000-000000000023','TEST-FUTURE','Future program','Future','program','1 Day',0,(now() AT TIME ZONE 'Asia/Kolkata')::date+1,true,'online','10:00','11:00');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','15000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE v_id uuid; denied boolean; first_row public.offering_enrollments; second_row public.offering_enrollments; BEGIN
  FOREACH v_id IN ARRAY ARRAY['15000000-0000-0000-0000-000000000021'::uuid,'15000000-0000-0000-0000-000000000022'::uuid] LOOP
    denied:=false;
    BEGIN PERFORM public.enroll_offering(v_id);
    EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Registration is closed for this program.' THEN RAISE; END IF; denied:=true; END;
    IF NOT denied THEN RAISE EXCEPTION 'Past/closed program accepted registration'; END IF;
  END LOOP;
  first_row:=public.enroll_offering('15000000-0000-0000-0000-000000000023');
  second_row:=public.enroll_offering('15000000-0000-0000-0000-000000000023');
  IF first_row.status <> 'active' OR first_row.id<>second_row.id THEN RAISE EXCEPTION 'Future registration or deduplication failed'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','15000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE v_post uuid; v_program public.offerings; BEGIN
  v_post:=public.publish_member_update('Scheduled announcement','Program details',(now() AT TIME ZONE 'Asia/Kolkata')::date+1,'Zoom',NULL,'19:00');
  SELECT o.* INTO v_program FROM public.offerings o JOIN public.member_updates u ON u.offering_id=o.id WHERE u.id=v_post;
  IF v_program.id IS NULL OR v_program.registration_open OR v_program.mode<>'online' OR v_program.program_time<>'19:00'::time THEN
    RAISE EXCEPTION 'Dated announcement was not linked safely to a scheduled program';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
