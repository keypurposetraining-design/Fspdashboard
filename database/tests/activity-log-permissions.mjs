import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

assert(process.argv[2], 'Pass the directory containing the PGlite package');
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], 'dist/index.js')).href);
const db = new PGlite();
try {
  const base = await readFile('database/supabase_migrations.sql', 'utf8');
  // Exercise the actual base table/policies, with isolated auth helpers.
  const activity = base.slice(base.indexOf('CREATE TABLE IF NOT EXISTS public.member_activity_logs'), base.indexOf('-- Event fees & configurable'));
  await db.exec(`
    CREATE ROLE authenticated; CREATE ROLE anon;
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
    CREATE FUNCTION public.uuid_generate_v4() RETURNS uuid LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;
    CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE TABLE public.members(id uuid PRIMARY KEY);
    GRANT USAGE ON SCHEMA auth, public TO authenticated, anon;
    ${activity}
    INSERT INTO auth.users VALUES ('23000000-0000-0000-0000-000000000001'), ('23000000-0000-0000-0000-000000000002');
  `);
  for (const name of ['022_failed_login_log_permissions.sql', '023_authenticated_activity_log_permissions.sql']) {
    const migration = await readFile(`database/migrations/${name}`, 'utf8');
    await db.exec(migration); await db.exec(migration);
  }
  await db.exec(`
    SET ROLE authenticated;
    SELECT set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000001', false);
    INSERT INTO public.member_activity_logs(user_id, action) VALUES (auth.uid(), 'AUTH_LOGIN');
  `);
  assert.equal((await db.query('SELECT * FROM public.member_activity_logs')).rows.length, 1);
  await assert.rejects(db.exec(`INSERT INTO public.member_activity_logs(user_id, action) VALUES ('23000000-0000-0000-0000-000000000002', 'AUTH_LOGIN')`));
  await assert.rejects(db.exec(`UPDATE public.member_activity_logs SET action = 'changed'`));
  await assert.rejects(db.exec('DELETE FROM public.member_activity_logs'));
  await db.exec(`SELECT set_config('request.jwt.claim.sub', '23000000-0000-0000-0000-000000000002', false)`);
  assert.equal((await db.query('SELECT * FROM public.member_activity_logs')).rows.length, 0);
  await db.exec(`RESET ROLE; SET ROLE anon;
    INSERT INTO public.member_activity_logs(action) VALUES ('AUTH_LOGIN_FAILED');`);
  await assert.rejects(db.exec('SELECT * FROM public.member_activity_logs'));
  await assert.rejects(db.exec(`INSERT INTO public.member_activity_logs(action) VALUES ('AUTH_LOGIN')`));
  console.log('PASS: activity logging grants, owner isolation, anonymous restrictions, no edits/deletes, and idempotent migrations.');
} finally { await db.close(); }
