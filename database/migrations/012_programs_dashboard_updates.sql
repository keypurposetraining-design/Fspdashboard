-- Apply after 011. Shared program creation, flyers, and automatic dashboard posts.
BEGIN;
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS flyer_path text;
ALTER TABLE public.member_updates ADD COLUMN IF NOT EXISTS offering_id uuid REFERENCES public.offerings(id);
CREATE UNIQUE INDEX IF NOT EXISTS member_updates_offering_unique ON public.member_updates(offering_id) WHERE offering_id IS NOT NULL;

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
    INSERT INTO public.offerings(id,code,title,description,kind,duration,format,price,is_active,start_date,end_date,flyer_path,sort_order)
    VALUES(p_offering_id,'FSP-' || upper(replace(p_offering_id::text,'-','')),btrim(p_values->>'title'),btrim(p_values->>'description'),
      p_values->>'kind',btrim(p_values->>'duration'),nullif(btrim(p_values->>'format'),''),(p_values->>'price')::numeric,
      coalesce((p_values->>'is_active')::boolean,true),nullif(p_values->>'start_date','')::date,nullif(p_values->>'end_date','')::date,v_flyer,100);
    PERFORM public._audit('program created','offerings',p_offering_id,jsonb_build_object('title',p_values->>'title'));
  ELSE
    UPDATE public.offerings SET title=btrim(p_values->>'title'),description=btrim(p_values->>'description'),
      duration=btrim(p_values->>'duration'),format=nullif(btrim(p_values->>'format'),''),price=(p_values->>'price')::numeric,
      is_active=coalesce((p_values->>'is_active')::boolean,true),start_date=nullif(p_values->>'start_date','')::date,
      end_date=nullif(p_values->>'end_date','')::date,flyer_path=v_flyer WHERE id=p_offering_id;
  END IF;
  RETURN p_offering_id;
END $$;
REVOKE ALL ON FUNCTION public.save_program(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_program(uuid,jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_program_dashboard_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_post uuid;
BEGIN
  IF TG_OP='UPDATE' AND to_jsonb(OLD)=to_jsonb(NEW) THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RETURN NEW; END IF;
  INSERT INTO public.member_updates(offering_id,title,message,program_date,location,flyer_path,is_published,created_by)
    VALUES(NEW.id,NEW.title,NEW.description,NEW.start_date,NEW.format,NEW.flyer_path,NEW.is_active,auth.uid())
    ON CONFLICT(offering_id) WHERE offering_id IS NOT NULL DO UPDATE SET
      title=EXCLUDED.title,message=EXCLUDED.message,program_date=EXCLUDED.program_date,location=EXCLUDED.location,
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
REVOKE ALL ON FUNCTION public.sync_program_dashboard_update() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS sync_program_dashboard_update ON public.offerings;
CREATE TRIGGER sync_program_dashboard_update AFTER INSERT OR UPDATE ON public.offerings FOR EACH ROW EXECUTE FUNCTION public.sync_program_dashboard_update();
NOTIFY pgrst,'reload schema';
COMMIT;
