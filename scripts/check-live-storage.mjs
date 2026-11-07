// Creates only one tiny temporary object in the configured disposable member's
// own task-submissions folder. No task, payment or announcement is submitted.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
process.loadEnvFile('.env.test.local');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const anonymous = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64');
let path, uploaded = false;
const results = {};
try {
  const login = await client.auth.signInWithPassword({ email: process.env.FSP_TEST_MEMBER_EMAIL, password: process.env.FSP_TEST_MEMBER_PASSWORD });
  assert(!login.error && login.data.user, 'Disposable member sign-in failed');
  const { data: profile, error: profileError } = await client.from('users').select('role,is_active').eq('id', login.data.user.id).single();
  assert(!profileError && profile.role === 'member' && profile.is_active !== false, 'An active disposable Member is required');
  path = `${login.data.user.id}/fsp-qa-${randomUUID()}.png`;
  const upload = await client.storage.from('task-submissions').upload(path, bytes, { contentType: 'image/png', upsert: false });
  assert(!upload.error, `Test upload failed: ${upload.error?.message ?? ''}`);
  uploaded = true; results.upload = 'PASS';
  const download = await client.storage.from('task-submissions').download(path);
  assert(!download.error && download.data, 'Authenticated file download failed');
  assert.deepEqual(Buffer.from(await download.data.arrayBuffer()), bytes, 'Downloaded bytes differ');
  results.authenticatedDownload = 'PASS';
  const signed = await client.storage.from('task-submissions').createSignedUrl(path, 60);
  assert(!signed.error && signed.data?.signedUrl, 'Signed URL creation failed');
  const signedResponse = await fetch(signed.data.signedUrl, { signal: AbortSignal.timeout(15000) });
  assert(signedResponse.ok, 'Signed download request failed');
  assert.deepEqual(Buffer.from(await signedResponse.arrayBuffer()), bytes, 'Signed download bytes differ');
  results.signedDownload = 'PASS';
  const denied = await anonymous.storage.from('task-submissions').download(path);
  assert(denied.error && !denied.data, 'Anonymous access unexpectedly returned the private object');
  results.anonymousReadDenied = 'PASS';
} finally {
  if (uploaded) {
    const removed = await client.storage.from('task-submissions').remove([path]);
    assert(!removed.error && removed.data?.some(item => item.name === path), 'Temporary object cleanup failed; review the test folder');
    const gone = await client.storage.from('task-submissions').download(path);
    assert(gone.error && !gone.data, 'Temporary object remains accessible after removal');
    results.temporaryObjectRemoved = 'PASS';
  }
  await client.auth.signOut({ scope: 'local' });
}
console.log(JSON.stringify({ status: 'PASS', bucket: 'task-submissions', results, scope: 'One generated test image only; no task submission or member business record changed' }, null, 2));
