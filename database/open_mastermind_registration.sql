-- Open only the free October 12 Mastermind session shown in the screenshot.
BEGIN;
DO $$
DECLARE v_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO v_ids FROM public.offerings
  WHERE kind='program' AND is_active AND price=0
    AND start_date='2026-10-12'::date
    AND title ILIKE 'FSP MASTERMIND%October Month Special%';
  IF coalesce(cardinality(v_ids),0)<>1 THEN
    RAISE EXCEPTION 'Expected one free Mastermind session on 12 October 2026; found %. Check the session in Admin Program setup.',coalesce(cardinality(v_ids),0);
  END IF;
  IF '2026-10-12'::date < (now() AT TIME ZONE 'Asia/Kolkata')::date THEN
    RAISE EXCEPTION 'This session date has passed. Set a future date in Admin Program setup before opening registration.';
  END IF;
  UPDATE public.offerings SET registration_open=true WHERE id=v_ids[1];
END $$;
COMMIT;
SELECT title,start_date,price,registration_open FROM public.offerings
WHERE kind='program' AND start_date='2026-10-12'::date
  AND title ILIKE 'FSP MASTERMIND%October Month Special%';
