// Real browser against a localhost application and an isolated Supabase API fixture.
// Never accepts a production URL or real credentials. PostgreSQL policies are
// verified separately by database/tests/full-migrations.mjs.
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';

assert(process.argv[2], 'Pass the temporary playwright package directory');
const { chromium } = await import(pathToFileURL(resolve(process.argv[2], 'index.mjs')).href);
const next = resolve('node_modules/next/dist/bin/next');
const apiUrl = 'http://127.0.0.1:54329';
const appUrl = 'http://localhost:3130';
const now = new Date().toISOString();
const profiles = ['member', 'admin', 'super_admin'].map((role, i) => ({
  id: `31000000-0000-0000-0000-00000000000${i + 1}`, email: `${role}@example.invalid`,
  name: `Test ${role}`, role, is_active: true, created_at: now,
}));
const offering = { id: '31000000-0000-0000-0000-000000000010', code: 'TEST', title: 'Browser test program',
  description: 'Isolated browser fixture', kind: 'program', duration: 'One day', format: 'Online', price: 100,
  currency: 'INR', is_active: true, start_date: null, end_date: null, flyer_path: null };
const enrollment = { id: '31000000-0000-0000-0000-000000000020', offering_id: offering.id, member_id: profiles[0].id,
  amount: 100, currency: 'INR', status: 'payment_review', payment_reference: 'TEST-REFERENCE', receipt_path: null,
  review_note: null, created_at: now, offerings: offering, members: { first_name: 'Test', last_name: 'Member', user_id: profiles[0].id } };
const updates = [];
const calls = [];
const uploaded = [];
const failures = [];
let app, browser;
const authUser = p => ({ id: p.id, email: p.email, aud: 'authenticated', role: 'authenticated',
  created_at: now, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { name: p.name }, identities: [{ provider: 'email' }] });
function session(p) {
  const encode = data => Buffer.from(JSON.stringify(data)).toString('base64url');
  const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: p.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000), iss: `${apiUrl}/auth/v1` })}.test-signature`;
  return { access_token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: `test-${p.role}`, user: authUser(p) };
}
const api = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, apiUrl);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,HEAD,OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range');
    if (req.method === 'OPTIONS') { res.end(); return; }
    let raw = ''; for await (const chunk of req) raw += chunk;
    let body = {}; try { body = JSON.parse(raw || '{}'); } catch { /* multipart upload */ }
    const token = req.headers.authorization?.split(' ')[1];
    let sub; try { sub = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub; } catch { /* anonymous */ }
    const profile = profiles.find(p => p.id === sub) || profiles[0];
    const json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
    calls.push({ path: url.pathname, method: req.method, body });
    if (url.pathname === '/auth/v1/token') { json(session(profiles.find(p => p.email === body.email) || profile)); return; }
    if (url.pathname === '/auth/v1/user') { json(authUser(profile)); return; }
    if (url.pathname === '/auth/v1/logout') { json({}); return; }
    if (url.pathname.startsWith('/storage/v1/object/sign/')) { json({ signedURL: '/object/public/test.png' }); return; }
    if (url.pathname.startsWith('/storage/v1/object/') && req.method === 'POST') { uploaded.push(url.pathname); json({ Key: url.pathname }); return; }
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const name = url.pathname.split('/').at(-1);
      if (name === 'publish_member_update') { updates.push({ id: crypto.randomUUID(), title: body.p_title, message: body.p_message, is_published: true, created_at: now }); json(updates.at(-1).id); return; }
      if (name === 'save_program') { Object.assign(offering, body.p_values); json(offering.id); return; }
      if (name === 'review_enrollment_payment') { enrollment.status = body.p_approve ? 'active' : 'pending_payment'; json(enrollment); return; }
      if (name === 'set_user_role') { Object.assign(profiles.find(p => p.id === body.p_user_id), { role: body.p_role }); json({ success: true }); return; }
      if (name === 'admin_search_members') { json({ total: 0, rows: [] }); return; }
      if (name === 'admin_dashboard_stats') { json({ total_members: 1, membership: { active: 1 }, members_without_membership: 0, application: {}, documents: {}, expiring_30_days: 0 }); return; }
      json([]); return;
    }
    const table = url.pathname.split('/').at(-1);
    let data = [];
    if (table === 'users') {
      data = url.searchParams.has('id') ? [profile] : profiles;
      const roleFilter = url.searchParams.get('role'); if (roleFilter) data = data.filter(p => roleFilter.includes(p.role));
    }
    if (table === 'members') data = [{ id: profile.id, user_id: profile.id, first_name: 'Test', last_name: profile.role, avatar_url: null, created_at: now }];
    if (table === 'memberships') data = [{ id: profile.id, member_id: profile.id, status: 'active', start_date: '2026-01-01', end_date: '2030-01-01', created_at: now }];
    if (table === 'offerings') data = [offering];
    if (table === 'offering_enrollments') data = [enrollment];
    if (table === 'enrollment_payment_settings') data = [{ id: 1, instructions: 'TEST ONLY bank details' }];
    if (table === 'member_updates') data = updates;
    if (table === 'resources') data = [{ id: 'resource-test', title: 'Browser test resource', url: 'https://example.invalid/test.pdf', type: 'document', courses: { title: 'Test' } }];
    res.setHeader('Content-Range', `0-${Math.max(data.length - 1, 0)}/${data.length}`);
    if (req.method === 'HEAD') { res.end(); return; }
    if (req.headers.accept?.includes('vnd.pgrst.object+json')) json(data[0] || null); else json(data);
  } catch (error) { failures.push(String(error)); res.statusCode = 500; res.end('{}'); }
});
async function runNode(args, options = {}) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', ...options });
  const [code] = await once(child, 'exit'); assert.equal(code, 0, args.join(' '));
}
try {
  api.listen(54329, '127.0.0.1'); await once(api, 'listening');
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: apiUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'isolated-browser-test-key' };
  // The fixture build is local only. Rebuild with production settings before release.
  if (!process.argv.includes('--skip-build')) await runNode([next, 'build'], { env });
  app = spawn(process.execPath, [next, 'start', '--port', '3130'], { env, stdio: 'inherit' });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${appUrl}/login`)).ok) break; } catch { /* startup */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  try { browser = await chromium.launch({ headless: true }); }
  catch { browser = await chromium.launch({ headless: true, channel: 'msedge' }); }
  async function signIn(role) {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    await context.route('**/*', route => {
      const host = new URL(route.request().url()).hostname;
      if (['localhost', '127.0.0.1'].includes(host)) return route.continue();
      if (host === 'example.invalid') return route.fulfill({ body: 'Isolated test download', contentType: 'text/plain' });
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => failures.push(`${role}: ${error.message}`));
    await page.goto(`${appUrl}/login`);
    await page.getByLabel('Email', { exact: false }).fill(`${role}@example.invalid`);
    await page.getByLabel('Password', { exact: true }).fill('isolated-test-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/login'));
    await page.getByRole('main').getByRole('status', { name: 'Loading', exact: true }).waitFor({ state: 'hidden' });
    return { context, page };
  }
  const member = await signIn('member');
  for (const path of ['/profile', '/events', '/tasks', '/payments', '/certificates', '/community', '/resources', '/settings']) {
    await member.page.goto(`${appUrl}${path}`);
    await member.page.getByRole('main').waitFor();
    await member.page.waitForLoadState('networkidle');
    assert(!await member.page.getByText('Access Denied', { exact: true }).count(), path);
  }
  await member.page.goto(`${appUrl}/resources`);
  const popupPromise = member.page.waitForEvent('popup');
  await member.page.getByRole('button', { name: 'Download File' }).click();
  const popup = await popupPromise; await popup.waitForURL('https://example.invalid/test.pdf'); await popup.close();
  await member.page.goto(`${appUrl}/super-admin/admins`);
  assert.equal(new URL(member.page.url()).pathname, '/admin/unauthorized');
  await member.context.close();

  const admin = await signIn('admin');
  await admin.page.goto(`${appUrl}/admin/updates`);
  await admin.page.getByLabel('Update title').fill('Isolated browser announcement');
  await admin.page.getByLabel('Program details / message').fill('Test only — no production notifications.');
  await admin.page.getByRole('button', { name: 'Publish to all members' }).click();
  await admin.page.getByRole('status').filter({ hasText: 'Published on every member dashboard' }).waitFor();
  await admin.page.goto(`${appUrl}/admin/courses`);
  await admin.page.getByRole('button', { name: 'Upload image', exact: true }).waitFor();
  await admin.page.getByLabel('Choose a program image').setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64') });
  await admin.page.getByText('Image uploaded. Save the program to publish it.', { exact: true }).waitFor();
  assert.equal(uploaded.length, 1);
  await admin.page.getByRole('button', { name: 'Update & publish', exact: true }).click();
  await admin.page.getByText('Program updated in the catalog and member dashboard updates.', { exact: true }).waitFor();
  assert(offering.flyer_path);
  await admin.page.getByLabel('I verified receipt of', { exact: false }).check();
  await admin.page.getByRole('button', { name: 'Approve & activate', exact: true }).click();
  await admin.page.getByText('No enrollments in this category.', { exact: true }).waitFor();
  assert.equal(enrollment.status, 'active');
  await admin.page.goto(`${appUrl}/super-admin/admins`);
  assert.equal(new URL(admin.page.url()).pathname, '/admin');
  await admin.context.close();

  const superAdmin = await signIn('super_admin');
  for (const path of ['/super-admin/admins', '/super-admin/users', '/admin/courses', '/admin/updates', '/admin/content', '/admin/resources', '/admin/tasks', '/admin/events', '/admin/member-logs']) {
    await superAdmin.page.goto(`${appUrl}${path}`);
    await superAdmin.page.waitForLoadState('networkidle');
    assert(!await superAdmin.page.getByText('Access Denied', { exact: true }).count(), path);
  }
  await superAdmin.page.goto(`${appUrl}/super-admin/admins`);
  await superAdmin.page.getByRole('heading', { name: 'Admin Management' }).waitFor();
  await superAdmin.page.screenshot({ path: resolve(tmpdir(), 'fsp-admin-browser-check.png'), fullPage: true });
  await superAdmin.page.setViewportSize({ width: 390, height: 844 });
  assert(await superAdmin.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile admin page must not overflow horizontally');
  await superAdmin.page.getByRole('button', { name: 'Open menu', exact: true }).click();
  await superAdmin.page.getByRole('link', { name: 'User Management', exact: true }).click();
  await superAdmin.page.getByRole('button', { name: 'Change role or access for member@example.invalid', exact: true }).click();
  await superAdmin.page.getByLabel('New role', { exact: false }).selectOption('admin');
  await superAdmin.page.getByRole('button', { name: 'Save change', exact: true }).click();
  await superAdmin.page.getByRole('alert').filter({ hasText: 'Please give a reason' }).waitFor();
  assert.equal(profiles[0].role, 'member', 'A missing reason must not change the role');
  await superAdmin.page.getByLabel('Reason for this change', { exact: false }).fill('Isolated test promotion');
  await superAdmin.page.getByRole('button', { name: 'Save change', exact: true }).click();
  await superAdmin.page.getByRole('dialog').waitFor({ state: 'hidden' });
  assert.equal(profiles[0].role, 'admin');
  await superAdmin.page.screenshot({ path: resolve(tmpdir(), 'fsp-mobile-browser-check.png'), fullPage: true });
  const cookie = (await superAdmin.context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
  const timings = []; let sent = 0;
  await Promise.all(Array.from({ length: 10 }, async () => {
    while (sent < 100) {
      sent++;
      const start = performance.now();
      const response = await fetch(`${appUrl}/admin/courses`, { headers: { cookie }, redirect: 'manual', signal: AbortSignal.timeout(15000) });
      await response.arrayBuffer(); assert.equal(response.status, 200);
      timings.push(performance.now() - start);
    }
  }));
  timings.sort((a, b) => a - b);
  console.log('Authenticated local HTTP load:', JSON.stringify({ requests: 100, concurrency: 10, p95Ms: Math.round(timings[94]), backend: 'isolated fixture, not real Supabase capacity' }));
  await superAdmin.context.close();
  assert.deepEqual(failures, []);
  console.log(JSON.stringify({ result: 'PASS', roles: 3, browser: 'Chromium', workflows: ['email sign-in', 'role-gated navigation', 'member resources', 'announcement publishing', 'image upload', 'program save', 'payment approval', 'legacy content screens', 'admin tables'], apiCalls: calls.length, fixtureOnly: true }, null, 2));
} finally {
  await browser?.close();
  app?.kill();
  api.closeAllConnections();
  await new Promise(resolve => api.close(resolve));
}
