-- Apply after 014. Persistent scheduled-program fields and registration checks.
BEGIN;
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS program_end_time time;
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS mode text CHECK (mode IN ('online','offline'));
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS registration_open boolean NOT NULL DEFAULT true;
ALTER TABLE public.member_updates ADD COLUMN IF NOT EXISTS program_end_time time;
ALTER TABLE public.member_updates ADD COLUMN IF NOT EXISTS mode text;
UPDATE public.offerings SET mode=CASE
  WHEN lower(coalesce(format,'')) LIKE '%zoom%' THEN 'online'
  WHEN lower(coalesce(format,'')) LIKE '%online%' AND lower(format) NOT LIKE '%person%' THEN 'online'
  WHEN lower(coalesce(format,'')) LIKE '%residential%' OR lower(coalesce(format,''))='offline' THEN 'offline'
  ELSE NULL END WHERE mode IS NULL;
CREATE OR REPLACE FUNCTION public.save_program(p_offering_id uuid,p_values jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_existing public.offerings%ROWTYPE; v_flyer text;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required.'; END IF;
  IF p_offering_id IS NULL OR p_values IS NULL THEN RAISE EXCEPTION 'Program details are required.'; END IF;
  SELECT * INTO v_existing FROM public.offerings WHERE id=p_offering_id FOR UPDATE;
  v_flyer := nullif(p_values->>'flyer_path','');
  IF v_flyer IS NOT NULL AND (
    (v_flyer IS DISTINCT FROM v_existing.flyer_path AND v_flyer NOT LIKE auth.uid()::text || '/%')
    OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='program-flyers' AND name=v_flyer)
  ) THEN RAISE EXCEPTION 'Upload a valid program flyer.'; END IF;
  IF v_existing.id IS NULL THEN
    INSERT INTO public.offerings(id,code,title,description,kind,duration,format,price,is_active,start_date,end_date,flyer_path,sort_order,program_time,program_end_time,mode,registration_open)
    VALUES(p_offering_id,'FSP-' || upper(replace(p_offering_id::text,'-','')),btrim(p_values->>'title'),btrim(p_values->>'description'),
      p_values->>'kind',btrim(p_values->>'duration'),nullif(btrim(p_values->>'format'),''),(p_values->>'price')::numeric,
      coalesce((p_values->>'is_active')::boolean,true),nullif(p_values->>'start_date','')::date,nullif(p_values->>'end_date','')::date,v_flyer,100,nullif(p_values->>'program_time','')::time,nullif(p_values->>'program_end_time','')::time,nullif(p_values->>'mode',''),coalesce((p_values->>'registration_open')::boolean,true));
    PERFORM public._audit('program created','offerings',p_offering_id,jsonb_build_object('title',p_values->>'title'));
  ELSE
    UPDATE public.offerings SET title=btrim(p_values->>'title'),description=btrim(p_values->>'description'),
      duration=btrim(p_values->>'duration'),format=nullif(btrim(p_values->>'format'),''),price=(p_values->>'price')::numeric,
      is_active=coalesce((p_values->>'is_active')::boolean,true),start_date=nullif(p_values->>'start_date','')::date,
      end_date=nullif(p_values->>'end_date','')::date,program_time=nullif(p_values->>'program_time','')::time,program_end_time=nullif(p_values->>'program_end_time','')::time,mode=nullif(p_values->>'mode',''),registration_open=coalesce((p_values->>'registration_open')::boolean,true),flyer_path=v_flyer WHERE id=p_offering_id;
  END IF;
  RETURN p_offering_id;
END $$;
CREATE OR REPLACE FUNCTION public.sync_program_dashboard_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post uuid;
BEGIN
  IF TG_OP='UPDATE' AND to_jsonb(OLD)=to_jsonb(NEW) THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RETURN NEW; END IF;
  INSERT INTO public.member_updates(offering_id,title,message,program_date,location,flyer_path,is_published,created_by,program_time,program_end_date,program_end_time,mode)
    VALUES(NEW.id,NEW.title,NEW.description,NEW.start_date,NEW.format,NEW.flyer_path,NEW.is_active,auth.uid(),NEW.program_time,NEW.end_date,NEW.program_end_time,NEW.mode)
    ON CONFLICT(offering_id) WHERE offering_id IS NOT NULL DO UPDATE SET
      program_end_time=EXCLUDED.program_end_time,mode=EXCLUDED.mode,program_end_date=EXCLUDED.program_end_date,program_time=EXCLUDED.program_time,title=EXCLUDED.title,message=EXCLUDED.message,program_date=EXCLUDED.program_date,location=EXCLUDED.location,
      flyer_path=EXCLUDED.flyer_path,is_published=EXCLUDED.is_published,created_by=EXCLUDED.created_by,created_at=now()
    RETURNING id INTO v_post;
  IF NEW.is_active THEN
    INSERT INTO public.notifications(user_id,type,payload,created_by)
      SELECT id,'info',jsonb_build_object('title',CASE WHEN TG_OP='INSERT' THEN 'New program: ' ELSE 'Program updated: ' END || NEW.title,
        'message',left(NEW.description,300),'category','system','link','/dashboard'),auth.uid()
      FROM public.users WHERE is_active AND role IN ('member','trainer');
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.enroll_offering(p_offering_id uuid)
RETURNS public.offering_enrollments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_member uuid;
  v_offer public.offerings%ROWTYPE;
  v_result public.offering_enrollments%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND is_active) THEN
    RAISE EXCEPTION 'Please sign in with an active account.';
  END IF;
  SELECT id INTO v_member FROM public.members WHERE user_id = auth.uid();
  IF v_member IS NULL THEN RAISE EXCEPTION 'Complete your member profile before enrolling.'; END IF;
  SELECT * INTO v_offer FROM public.offerings WHERE id = p_offering_id AND is_active FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'This course or program is no longer available.'; END IF;
  SELECT * INTO v_result FROM public.offering_enrollments WHERE offering_id=p_offering_id AND member_id=v_member;
  IF FOUND THEN RETURN v_result; END IF;
  IF NOT v_offer.registration_open OR v_offer.start_date < (now() AT TIME ZONE 'Asia/Kolkata')::date
     OR (v_offer.start_date = (now() AT TIME ZONE 'Asia/Kolkata')::date AND v_offer.program_end_time IS NOT NULL
       AND v_offer.program_end_time <= (now() AT TIME ZONE 'Asia/Kolkata')::time) THEN
    RAISE EXCEPTION 'Registration is closed for this program.';
  END IF;
  INSERT INTO public.offering_enrollments(offering_id, member_id, amount, currency, status)
    VALUES (v_offer.id, v_member, v_offer.price, v_offer.currency,
            CASE WHEN v_offer.price = 0 THEN 'active' ELSE 'pending_payment' END)
    ON CONFLICT (member_id, offering_id) DO NOTHING RETURNING * INTO v_result;
  IF v_result.id IS NULL THEN
    SELECT * INTO v_result FROM public.offering_enrollments WHERE offering_id = p_offering_id AND member_id = v_member;
  ELSE
    PERFORM public._audit('offering enrolled', 'offering_enrollments', v_result.id,
      jsonb_build_object('offering_id', v_offer.id, 'amount', v_offer.price));
    PERFORM public._notify(auth.uid(), 'info', 'Enrollment saved',
      v_offer.title || CASE WHEN v_offer.price = 0 THEN ': registration confirmed.' ELSE ': payment is pending.' END,
      'system', '/courses');
  END IF;
  RETURN v_result;
END;
$$;
CREATE OR REPLACE FUNCTION public.publish_member_update(p_title text,p_message text,p_program_date date DEFAULT NULL,p_location text DEFAULT NULL,p_flyer_path text DEFAULT NULL,p_program_time time DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_offering uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required.'; END IF;
  IF nullif(btrim(p_title),'') IS NULL OR nullif(btrim(p_message),'') IS NULL THEN RAISE EXCEPTION 'Title and message are required.'; END IF;
  IF p_flyer_path IS NOT NULL AND (p_flyer_path NOT LIKE auth.uid()::text || '/%'
    OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'program-flyers' AND name = p_flyer_path)) THEN
    RAISE EXCEPTION 'Upload a valid program flyer.';
  END IF;
  IF p_program_date IS NOT NULL THEN
    v_offering:=gen_random_uuid();
    PERFORM public.save_program(v_offering,jsonb_build_object(
      'title',p_title,'description',p_message,'kind','program','duration','Scheduled program',
      'format',p_location,'price',0,'is_active',true,'start_date',p_program_date,
      'program_time',p_program_time,'flyer_path',p_flyer_path,'registration_open',false,
      'mode',CASE WHEN lower(coalesce(p_location,'')) LIKE '%zoom%' OR lower(coalesce(p_location,'')) LIKE '%online%' THEN 'online' ELSE NULL END
    ));
    SELECT id INTO v_id FROM public.member_updates WHERE offering_id=v_offering;
    RETURN v_id;
  END IF;
  INSERT INTO public.member_updates(title,message,program_date,location,flyer_path,created_by,program_time)
    VALUES(btrim(p_title),btrim(p_message),p_program_date,nullif(btrim(p_location),''),p_flyer_path,auth.uid(),p_program_time) RETURNING id INTO v_id;
  INSERT INTO public.notifications(user_id,type,payload,created_by)
    SELECT id,'info',jsonb_build_object('title',btrim(p_title),'message',left(btrim(p_message),300),'category','system','link','/dashboard'),auth.uid()
    FROM public.users WHERE is_active AND role IN ('member','trainer');
  PERFORM public._audit('member update published','member_updates',v_id,jsonb_build_object('title',p_title));
  RETURN v_id;
END $$;
-- Link existing dated announcements to persistent programs without guessing fees.
-- Registration stays closed until an admin confirms the fee and opens it.
INSERT INTO public.offerings(id,code,title,description,kind,duration,format,price,is_active,start_date,flyer_path,program_time,program_end_time,mode,registration_open,sort_order)
SELECT id,'FSP-UPDATE-' || replace(id::text,'-',''),title,message,'program','Scheduled program',location,0,true,program_date,flyer_path,program_time,program_end_time,
  CASE WHEN lower(coalesce(location,'')) LIKE '%zoom%' OR lower(coalesce(location,'')) LIKE '%online%' THEN 'online' ELSE NULL END,false,100
FROM public.member_updates WHERE offering_id IS NULL AND program_date IS NOT NULL AND is_published
ON CONFLICT(id) DO NOTHING;
UPDATE public.member_updates u SET offering_id=o.id FROM public.offerings o
  WHERE u.offering_id IS NULL AND u.id=o.id AND o.code='FSP-UPDATE-' || replace(u.id::text,'-','');
NOTIFY pgrst,'reload schema';
COMMIT;