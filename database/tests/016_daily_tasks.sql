BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES
('16000000-0000-0000-0000-000000000001','daily-one@example.invalid','member',true),
('16000000-0000-0000-0000-000000000002','daily-two@example.invalid','member',true);
INSERT INTO public.members(id,user_id) VALUES
('16000000-0000-0000-0000-000000000011','16000000-0000-0000-0000-000000000001'),
('16000000-0000-0000-0000-000000000012','16000000-0000-0000-0000-000000000002');
INSERT INTO public.offering_enrollments(id,offering_id,member_id,amount,status)
SELECT '16000000-0000-0000-0000-000000000021',id,'16000000-0000-0000-0000-000000000011',12000,'active' FROM public.offerings WHERE code='FSP-30DC';
INSERT INTO public.offering_enrollments(id,offering_id,member_id,amount,status)
SELECT '16000000-0000-0000-0000-000000000022',id,'16000000-0000-0000-0000-000000000012',12000,'pending_payment' FROM public.offerings WHERE code='FSP-30DC';
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','16000000-0000-0000-0000-000000000001',true);
DO $$ DECLARE first_task uuid; second_task uuid; result jsonb; denied boolean; t record; BEGIN
  IF (SELECT count(*) FROM public.offering_daily_tasks)<>30 THEN RAISE EXCEPTION 'Thirty tasks not available'; END IF;
  SELECT id INTO first_task FROM public.offering_daily_tasks WHERE day_number=1;
  SELECT id INTO second_task FROM public.offering_daily_tasks WHERE day_number=2;
  denied:=false;
  BEGIN PERFORM public.complete_daily_task('16000000-0000-0000-0000-000000000021',second_task);
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Complete the current day before moving to the next task.' THEN RAISE; END IF; denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Day skipping accepted'; END IF;
  PERFORM public.complete_daily_task('16000000-0000-0000-0000-000000000021',first_task);
  result:=public.complete_daily_task('16000000-0000-0000-0000-000000000021',first_task);
  IF (result->>'completed')::int<>1 THEN RAISE EXCEPTION 'Duplicate Done increased progress'; END IF;
  denied:=false;
  BEGIN INSERT INTO public.offering_task_completions(enrollment_id,task_id) VALUES('16000000-0000-0000-0000-000000000021',second_task);
  EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Member can insert progress directly'; END IF;
  FOR t IN SELECT id FROM public.offering_daily_tasks WHERE day_number>1 ORDER BY day_number LOOP
    result:=public.complete_daily_task('16000000-0000-0000-0000-000000000021',t.id);
  END LOOP;
  IF (result->>'completed')::int<>30 THEN RAISE EXCEPTION 'Challenge did not complete at day thirty'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','16000000-0000-0000-0000-000000000002',true);
DO $$ DECLARE denied boolean:=false; v_task uuid; BEGIN
  IF EXISTS(SELECT 1 FROM public.offering_task_completions) THEN RAISE EXCEPTION 'Another member progress exposed'; END IF;
  IF EXISTS(SELECT 1 FROM public.offering_daily_tasks) THEN RAISE EXCEPTION 'Unpaid enrollment unlocked daily tasks'; END IF;
  SELECT id INTO v_task FROM public.offering_daily_tasks LIMIT 1;
  BEGIN PERFORM public.complete_daily_task('16000000-0000-0000-0000-000000000021',v_task);
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'An active course enrollment is required.' THEN RAISE; END IF; denied:=true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Another member completed a task'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
