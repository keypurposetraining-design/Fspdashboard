-- Apply after 013. Program time and midnight expiry in India time.
BEGIN;
ALTER TABLE public.member_updates ADD COLUMN IF NOT EXISTS program_time time;
ALTER TABLE public.member_updates ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.member_updates ADD COLUMN IF NOT EXISTS program_end_date date;
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS program_time time;
CREATE OR REPLACE FUNCTION public.set_update_expiry()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
  NEW.expires_at := CASE WHEN NEW.program_date IS NULL THEN NULL
    ELSE (coalesce(NEW.program_end_date,NEW.program_date) + 1)::timestamp AT TIME ZONE 'Asia/Kolkata' END;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS set_update_expiry ON public.member_updates;
CREATE TRIGGER set_update_expiry BEFORE INSERT OR UPDATE ON public.member_updates FOR EACH ROW EXECUTE FUNCTION public.set_update_expiry();
UPDATE public.member_updates SET expires_at=CASE WHEN program_date IS NULL THEN NULL ELSE (coalesce(program_end_date,program_date)+1)::timestamp AT TIME ZONE 'Asia/Kolkata' END;
DROP POLICY IF EXISTS updates_read ON public.member_updates;
CREATE POLICY updates_read ON public.member_updates FOR SELECT TO authenticated USING (
  public.is_admin() OR (is_published AND (expires_at IS NULL OR expires_at>now())
    AND EXISTS (SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active))
);
DROP FUNCTION IF EXISTS public.publish_member_update(text,text,date,text,text);
CREATE OR REPLACE FUNCTION public.publish_member_update(p_title text,p_message text,p_program_date date DEFAULT NULL,p_location text DEFAULT NULL,p_flyer_path text DEFAULT NULL,p_program_time time DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Administrator access required.'; END IF;
  IF nullif(btrim(p_title),'') IS NULL OR nullif(btrim(p_message),'') IS NULL THEN RAISE EXCEPTION 'Title and message are required.'; END IF;
  IF p_flyer_path IS NOT NULL AND (p_flyer_path NOT LIKE auth.uid()::text || '/%'
    OR NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'program-flyers' AND name = p_flyer_path)) THEN
    RAISE EXCEPTION 'Upload a valid program flyer.';
  END IF;
  INSERT INTO public.member_updates(title,message,program_date,location,flyer_path,created_by,program_time)
    VALUES(btrim(p_title),btrim(p_message),p_program_date,nullif(btrim(p_location),''),p_flyer_path,auth.uid(),p_program_time) RETURNING id INTO v_id;
  INSERT INTO public.notifications(user_id,type,payload,created_by)
    SELECT id,'info',jsonb_build_object('title',btrim(p_title),'message',left(btrim(p_message),300),'category','system','link','/dashboard'),auth.uid()
    FROM public.users WHERE is_active AND role IN ('member','trainer');
  PERFORM public._audit('member update published','member_updates',v_id,jsonb_build_object('title',p_title));
  RETURN v_id;
END $$;
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
    INSERT INTO public.offerings(id,code,title,description,kind,duration,format,price,is_active,start_date,end_date,flyer_path,sort_order,program_time)
    VALUES(p_offering_id,'FSP-' || upper(replace(p_offering_id::text,'-','')),btrim(p_values->>'title'),btrim(p_values->>'description'),
      p_values->>'kind',btrim(p_values->>'duration'),nullif(btrim(p_values->>'format'),''),(p_values->>'price')::numeric,
      coalesce((p_values->>'is_active')::boolean,true),nullif(p_values->>'start_date','')::date,nullif(p_values->>'end_date','')::date,v_flyer,100,nullif(p_values->>'program_time','')::time);
    PERFORM public._audit('program created','offerings',p_offering_id,jsonb_build_object('title',p_values->>'title'));
  ELSE
    UPDATE public.offerings SET title=btrim(p_values->>'title'),description=btrim(p_values->>'description'),
      duration=btrim(p_values->>'duration'),format=nullif(btrim(p_values->>'format'),''),price=(p_values->>'price')::numeric,
      is_active=coalesce((p_values->>'is_active')::boolean,true),start_date=nullif(p_values->>'start_date','')::date,
      end_date=nullif(p_values->>'end_date','')::date,program_time=nullif(p_values->>'program_time','')::time,flyer_path=v_flyer WHERE id=p_offering_id;
  END IF;
  RETURN p_offering_id;
END $$;
CREATE OR REPLACE FUNCTION public.sync_program_dashboard_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post uuid;
BEGIN
  IF TG_OP='UPDATE' AND to_jsonb(OLD)=to_jsonb(NEW) THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RETURN NEW; END IF;
  INSERT INTO public.member_updates(offering_id,title,message,program_date,location,flyer_path,is_published,created_by,program_time,program_end_date)
    VALUES(NEW.id,NEW.title,NEW.description,NEW.start_date,NEW.format,NEW.flyer_path,NEW.is_active,auth.uid(),NEW.program_time,NEW.end_date)
    ON CONFLICT(offering_id) WHERE offering_id IS NOT NULL DO UPDATE SET
      program_end_date=EXCLUDED.program_end_date,program_time=EXCLUDED.program_time,title=EXCLUDED.title,message=EXCLUDED.message,program_date=EXCLUDED.program_date,location=EXCLUDED.location,
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
REVOKE ALL ON FUNCTION public.publish_member_update(text,text,date,text,text,time) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.publish_member_update(text,text,date,text,text,time) TO authenticated;
CREATE OR REPLACE FUNCTION public.expire_member_updates()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  DELETE FROM public.member_updates WHERE expires_at IS NOT NULL AND expires_at<=now();
$$;
REVOKE ALL ON FUNCTION public.expire_member_updates() FROM PUBLIC,anon,authenticated;
-- Expired posts are hidden by RLS even if scheduling is unavailable.
DO $schedule$ BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
    PERFORM cron.schedule('fsp-expire-updates','* * * * *','SELECT public.expire_member_updates()');
  EXCEPTION WHEN insufficient_privilege OR undefined_file OR feature_not_supported THEN
    RAISE NOTICE 'Enable pg_cron in Supabase Extensions, then schedule fsp-expire-updates every minute to call SELECT public.expire_member_updates(). Expired posts are already hidden by RLS.';
  END;
END $schedule$;
NOTIFY pgrst,'reload schema';
COMMIT;