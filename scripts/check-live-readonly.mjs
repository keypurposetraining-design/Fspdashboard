// Read-only production integration audit. Never logs keys, user records or files.
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
assert(base && key, 'Public Supabase URL/key must be configured locally');
const url = new URL(base);
assert(url.protocol === 'https:' && url.hostname.endsWith('.supabase.co'), 'This audit requires the configured Supabase HTTPS project');
if (key.startsWith('eyJ')) {
  const claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());
  assert.equal(claims.role, 'anon', 'This check must use an anonymous public key');
} else assert(key.startsWith('sb_publishable_'), 'This check requires a public publishable key');

const website = 'https://fspcommunitydashboard.vercel.app';
const html = await (await fetch(`${website}/login`, { signal: AbortSignal.timeout(15000) })).text();
const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]))];
let matchingUrl = false, matchingKey = false;
for (const path of scripts) {
  const target = new URL(path.replaceAll('&amp;', '&'), website);
  if (target.origin !== website) continue;
  const source = await (await fetch(target, { signal: AbortSignal.timeout(15000) })).text();
  matchingUrl ||= source.includes(base);
  matchingKey ||= source.includes(key);
}
assert(matchingUrl && matchingKey, 'Local public configuration could not be matched to the deployed application; no Supabase probes were sent');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const results = [];
async function probe(path, options = {}) {
  const response = await fetch(new URL(path, base), { headers, signal: AbortSignal.timeout(15000), ...options });
  let body; try { body = await response.json(); } catch { body = null; }
  return { response, body };
}
const settings = await probe('/auth/v1/settings');
assert.equal(settings.response.status, 200, 'Authentication settings endpoint must be reachable');
results.push({ check: 'Authentication configuration', status: 'PASS',
  emailEnabled: settings.body.external?.email === true,
  googleEnabled: settings.body.external?.google === true,
  emailAutoConfirm: settings.body.mailer_autoconfirm === true,
  note: 'Provider configuration is visible; this does not test actual sign-in or email delivery' });
const oauth = await fetch(new URL(`/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${website}/auth/callback`)}`, base), {
  headers, redirect: 'manual', signal: AbortSignal.timeout(15000),
});
const destination = oauth.headers.get('location');
const startsGoogle = [302, 303, 307].includes(oauth.status) && destination && new URL(destination).hostname === 'accounts.google.com';
results.push({ check: 'Google authorization start', httpStatus: oauth.status, status: startsGoogle ? 'PASS' : 'FAIL',
  outcome: startsGoogle ? 'Redirects to Google; no Google login performed' : 'Google authorization did not start' });
for (const table of ['users', 'members', 'memberships', 'payments', 'member_activity_logs', 'audit_logs', 'member_documents', 'membership_applications', 'offering_enrollments']) {
  const { response, body } = await probe(`/rest/v1/${table}?select=id&limit=1`);
  const denied = [401, 403].includes(response.status);
  const empty = response.status === 200 && Array.isArray(body) && body.length === 0;
  results.push({ check: `Anonymous read: ${table}`, httpStatus: response.status, status: denied || empty ? 'PASS' : 'FAIL',
    outcome: denied ? 'Denied' : empty ? 'No rows visible' : 'Unexpected access or configuration error' });
}
for (const bucket of ['program-flyers', 'task-submissions', 'member-documents']) {
  const { response, body } = await probe(`/storage/v1/object/list/${bucket}`, {
    method: 'POST', headers, body: JSON.stringify({ prefix: '', limit: 1, offset: 0 }),
  });
  const denied = [400, 401, 403, 404].includes(response.status);
  const empty = response.status === 200 && Array.isArray(body) && body.length === 0;
  results.push({ check: `Anonymous storage listing: ${bucket}`, httpStatus: response.status,
    status: denied || empty ? 'PASS' : 'FAIL', outcome: denied ? 'Denied or bucket unavailable' : empty ? 'No objects visible' : 'Unexpected visible objects' });
}
console.log(JSON.stringify({ configurationMatchesDeployment: true, results,
  limits: 'Anonymous empty responses do not prove the tables contain data. No authenticated writes, provider login, email delivery or capacity tests are performed.' }, null, 2));
assert(results.every(result => result.status === 'PASS'), 'Some read-only checks failed; review the sanitized results');
