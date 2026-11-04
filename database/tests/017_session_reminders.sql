BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES('17000000-0000-0000-0000-000000000001','reminders@example.invalid','member',true);
INSERT INTO public.members(id,user_id) VALUES('17000000-0000-0000-0000-000000000011','17000000-0000-0000-0000-000000000001');
INSERT INTO public.offerings(id,code,title,description,kind,duration,price,start_date,program_time,mode)
SELECT v.id::uuid,v.code,v.code,'Test reminder','program','1 Hour',0,
  ((now()+make_interval(mins=>v.minutes)) AT TIME ZONE 'Asia/Kolkata')::date,
  ((now()+make_interval(mins=>v.minutes)) AT TIME ZONE 'Asia/Kolkata')::time,'online'
FROM(VALUES
('17000000-0000-0000-0000-000000000021','TEST-HOUR',60),
('17000000-0000-0000-0000-000000000022','TEST-FIVE',5),
('17000000-0000-0000-0000-000000000023','TEST-PAST',-5),
('17000000-0000-0000-0000-000000000024','TEST-FUTURE',61),
('17000000-0000-0000-0000-000000000025','TEST-UNPAID',60)
)v(id,code,minutes);
INSERT INTO public.offering_enrollments(offering_id,member_id,amount,status)
SELECT id,'17000000-0000-0000-0000-000000000011',0,CASE WHEN code='TEST-UNPAID' THEN 'pending_payment' ELSE 'active' END
FROM public.offerings WHERE code IN('TEST-HOUR','TEST-FIVE','TEST-PAST','TEST-FUTURE','TEST-UNPAID');
DO $$ DECLARE sent integer; BEGIN
  sent:=public.send_session_reminders();
  IF sent<>2 THEN RAISE EXCEPTION 'Expected exactly hour and five-minute reminders, got %',sent; END IF;
  IF public.send_session_reminders()<>0 THEN RAISE EXCEPTION 'Repeat job duplicated reminders'; END IF;
  IF (SELECT count(*) FROM public.notifications WHERE user_id='17000000-0000-0000-0000-000000000001')<>2 THEN RAISE EXCEPTION 'Notification count incorrect'; END IF;
  IF has_function_privilege('authenticated','public.send_session_reminders()','EXECUTE') THEN RAISE EXCEPTION 'Clients can trigger reminder broadcasts'; END IF;
END $$;
ROLLBACK;
