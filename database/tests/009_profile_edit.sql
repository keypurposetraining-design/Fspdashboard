BEGIN;
INSERT INTO public.users(id,email,role,is_active) VALUES
('09000000-0000-0000-0000-000000000001','profile-one@example.invalid','member',true),
('09000000-0000-0000-0000-000000000002','profile-two@example.invalid','member',true);
INSERT INTO public.members(id,user_id,first_name) VALUES
('09000000-0000-0000-0000-000000000011','09000000-0000-0000-0000-000000000001','Before'),
('09000000-0000-0000-0000-000000000012','09000000-0000-0000-0000-000000000002','Other');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','09000000-0000-0000-0000-000000000001',true);
DO $$
DECLARE denied boolean := false;
BEGIN
  UPDATE public.members SET first_name = 'Updated',city = 'Chennai',occupation = 'Trainer',updated_at = now()
    WHERE id = '09000000-0000-0000-0000-000000000011';
  IF NOT FOUND THEN RAISE EXCEPTION 'Own profile update failed'; END IF;
  UPDATE public.users SET name = 'Updated' WHERE id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Display name update failed'; END IF;
  UPDATE public.members SET first_name = 'Forbidden' WHERE id = '09000000-0000-0000-0000-000000000012';
  IF FOUND THEN RAISE EXCEPTION 'Another member profile was modified'; END IF;
  BEGIN UPDATE public.users SET role = 'admin' WHERE id = auth.uid();
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Profile editor can promote account'; END IF;
  denied := false;
  BEGIN UPDATE public.members SET user_id = '09000000-0000-0000-0000-000000000002' WHERE user_id = auth.uid();
  EXCEPTION WHEN insufficient_privilege THEN denied := true; END;
  IF NOT denied THEN RAISE EXCEPTION 'Profile editor can reassign ownership'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
