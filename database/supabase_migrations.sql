-- NOTE: base schema (historical). Apply database/migrations/*.sql in order after
-- this file; they fix security issues present in the original version.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE membership_status AS ENUM ('active', 'pending', 'cancelled', 'expired');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'alert', 'message');
CREATE TYPE registration_status AS ENUM ('registered', 'waitlist', 'cancelled');
CREATE TYPE resource_type AS ENUM ('video', 'document', 'link');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Members table
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    address TEXT,
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Memberships table
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    start_date DATE NOT NULL,
    end_date DATE,
    status membership_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Course Enrollments (many‑to‑many)
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status enrollment_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Tasks table (optional course association)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Task Submissions table
CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id),
    member_id UUID NOT NULL REFERENCES members(id),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    grade NUMERIC(5,2),
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Event Registrations table
CREATE TABLE event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    member_id UUID NOT NULL REFERENCES members(id),
    status registration_status NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    membership_id UUID REFERENCES memberships(id),
    amount NUMERIC(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Certificates table
CREATE TABLE certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id),
    course_id UUID NOT NULL REFERENCES courses(id),
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    certificate_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type resource_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type notification_type NOT NULL,
    payload JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id)
);

-- Community Posts table
CREATE TABLE community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    parent_post_id UUID REFERENCES community_posts(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    details JSONB
);

-- Indexes for foreign keys (optional)
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_course_enrollments_member_id ON course_enrollments(member_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_tasks_course_id ON tasks(course_id);
CREATE INDEX idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX idx_task_submissions_member_id ON task_submissions(member_id);
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_member_id ON event_registrations(member_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_membership_id ON payments(membership_id);
CREATE INDEX idx_certificates_member_id ON certificates(member_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_resources_course_id ON resources(course_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_parent_id ON community_posts(parent_post_id);

-- Make password_hash nullable in users since authentication uses Supabase Auth (auth.users)
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;

-- Create helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- [REMOVED 2026-09-24] members_user_id_unique, handle_new_user() and the
-- on_auth_user_created trigger previously lived here. That version trusted
-- raw_user_meta_data.role (privilege escalation), granted a free active
-- membership, and could block sign-in. Superseded by:
--   database/migrations/002_user_sync.sql   (single _sync_user + safe triggers)
--   database/migrations/003_data_repair.sql (FK-safe dedup + unique constraint)

-- Enable RLS and define Policies for tables

-- 1. users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own record or admins read all" ON public.users;
CREATE POLICY "Users can read own record or admins read all" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own record or admins update all" ON public.users;
CREATE POLICY "Users can update own record or admins update all" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.is_admin());

-- 2. members
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own record or admins read all" ON public.members;
CREATE POLICY "Members read own record or admins read all" ON public.members
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Members update own record or admins update all" ON public.members;
CREATE POLICY "Members update own record or admins update all" ON public.members
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Admins can insert members" ON public.members;
CREATE POLICY "Admins can insert members" ON public.members
  FOR INSERT WITH CHECK (public.is_admin());

-- 3. memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own memberships or admins read all" ON public.memberships;
CREATE POLICY "Members read own memberships or admins read all" ON public.memberships
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage memberships" ON public.memberships;
CREATE POLICY "Admins can manage memberships" ON public.memberships
  FOR ALL USING (public.is_admin());

-- 4. courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read courses" ON public.courses;
CREATE POLICY "Anyone can read courses" ON public.courses
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage courses" ON public.courses;
CREATE POLICY "Admins can manage courses" ON public.courses
  FOR ALL USING (public.is_admin());

-- 5. course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own course enrollments or admins read all" ON public.course_enrollments;
CREATE POLICY "Members read own course enrollments or admins read all" ON public.course_enrollments
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Members can enroll themselves" ON public.course_enrollments;
CREATE POLICY "Members can enroll themselves" ON public.course_enrollments
  FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage course enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can manage course enrollments" ON public.course_enrollments
  FOR ALL USING (public.is_admin());

-- 6. tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read tasks" ON public.tasks;
CREATE POLICY "Anyone can read tasks" ON public.tasks
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage tasks" ON public.tasks;
CREATE POLICY "Admins can manage tasks" ON public.tasks
  FOR ALL USING (public.is_admin());

-- 7. task_submissions
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own task submissions or admins read all" ON public.task_submissions;
CREATE POLICY "Members read own task submissions or admins read all" ON public.task_submissions
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Members can submit tasks without grades" ON public.task_submissions;
CREATE POLICY "Members can submit tasks without grades" ON public.task_submissions
  FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) AND grade IS NULL);
DROP POLICY IF EXISTS "Members can update own pending submissions" ON public.task_submissions;
CREATE POLICY "Members can update own pending submissions" ON public.task_submissions
  FOR UPDATE USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) AND grade IS NULL)
  WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) AND grade IS NULL);
DROP POLICY IF EXISTS "Admins can grade/manage submissions" ON public.task_submissions;
CREATE POLICY "Admins can grade/manage submissions" ON public.task_submissions
  FOR ALL USING (public.is_admin());

-- 8. events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read events" ON public.events;
CREATE POLICY "Anyone can read events" ON public.events
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;
CREATE POLICY "Admins can manage events" ON public.events
  FOR ALL USING (public.is_admin());

-- 9. event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own event registrations or admins read all" ON public.event_registrations;
CREATE POLICY "Members read own event registrations or admins read all" ON public.event_registrations
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Members can register themselves for events" ON public.event_registrations;
CREATE POLICY "Members can register themselves for events" ON public.event_registrations
  FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Members can cancel own event registration" ON public.event_registrations;
CREATE POLICY "Members can cancel own event registration" ON public.event_registrations
  FOR UPDATE USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage event registrations" ON public.event_registrations;
CREATE POLICY "Admins can manage event registrations" ON public.event_registrations
  FOR ALL USING (public.is_admin());

-- 10. payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own payments or admins read all" ON public.payments;
CREATE POLICY "Members read own payments or admins read all" ON public.payments
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Members can request renewal payments" ON public.payments;
CREATE POLICY "Members can request renewal payments" ON public.payments
  FOR INSERT WITH CHECK (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
CREATE POLICY "Admins can manage payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- 11. certificates
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members read own certificates or admins read all" ON public.certificates;
CREATE POLICY "Members read own certificates or admins read all" ON public.certificates
  FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates" ON public.certificates
  FOR ALL USING (public.is_admin());

-- 12. resources
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read resources" ON public.resources;
CREATE POLICY "Anyone can read resources" ON public.resources
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());
DROP POLICY IF EXISTS "Admins can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources" ON public.resources
  FOR ALL USING (public.is_admin());

-- 13. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own notifications or admins read all" ON public.notifications;
CREATE POLICY "Users read own notifications or admins read all" ON public.notifications
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "Users can update own notification read status" ON public.notifications;
CREATE POLICY "Users can update own notification read status" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (public.is_admin());

-- 14. community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read community posts" ON public.community_posts;
CREATE POLICY "Anyone can read community posts" ON public.community_posts
  FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());
DROP POLICY IF EXISTS "Members can create/manage own posts or admins manage all" ON public.community_posts;
CREATE POLICY "Members can create/manage own posts or admins manage all" ON public.community_posts
  FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- 15. audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- Integrity uniqueness constraints to prevent duplicate entries
ALTER TABLE public.course_enrollments DROP CONSTRAINT IF EXISTS unique_member_course_enrollment;
ALTER TABLE public.course_enrollments ADD CONSTRAINT unique_member_course_enrollment UNIQUE (member_id, course_id);

ALTER TABLE public.event_registrations DROP CONSTRAINT IF EXISTS unique_member_event_registration;
ALTER TABLE public.event_registrations ADD CONSTRAINT unique_member_event_registration UNIQUE (event_id, member_id);

ALTER TABLE public.task_submissions DROP CONSTRAINT IF EXISTS unique_member_task_submission;
ALTER TABLE public.task_submissions ADD CONSTRAINT unique_member_task_submission UNIQUE (task_id, member_id);

-- Storage bucket configuration for task-submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-submissions', 'task-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow members to insert their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow members to view their own files or admins view all" ON storage.objects;
DROP POLICY IF EXISTS "Allow members to delete their own files" ON storage.objects;

-- Create policies
CREATE POLICY "Allow members to insert their own files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'task-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Allow members to view their own files or admins view all" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'task-submissions' AND (
      (storage.foldername(name))[1] = auth.uid()::text OR
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin'))
    )
  );

CREATE POLICY "Allow members to delete their own files" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'task-submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create member_activity_logs table
CREATE TABLE IF NOT EXISTS public.member_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  member_id UUID REFERENCES public.members(id),
  action VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_member_id ON public.member_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_user_id ON public.member_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_action ON public.member_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_member_activity_logs_created_at ON public.member_activity_logs(created_at);

-- RLS
ALTER TABLE public.member_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read own logs" ON public.member_activity_logs;
CREATE POLICY "Members read own logs" ON public.member_activity_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

-- Allow authenticated users to record their own activity (used by POST /api/activity)
DROP POLICY IF EXISTS "Users can insert own activity logs" ON public.member_activity_logs;
CREATE POLICY "Users can insert own activity logs" ON public.member_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow admins to insert activity logs for any user
DROP POLICY IF EXISTS "Admins can insert activity logs" ON public.member_activity_logs;
CREATE POLICY "Admins can insert activity logs" ON public.member_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- Allow anonymous inserts ONLY for failed-login attempts (no session context)
DROP POLICY IF EXISTS "Allow anonymous failed login logs" ON public.member_activity_logs;
CREATE POLICY "Allow anonymous failed login logs" ON public.member_activity_logs
  FOR INSERT TO anon
  WITH CHECK (action = 'AUTH_LOGIN_FAILED' AND user_id IS NULL AND member_id IS NULL);

-- ============================================================================
-- Event fees & configurable platform fees (Admin Content Hub)
-- ============================================================================

-- Per-event registration fee (0 = free). Members pay this when RSVPing.
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fee NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Link a payment to a specific event so event RSVP payments are attributable.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);

-- Key/value platform settings (e.g. membership renewal fee) editable by admins.
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read app settings" ON public.app_settings;
CREATE POLICY "Authenticated can read app settings" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage app settings" ON public.app_settings;
CREATE POLICY "Admins can manage app settings" ON public.app_settings
  FOR ALL USING (public.is_admin());

-- Seed the default membership renewal fee (currently hardcoded in the UI).
INSERT INTO public.app_settings (key, value)
VALUES ('renewal_fee', '{"amount": 3000, "currency": "INR"}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Auth/profile link repair (idempotent; safe to re-run)
--
-- Fixes the error: "Authenticated user has no matching public.users profile"
--
-- Cause: AuthProvider.fetchUserProfile() reads public.users BY id
-- (public.users.id = auth.users.id) through an anon-key client, so RLS applies.
-- The public.users SELECT policy only returns the row when the ids match
-- (auth.uid() = id). If the row was created by a manual INSERT (random UUID)
-- instead of the on_auth_user_created trigger, the ids differ and the query
-- returns zero rows -> the profile lookup fails even though the row exists.
--
-- This block (1) guarantees is_admin() and the own-row SELECT policy exist,
-- and (2) aligns any drifted public.users.id with the matching auth.users.id.
-- It never creates/deletes users, never changes roles, never disables RLS,
-- and only touches rows that are actually broken (email has an auth user with
-- a different id) and that have no FK dependents.
-- ============================================================================

-- 1) Helper used by the RLS policy below (idempotent).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2) Guarantee RLS is on and the own-row SELECT policy exists.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own record or admins read all" ON public.users;
CREATE POLICY "Users can read own record or admins read all" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

-- 3) Align drifted public.users.id with auth.users.id (email-keyed).
--    Refuses to auto-fix if FK dependents reference the stale id, so the admin
--    can re-point them manually without silently breaking data.
DO $$
DECLARE
  r record;
  v_auth_id uuid;
  v_dependents int;
BEGIN
  FOR r IN
    SELECT u.email, u.id AS stale_id
    FROM public.users u
    JOIN auth.users au ON au.email = u.email
    WHERE u.id IS DISTINCT FROM au.id
  LOOP
    SELECT au.id INTO v_auth_id FROM auth.users au WHERE au.email = r.email;

    SELECT (SELECT count(*) FROM public.members WHERE user_id = r.stale_id)
         + (SELECT count(*) FROM public.notifications WHERE user_id = r.stale_id)
         + (SELECT count(*) FROM public.community_posts WHERE user_id = r.stale_id)
    INTO v_dependents;

    IF v_dependents > 0 THEN
      RAISE NOTICE 'SKIP %: % FK dependents still reference stale id %; re-point them manually.',
        r.email, v_dependents, r.stale_id;
      CONTINUE;
    END IF;

    BEGIN
      UPDATE public.users
      SET id = v_auth_id, updated_at = now()
      WHERE id = r.stale_id;
      RAISE NOTICE 'Aligned public.users.id for % -> %', r.email, v_auth_id;
    EXCEPTION WHEN foreign_key_violation OR unique_violation THEN
      RAISE NOTICE 'SKIP %: could not align id % (FK/unique violation); fix references manually.',
        r.email, r.stale_id;
    END;
  END LOOP;
END $$;


-- ============================================================================
-- Seed FSP Catalyst Connect Event
-- ============================================================================
-- Event date: August 16, 2026 (tomorrow from current app date August 15, 2026)
-- Poster image: public/fsp-catalyst-connect-poster.png
INSERT INTO public.events (title, description, start_time, end_time, location, fee, image_url)
VALUES (
    'FSP Catalyst Connect',
    'A powerful day of connections, ideas and growth for trainers who want to go further.

Connect • Collaborate • Conquer',
    '2026-08-16T09:30:00+05:30',
    '2026-08-16T17:00:00+05:30',
    'IIT Madras Research Park, Chennai, Tamil Nadu',
    0,
    '/fsp-catalyst-connect-poster.png'
)
ON CONFLICT DO NOTHING;


-- [REMOVED 2026-09-24] sync_current_user() previously lived here (a third copy
-- of the sync logic). Superseded by database/migrations/002_user_sync.sql.
