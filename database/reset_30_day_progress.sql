-- One-account reset requested by the account owner.
-- Verify this email before running in Supabase SQL Editor.
-- Preserves task definitions, enrollment, payment, and membership records.
BEGIN;
DO $$
DECLARE
  v_email text := 'yogiyogesh4002@gmail.com';
  v_ids uuid[];
  v_deleted integer;
BEGIN
  SELECT array_agg(e.id) INTO v_ids
  FROM public.offering_enrollments e
  JOIN public.members m ON m.id=e.member_id
  JOIN public.users u ON u.id=m.user_id
  JOIN public.offerings o ON o.id=e.offering_id
  WHERE lower(u.email)=lower(v_email) AND o.code='FSP-30DC';
  IF coalesce(cardinality(v_ids),0)<>1 THEN
    RAISE EXCEPTION 'Expected exactly one 30 Days Challenge enrollment for %. Found %. No progress reset.',v_email,coalesce(cardinality(v_ids),0);
  END IF;
  PERFORM 1 FROM public.offering_enrollments WHERE id=v_ids[1] FOR UPDATE;
  DELETE FROM public.offering_task_completions WHERE enrollment_id=v_ids[1];
  GET DIAGNOSTICS v_deleted=ROW_COUNT;
  PERFORM public._audit('daily task progress reset','offering_enrollments',v_ids[1],
    jsonb_build_object('reason','Account owner requested restart from Day 1','completed_tasks_removed',v_deleted));
  RAISE NOTICE 'Reset % completed tasks for %. Next task is Day 1.',v_deleted,v_email;
END $$;
COMMIT;

-- Confirm the reset: completed_tasks should be 0.
SELECT u.email,o.title,count(c.task_id) AS completed_tasks
FROM public.offering_enrollments e
JOIN public.members m ON m.id=e.member_id
JOIN public.users u ON u.id=m.user_id
JOIN public.offerings o ON o.id=e.offering_id
LEFT JOIN public.offering_task_completions c ON c.enrollment_id=e.id
WHERE lower(u.email)='yogiyogesh4002@gmail.com' AND o.code='FSP-30DC'
GROUP BY u.email,o.title;
