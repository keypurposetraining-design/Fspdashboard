-- Admin-editable course/program details and calendar dates. Apply after 010.
BEGIN;
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.offerings ADD COLUMN IF NOT EXISTS end_date date;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.offerings'::regclass AND conname = 'offering_dates_valid') THEN
    ALTER TABLE public.offerings ADD CONSTRAINT offering_dates_valid CHECK (
      end_date IS NULL OR (start_date IS NOT NULL AND end_date >= start_date)
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.offerings'::regclass AND conname = 'offering_details_valid') THEN
    ALTER TABLE public.offerings ADD CONSTRAINT offering_details_valid CHECK (
      char_length(btrim(title)) BETWEEN 1 AND 150 AND
      char_length(btrim(description)) BETWEEN 1 AND 5000 AND
      char_length(btrim(duration)) BETWEEN 1 AND 100 AND
      (format IS NULL OR char_length(format) <= 200)
    ) NOT VALID;
  END IF;
END $$;
GRANT UPDATE (title,description,duration,format,start_date,end_date,price,is_active)
  ON public.offerings TO authenticated;
-- Existing offerings_admin RLS policy still checks is_admin().
CREATE OR REPLACE FUNCTION public.audit_offering_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF to_jsonb(NEW) IS DISTINCT FROM to_jsonb(OLD) AND auth.uid() IS NOT NULL THEN
    PERFORM public._audit('course details updated','offerings',NEW.id,
      jsonb_build_object('old_value',to_jsonb(OLD),'new_value',to_jsonb(NEW)));
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.audit_offering_update() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS audit_offering_update ON public.offerings;
CREATE TRIGGER audit_offering_update AFTER UPDATE ON public.offerings FOR EACH ROW EXECUTE FUNCTION public.audit_offering_update();
NOTIFY pgrst,'reload schema';
COMMIT;
