-- ==============================================================================
-- 000_diagnostics.sql  —  READ-ONLY. Safe to run any number of times.
-- ==============================================================================
-- Run in the Supabase SQL editor BEFORE 003_data_repair.sql and share the output.
-- The Supabase SQL editor only displays the last statement's result, so the
-- first query is a single summary table; run the detail queries below it one at
-- a time (select the statement and press Run) for any non-zero count.
-- Nothing here writes, locks, or alters anything.
-- ==============================================================================

-- ---------------------------------------------------------------------------
-- SUMMARY (run this one first)
-- ---------------------------------------------------------------------------
SELECT check_name, n FROM (
  SELECT 1 AS ord, 'auth users total' AS check_name,
         (SELECT count(*) FROM auth.users) AS n
  UNION ALL SELECT 2, 'auth users without public.users row',
         (SELECT count(*) FROM auth.users au
           WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = au.id))
  UNION ALL SELECT 3, 'auth users without public.members row',
         (SELECT count(*) FROM auth.users au
           WHERE NOT EXISTS (SELECT 1 FROM public.members m WHERE m.user_id = au.id))
  UNION ALL SELECT 4, 'email/id drift (public.users.id <> auth.users.id, same email)',
         (SELECT count(*) FROM public.users u
            JOIN auth.users au ON lower(au.email) = lower(u.email)
           WHERE u.id <> au.id)
  UNION ALL SELECT 5, 'public.users with no auth.users row',
         (SELECT count(*) FROM public.users u
           WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = u.id))
  UNION ALL SELECT 6, 'members whose user_id has no public.users row',
         (SELECT count(*) FROM public.members m
           WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = m.user_id))
  UNION ALL SELECT 7, 'user_ids with duplicate members rows',
         (SELECT count(*) FROM (SELECT user_id FROM public.members
                                 GROUP BY user_id HAVING count(*) > 1) d)
  UNION ALL SELECT 8, 'extra (duplicate) members rows',
         (SELECT COALESCE(sum(c - 1), 0) FROM (SELECT count(*) c FROM public.members
                                 GROUP BY user_id HAVING count(*) > 1) d)
  UNION ALL SELECT 9, 'members_user_id_unique constraint present (1 = yes)',
         (SELECT count(*) FROM pg_constraint WHERE conname = 'members_user_id_unique')
  UNION ALL SELECT 10, 'role = admin',
         (SELECT count(*) FROM public.users WHERE role = 'admin')
  UNION ALL SELECT 11, 'role = super_admin',
         (SELECT count(*) FROM public.users WHERE role = 'super_admin')
  UNION ALL SELECT 12, 'role = trainer',
         (SELECT count(*) FROM public.users WHERE role = 'trainer')
  UNION ALL SELECT 13, 'role NULL or not in (member, trainer, admin, super_admin)',
         (SELECT count(*) FROM public.users
           WHERE role IS NULL OR role NOT IN ('member','trainer','admin','super_admin'))
  UNION ALL SELECT 14, 'auth users with a role in raw_user_meta_data',
         (SELECT count(*) FROM auth.users WHERE raw_user_meta_data ? 'role')
  UNION ALL SELECT 15, 'admins/super_admins whose metadata also claims a privileged role',
         (SELECT count(*) FROM public.users u JOIN auth.users au ON au.id = u.id
           WHERE u.role IN ('admin','super_admin')
             AND au.raw_user_meta_data->>'role' IN ('admin','super_admin'))
  UNION ALL SELECT 16, 'memberships total',
         (SELECT count(*) FROM public.memberships)
  UNION ALL SELECT 17, 'memberships active',
         (SELECT count(*) FROM public.memberships WHERE status = 'active')
  UNION ALL SELECT 18, 'LIKELY AUTO-GRANTED: active, no end_date, no created_by, no succeeded payment',
         (SELECT count(*) FROM public.memberships ms
           WHERE ms.status = 'active' AND ms.end_date IS NULL AND ms.created_by IS NULL
             AND NOT EXISTS (SELECT 1 FROM public.payments p
                              WHERE p.member_id = ms.member_id AND p.status = 'succeeded'))
  UNION ALL SELECT 19, 'members with more than one membership row',
         (SELECT count(*) FROM (SELECT member_id FROM public.memberships
                                 GROUP BY member_id HAVING count(*) > 1) d)
  UNION ALL SELECT 20, 'members with no membership row',
         (SELECT count(*) FROM public.members m
           WHERE NOT EXISTS (SELECT 1 FROM public.memberships ms WHERE ms.member_id = m.id))
  UNION ALL SELECT 21, 'active memberships whose end_date is in the past',
         (SELECT count(*) FROM public.memberships
           WHERE status = 'active' AND end_date IS NOT NULL AND end_date < CURRENT_DATE)
  UNION ALL SELECT 22, 'payments with status succeeded',
         (SELECT count(*) FROM public.payments WHERE status = 'succeeded')
  UNION ALL SELECT 23, 'succeeded payments created by the member themself (created_by NULL)',
         (SELECT count(*) FROM public.payments WHERE status = 'succeeded' AND created_by IS NULL)
  UNION ALL SELECT 24, 'on_auth_user_created trigger present (1 = yes)',
         (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'auth' AND c.relname = 'users'
             AND t.tgname = 'on_auth_user_created')
  UNION ALL SELECT 25, 'audit_logs rows',
         (SELECT count(*) FROM public.audit_logs)
) s ORDER BY ord;

-- ---------------------------------------------------------------------------
-- DETAIL QUERIES (run individually as needed)
-- ---------------------------------------------------------------------------

-- D1. Email/id drift, with dependent-row counts
SELECT u.email, u.id AS public_id, au.id AS auth_id, u.role,
       (SELECT count(*) FROM public.members m WHERE m.user_id = u.id)          AS members,
       (SELECT count(*) FROM public.notifications n WHERE n.user_id = u.id)    AS notifications,
       (SELECT count(*) FROM public.community_posts p WHERE p.user_id = u.id)  AS posts,
       EXISTS (SELECT 1 FROM public.users x WHERE x.id = au.id)                AS auth_id_also_in_public_users
FROM public.users u
JOIN auth.users au ON lower(au.email) = lower(u.email)
WHERE u.id <> au.id;

-- D2. Duplicate members and what references each copy
SELECT m.user_id, m.id AS member_id, m.created_at, m.first_name, m.last_name,
       (SELECT count(*) FROM public.memberships x         WHERE x.member_id = m.id) AS memberships,
       (SELECT count(*) FROM public.payments x            WHERE x.member_id = m.id) AS payments,
       (SELECT count(*) FROM public.course_enrollments x  WHERE x.member_id = m.id) AS enrollments,
       (SELECT count(*) FROM public.task_submissions x    WHERE x.member_id = m.id) AS submissions,
       (SELECT count(*) FROM public.event_registrations x WHERE x.member_id = m.id) AS registrations,
       (SELECT count(*) FROM public.certificates x        WHERE x.member_id = m.id) AS certificates,
       (SELECT count(*) FROM public.member_activity_logs x WHERE x.member_id = m.id) AS activity_logs
FROM public.members m
WHERE m.user_id IN (SELECT user_id FROM public.members GROUP BY user_id HAVING count(*) > 1)
ORDER BY m.user_id, m.created_at, m.id;

-- D3. Every privileged account (review that each one is expected)
SELECT u.id, u.email, u.name, u.role, u.created_at,
       au.raw_user_meta_data->>'role' AS metadata_role,
       au.last_sign_in_at
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE u.role IN ('admin','super_admin','trainer')
ORDER BY u.role, u.created_at;

-- D4. Memberships the new rules would reset to pending (decision B)
SELECT ms.id AS membership_id, ms.member_id, u.email, ms.start_date, ms.created_at
FROM public.memberships ms
JOIN public.members m ON m.id = ms.member_id
JOIN public.users u   ON u.id = m.user_id
WHERE ms.status = 'active' AND ms.end_date IS NULL AND ms.created_by IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.payments p
                   WHERE p.member_id = ms.member_id AND p.status = 'succeeded')
ORDER BY ms.created_at;

-- D5. Existing RLS policies (so the repair migrations can be checked against reality)
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname IN ('public','storage')
ORDER BY schemaname, tablename, policyname;

-- D6. Foreign keys that point at public.users / public.members (for 003 re-keying)
SELECT conrelid::regclass AS referencing_table, conname,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid IN ('public.users'::regclass, 'public.members'::regclass)
ORDER BY 1, 2;
