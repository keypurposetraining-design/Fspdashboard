-- Apply after 015. Thirty sequential tasks with persisted, owner-only progress.
BEGIN;
CREATE TABLE IF NOT EXISTS public.offering_daily_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offering_id uuid NOT NULL REFERENCES public.offerings(id),
  day_number integer NOT NULL CHECK(day_number BETWEEN 1 AND 30),
  title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 150),
  instructions text NOT NULL CHECK(char_length(btrim(instructions)) BETWEEN 1 AND 5000),
  UNIQUE(offering_id,day_number)
);
CREATE TABLE IF NOT EXISTS public.offering_task_completions (
  enrollment_id uuid NOT NULL REFERENCES public.offering_enrollments(id),
  task_id uuid NOT NULL REFERENCES public.offering_daily_tasks(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(enrollment_id,task_id)
);
ALTER TABLE public.offering_daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_task_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS daily_tasks_read ON public.offering_daily_tasks;
CREATE POLICY daily_tasks_read ON public.offering_daily_tasks FOR SELECT TO authenticated USING(public.is_admin() OR EXISTS(
  SELECT 1 FROM public.offering_enrollments e JOIN public.members m ON m.id=e.member_id
  WHERE e.offering_id=offering_daily_tasks.offering_id AND e.status='active' AND m.user_id=auth.uid()
));
DROP POLICY IF EXISTS daily_tasks_edit ON public.offering_daily_tasks;
CREATE POLICY daily_tasks_edit ON public.offering_daily_tasks FOR UPDATE TO authenticated USING(public.is_admin()) WITH CHECK(public.is_admin());
DROP POLICY IF EXISTS daily_progress_read ON public.offering_task_completions;
CREATE POLICY daily_progress_read ON public.offering_task_completions FOR SELECT TO authenticated USING(public.is_admin() OR EXISTS(
  SELECT 1 FROM public.offering_enrollments e JOIN public.members m ON m.id=e.member_id
  WHERE e.id=offering_task_completions.enrollment_id AND m.user_id=auth.uid()
));
REVOKE ALL ON public.offering_daily_tasks,public.offering_task_completions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.offering_daily_tasks,public.offering_task_completions TO authenticated;
GRANT UPDATE(title,instructions) ON public.offering_daily_tasks TO authenticated;

INSERT INTO public.offering_daily_tasks(offering_id,day_number,title,instructions)
SELECT o.id,s.day_number,'Day ' || s.day_number || ': ' || s.title,s.instructions
FROM public.offerings o CROSS JOIN (VALUES
(1,'Set your intention','Write your goal for this challenge and one facilitation skill you want to strengthen.'),
(2,'Observe a group','Observe a meeting or group discussion. Note how people participate and what helps them feel included.'),
(3,'Practice listening','Listen to someone for five minutes without interrupting. Summarize what you heard and ask if you understood correctly.'),
(4,'Ask open questions','Write five open questions that invite reflection. Try one in a conversation.'),
(5,'Create a welcome','Draft a short welcome that explains the purpose of a session and makes participants feel comfortable.'),
(6,'Agree on group norms','Draft three group agreements and explain how you would invite participants to adapt them.'),
(7,'Reflect on week one','Review your notes. Record one strength, one challenge, and one change to try next week.'),
(8,'Design a check-in','Create a two-minute check-in question and describe how everyone can participate.'),
(9,'Clarify the outcome','Choose a workshop topic. Write a clear outcome and a way to check whether it was achieved.'),
(10,'Plan the flow','Draft a 30-minute session agenda with an opening, an activity, reflection, and a closing.'),
(11,'Give clear instructions','Write concise instructions for an activity. Ask someone to explain them back to you.'),
(12,'Invite quieter voices','Write two respectful ways to invite participation without putting anyone on the spot.'),
(13,'Balance participation','Plan a method such as pairs or individual reflection that gives everyone space to contribute.'),
(14,'Reflect on week two','Review your session plan and identify one improvement in clarity or participation.'),
(15,'Practice a pause','Notice a moment when you feel rushed. Pause, breathe, and respond deliberately. Record what changed.'),
(16,'Explore perspectives','Choose a discussion topic and write three different perspectives participants might bring.'),
(17,'Summarize a discussion','Practice a neutral summary that separates shared ideas, differences, and unanswered questions.'),
(18,'Respond to disagreement','Draft a calm response to disagreement that acknowledges both perspectives and invites clarification.'),
(19,'Manage the time','Plan a gentle reminder for when an activity runs long and a way to protect the closing.'),
(20,'Adapt an activity','Adapt one activity for both an online session and an in-person session.'),
(21,'Reflect on week three','Record a difficult facilitation moment and what you would try differently next time.'),
(22,'Design a debrief','Write three questions that connect an activity to participants’ real work or experience.'),
(23,'Collect feedback','Draft three simple feedback questions about clarity, participation, and usefulness.'),
(24,'Offer useful feedback','Practice specific, respectful feedback that describes an observation and suggests a next step.'),
(25,'Facilitate a short practice','Run a short discussion with willing participants, or rehearse your session aloud.'),
(26,'Review your practice','Review the practice session. Identify what worked, what felt unclear, and one adjustment.'),
(27,'Plan for inclusion','Review your activity for accessibility, different participation styles, and understandable language.'),
(28,'Create a strong closing','Draft a closing that summarizes learning and invites each participant to choose a next step.'),
(29,'Build your next plan','Create a plan for continuing your facilitation practice after the challenge.'),
(30,'Complete your reflection','Review all 30 days. Summarize your learning, celebrate your progress, and choose your next growth goal.')
) AS s(day_number,title,instructions)
WHERE o.code='FSP-30DC' ON CONFLICT(offering_id,day_number) DO NOTHING;

CREATE OR REPLACE FUNCTION public.complete_daily_task(p_enrollment_id uuid,p_task_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE e public.offering_enrollments; next_task uuid; total integer;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.users WHERE id=auth.uid() AND is_active) THEN RAISE EXCEPTION 'Please sign in with an active account.'; END IF;
  SELECT x.* INTO e FROM public.offering_enrollments x JOIN public.members m ON m.id=x.member_id
    WHERE x.id=p_enrollment_id AND m.user_id=auth.uid() FOR UPDATE OF x;
  IF NOT FOUND OR e.status<>'active' THEN RAISE EXCEPTION 'An active course enrollment is required.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.offering_daily_tasks WHERE id=p_task_id AND offering_id=e.offering_id) THEN RAISE EXCEPTION 'Task not found for this course.'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.offering_task_completions WHERE enrollment_id=e.id AND task_id=p_task_id) THEN
    SELECT t.id INTO next_task FROM public.offering_daily_tasks t WHERE t.offering_id=e.offering_id
      AND NOT EXISTS(SELECT 1 FROM public.offering_task_completions c WHERE c.enrollment_id=e.id AND c.task_id=t.id)
      ORDER BY t.day_number LIMIT 1;
    IF next_task IS DISTINCT FROM p_task_id THEN RAISE EXCEPTION 'Complete the current day before moving to the next task.'; END IF;
    INSERT INTO public.offering_task_completions(enrollment_id,task_id) VALUES(e.id,p_task_id);
    PERFORM public._audit('daily task completed','offering_enrollments',e.id,jsonb_build_object('task_id',p_task_id));
  END IF;
  SELECT count(*) INTO total FROM public.offering_task_completions WHERE enrollment_id=e.id;
  RETURN jsonb_build_object('completed',total,'task_id',p_task_id);
END $$;
REVOKE ALL ON FUNCTION public.complete_daily_task(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_daily_task(uuid,uuid) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
