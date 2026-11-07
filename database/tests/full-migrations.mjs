import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

assert(process.argv[2], 'Pass the directory containing the PGlite package');
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], 'dist/index.js')).href);
const db = new PGlite();
let phase = 'fixture setup';
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE SCHEMA storage;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$ SELECT current_user::text $$;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}', raw_app_meta_data jsonb DEFAULT '{}', created_at timestamptz DEFAULT now(), last_sign_in_at timestamptz, deleted_at timestamptz, is_anonymous boolean DEFAULT false);
    CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    CREATE TABLE storage.objects(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1, '/') $$;
    GRANT USAGE ON SCHEMA auth, storage, public TO anon, authenticated, service_role;
    GRANT SELECT, INSERT, DELETE ON storage.objects TO authenticated;
  `);
  phase = 'historical base schema';
  const base = (await readFile('database/supabase_migrations.sql', 'utf8'))
    .replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', '-- UUID helper supplied by isolated fixture');
  await db.exec(base);
  const migrations = (await readdir('database/migrations')).filter(name => /^\d/.test(name) && !name.startsWith('000')).sort();
  for (const file of migrations) {
    phase = file;
    const sql = await readFile(`database/migrations/${file}`, 'utf8');
    await db.exec(sql);
    await db.exec(sql);
    if (file.startsWith('019')) {
      phase = '019 organization access tests';
      await db.exec(await readFile('database/tests/019_org_foundation.sql', 'utf8'));
    }
    if (file.startsWith('020')) {
      phase = '020 membership permissions tests';
      await db.exec(await readFile('database/tests/020_admin_membership_permissions.sql', 'utf8'));
    }
    if (file.startsWith('021')) {
      phase = '021 retired organization permissions tests';
      await db.exec(await readFile('database/tests/021_retire_organizations.sql', 'utf8'));
    }
  }
  phase = 'trusted role management';
  await db.exec(`BEGIN;
    INSERT INTO auth.users(id,email) VALUES
      ('24000000-0000-0000-0000-000000000001','role-owner@example.invalid'),
      ('24000000-0000-0000-0000-000000000002','role-member@example.invalid');
    UPDATE public.users SET role='super_admin' WHERE id='24000000-0000-0000-0000-000000000001';
    SET LOCAL ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub','24000000-0000-0000-0000-000000000002',true);
    DO $$ BEGIN
      BEGIN
        PERFORM public.set_user_role('24000000-0000-0000-0000-000000000002','admin',true,'forbidden promotion');
        RAISE EXCEPTION 'Member promoted their own role';
      EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    END $$;
    SELECT set_config('request.jwt.claim.sub','24000000-0000-0000-0000-000000000001',true);
    SELECT public.set_user_role('24000000-0000-0000-0000-000000000002','admin',true,'isolated admin promotion');
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.users WHERE id='24000000-0000-0000-0000-000000000002' AND role='admin') THEN
        RAISE EXCEPTION 'Super admin promotion failed';
      END IF;
      BEGIN
        PERFORM public.set_user_role('24000000-0000-0000-0000-000000000001','member',true,'last super demotion');
        RAISE EXCEPTION 'Last super admin was removed';
      EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    END $$;
    RESET ROLE;
    ROLLBACK;`);
  const keys = (await db.query("SELECT conname FROM pg_constraint WHERE contype='f' AND conrelid IN ('public.members'::regclass, 'public.community_posts'::regclass)")).rows.map(row => row.conname);
  assert(keys.includes('members_user_id_fkey') && keys.includes('community_posts_user_id_fkey'), 'Explicit user joins must match actual schema constraints');
  console.log('PASS: schema and all migrations 001–023, repeat application, organization/membership/retired-feature access, role promotion restrictions, and last-super-admin protection.');
} catch (error) {
  console.error('Database verification phase:', phase);
  throw error;
} finally { await db.close(); }
