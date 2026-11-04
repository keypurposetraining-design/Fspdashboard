// Usage: node database/tests/run-enrollment-check.mjs <PGlite package directory>
// Uses an in-memory PostgreSQL instance; never connects to Supabase.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const packagePath = process.argv[2];
if (!packagePath) throw new Error("Pass the directory containing @electric-sql/pglite.");
const { PGlite } = await import(pathToFileURL(resolve(packagePath, "dist/index.js")).href);
const db = new PGlite();
const migration = await readFile(new URL("../migrations/006_offering_enrollments.sql", import.meta.url), "utf8");
const permissions = await readFile(new URL("../migrations/007_profile_read_permissions.sql", import.meta.url), "utf8");
const tests = await readFile(new URL("006_offering_enrollments.sql", import.meta.url), "utf8");
const security = await readFile(new URL("../migrations/001_security_hotfix.sql", import.meta.url), "utf8");
const workflow = await readFile(new URL("../migrations/005_workflow_rpcs.sql", import.meta.url), "utf8");
function helper(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`CREATE OR REPLACE FUNCTION public\\.${escapedName}\\([\\s\\S]*?\\$\\$;`));
  if (!match) throw new Error(`Missing helper ${name}`);
  return match[0];
}
try {
  // Minimal prior schema with the actual authorization/audit/notification helpers.
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
      SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
    CREATE TYPE public.notification_type AS ENUM ('info','warning','alert','message');
    CREATE TABLE public.users(id uuid PRIMARY KEY, email text UNIQUE NOT NULL, name text, role text, is_active boolean DEFAULT true);
    CREATE TABLE public.members(id uuid PRIMARY KEY, user_id uuid REFERENCES public.users(id), first_name text, last_name text);
    CREATE TABLE public.notifications(id uuid DEFAULT gen_random_uuid(), user_id uuid REFERENCES public.users(id), type public.notification_type, payload jsonb, read_at timestamptz, created_by uuid REFERENCES public.users(id));
    CREATE TABLE public.memberships(id uuid DEFAULT gen_random_uuid(), member_id uuid REFERENCES public.members(id),start_date date,end_date date,status text,membership_type text,created_by uuid,updated_by uuid,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
    CREATE SCHEMA storage;
    CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid DEFAULT gen_random_uuid(),bucket_id text,name text);
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/'); $$;
    GRANT USAGE ON SCHEMA storage TO authenticated;
    GRANT SELECT,INSERT ON storage.objects TO authenticated;
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE TABLE public.audit_logs(id uuid DEFAULT gen_random_uuid(), action text, table_name text, record_id uuid, performed_by uuid REFERENCES public.users(id), details jsonb);
    ${helper(security, "current_app_role")}
    ${helper(security, "is_admin")}
    ${helper(workflow, "_audit")}
    ${helper(workflow, "_notify")}
    ${helper(workflow, "_notify_admins")}
    ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    CREATE POLICY user_read ON public.users FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_admin());
    CREATE POLICY membership_read ON public.memberships FOR SELECT TO authenticated USING (member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid()) OR public.is_admin());
    CREATE POLICY notification_read ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
    CREATE POLICY notification_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
    CREATE POLICY member_read ON public.members FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
    CREATE POLICY member_update ON public.members FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());
    CREATE POLICY user_update ON public.users FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin()) WITH CHECK (id = auth.uid() OR public.is_admin());
    GRANT SELECT ON public.members TO authenticated;
  `);
  await db.exec(migration);
  await db.exec(permissions);
  await db.exec(permissions);
  await db.exec(`
    BEGIN;
    INSERT INTO public.users(id,email,role) VALUES
      ('07000000-0000-0000-0000-000000000001','permissions-one@example.invalid','member'),
      ('07000000-0000-0000-0000-000000000002','permissions-two@example.invalid','member');
    INSERT INTO public.notifications(user_id,type) VALUES
      ('07000000-0000-0000-0000-000000000001','info'),
      ('07000000-0000-0000-0000-000000000002','info');
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','07000000-0000-0000-0000-000000000001',true);
    DO $$ BEGIN
      IF (SELECT count(*) FROM public.users) <> 1 THEN RAISE EXCEPTION 'Profile access leaked other accounts'; END IF;
      IF (SELECT count(*) FROM public.notifications) <> 1 THEN RAISE EXCEPTION 'Notification access leaked other accounts'; END IF;
      PERFORM id FROM public.members;
      PERFORM id FROM public.memberships;
      UPDATE public.notifications SET read_at = now() WHERE user_id = auth.uid();
      IF NOT FOUND THEN RAISE EXCEPTION 'Notification read status update failed'; END IF;
      IF has_table_privilege('authenticated','public.users','UPDATE') OR
         has_column_privilege('authenticated','public.users','role','UPDATE') THEN
        RAISE EXCEPTION 'Read permissions fix granted role updates';
      END IF;
    END $$;
    RESET ROLE;
    ROLLBACK;
  `);
  await db.exec(tests);
  const receiptsMigration = await readFile(new URL("../migrations/008_payment_receipts_membership.sql", import.meta.url), "utf8");
  await db.exec(receiptsMigration);
  await db.exec(receiptsMigration);
  await db.exec(await readFile(new URL("008_payment_membership.sql", import.meta.url), "utf8"));
  await db.exec(`ALTER TABLE public.members ADD COLUMN phone text, ADD COLUMN address text, ADD COLUMN city text, ADD COLUMN state text, ADD COLUMN postal_code text, ADD COLUMN country text, ADD COLUMN occupation text, ADD COLUMN organization text, ADD COLUMN avatar_url text, ADD COLUMN updated_at timestamptz;`);
  const editPermissions = await readFile(new URL("../migrations/009_profile_edit_permissions.sql", import.meta.url), "utf8");
  await db.exec(editPermissions);
  await db.exec(editPermissions);
  await db.exec(await readFile(new URL("009_profile_edit.sql", import.meta.url), "utf8"));
  await db.exec(`CREATE TABLE public.membership_applications(id uuid); CREATE TABLE public.member_documents(id uuid); ALTER TABLE public.membership_applications ENABLE ROW LEVEL SECURITY; ALTER TABLE public.member_documents ENABLE ROW LEVEL SECURITY;`);
  const updatesMigration = await readFile(new URL("../migrations/010_member_updates.sql", import.meta.url), "utf8");
  await db.exec(updatesMigration);
  await db.exec(updatesMigration);
  await db.exec(await readFile(new URL("010_member_updates.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../migrations/011_course_details_dates.sql", import.meta.url), "utf8"));
  const programsMigration = await readFile(new URL("../migrations/012_programs_dashboard_updates.sql", import.meta.url), "utf8");
  await db.exec(programsMigration);
  await db.exec(programsMigration);
  await db.exec(await readFile(new URL("012_program_publishing.sql", import.meta.url), "utf8"));
  const updateRepair = await readFile(new URL("../migrations/013_updates_storage_audit_permissions.sql", import.meta.url), "utf8");
  await db.exec(updateRepair);
  await db.exec(updateRepair);
  await db.exec(`BEGIN;
    INSERT INTO public.users(id,email,role,is_active) VALUES
      ('13000000-0000-0000-0000-000000000001','audit-admin@example.invalid','admin',true),
      ('13000000-0000-0000-0000-000000000002','audit-member@example.invalid','member',true);
    INSERT INTO public.audit_logs(action) VALUES ('repair test');
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','13000000-0000-0000-0000-000000000001',true);
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE action='repair test') THEN RAISE EXCEPTION 'Admin audit read failed'; END IF;
    END $$;
    SELECT set_config('request.jwt.claim.sub','13000000-0000-0000-0000-000000000002',true);
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM public.audit_logs) THEN RAISE EXCEPTION 'Member can read audit history'; END IF;
    END $$;
    RESET ROLE;
    ROLLBACK;`);
  const before = await db.query("SELECT count(*)::integer AS count FROM public.offerings");
  const expiryMigration = await readFile(new URL("../migrations/014_update_time_expiry.sql", import.meta.url), "utf8");
  await db.exec(expiryMigration);
  await db.exec(expiryMigration);
  await db.exec(await readFile(new URL("014_update_expiry.sql", import.meta.url), "utf8"));
  const dashboardMigration = await readFile(new URL("../migrations/015_unified_dashboard_programs.sql", import.meta.url), "utf8");
  await db.exec(dashboardMigration);
  await db.exec(dashboardMigration);
  await db.exec(await readFile(new URL("015_dashboard_registration.sql", import.meta.url), "utf8"));
  const dailyMigration=await readFile(new URL("../migrations/016_course_daily_tasks.sql",import.meta.url),"utf8");
  await db.exec(dailyMigration);
  await db.exec(dailyMigration);
  await db.exec(await readFile(new URL("016_daily_tasks.sql",import.meta.url),"utf8"));
  const remindersMigration=await readFile(new URL("../migrations/017_session_reminders.sql",import.meta.url),"utf8");
  await db.exec(remindersMigration);
  await db.exec(remindersMigration);
  await db.exec(await readFile(new URL("017_session_reminders.sql",import.meta.url),"utf8"));
  await db.exec("UPDATE public.offerings SET price = 12345 WHERE code = 'FSP-TTX'");
  await db.exec(migration);
  const after = await db.query("SELECT count(*)::integer AS count FROM public.offerings");
  const fee = await db.query("SELECT price FROM public.offerings WHERE code = 'FSP-TTX'");
  if (before.rows[0].count !== 10 || after.rows[0].count !== 10 || Number(fee.rows[0].price) !== 12345) {
    throw new Error("Catalog seed/re-run changed an administrator fee or duplicated records.");
  }
  console.log("PASS: authenticated profile/member/membership/notification reads, owner isolation, marking notifications read, enrollment, free registration, deduplication, fee snapshots, RLS, payment references, review permissions, correction/resubmission, approval, and migration re-run.");
} finally {
  await db.close();
}
