// Sign in only the explicitly configured disposable test accounts.
// Read their own role and storage listing; never log credentials or member data.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
if (existsSync('.env.test.local')) process.loadEnvFile('.env.test.local');
const roles = [['MEMBER', 'member'], ['ADMIN', 'admin'], ['SUPER_ADMIN', 'super_admin']];
const required = roles.flatMap(([name]) => [`FSP_TEST_${name}_EMAIL`, `FSP_TEST_${name}_PASSWORD`]);
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) {
  console.log(JSON.stringify({ status: 'BLOCKED', missing, action: 'Fill the ignored .env.test.local file with disposable test credentials. No sign-in requests were sent.' }, null, 2));
  process.exit(2);
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert(url && key, 'Public Supabase configuration is required');
assert(new URL(url).protocol === 'https:', 'Live tests require HTTPS');
const results = [];
for (const [name, expectedRole] of roles) {
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  let signedIn = false;
  try {
    const { data, error } = await client.auth.signInWithPassword({ email: process.env[`FSP_TEST_${name}_EMAIL`], password: process.env[`FSP_TEST_${name}_PASSWORD`] });
    assert(!error && data.user, `${expectedRole}: sign-in failed; check the configured test credentials or email confirmation`);
    signedIn = true;
    const { data: profile, error: profileError } = await client.from('users').select('role,is_active').eq('id', data.user.id).single();
    assert(!profileError && profile, `${expectedRole}: trusted profile read failed`);
    assert.equal(profile.role, expectedRole, `${expectedRole}: database role does not match the intended test role`);
    assert.notEqual(profile.is_active, false, `${expectedRole}: test account is disabled`);
    const { error: storageError } = await client.storage.from('program-flyers').list(data.user.id, { limit: 1 });
    assert(!storageError, `${expectedRole}: authenticated flyer storage listing failed`);
    results.push({ role: expectedRole, signIn: 'PASS', ownProfile: 'PASS', active: true, storageList: 'PASS' });
  } finally {
    if (signedIn) await client.auth.signOut({ scope: 'local' });
  }
}
console.log(JSON.stringify({ status: 'PASS', results, scope: 'Configured disposable accounts; authentication and read-only integration. No account creation, uploads, payments, notifications or emails were performed.' }, null, 2));
