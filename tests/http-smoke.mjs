import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

// This suite deliberately refuses remote targets and never writes database data.
const base = new URL(process.env.TEST_BASE_URL || 'http://localhost:3100');
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Load tests require a local server');
const publicPaths = ['/login', '/signup', '/forgot-password', '/about', '/privacy', '/terms'];
async function request(path, options = {}) {
  const response = await fetch(new URL(path, base), {
    redirect: 'manual', signal: AbortSignal.timeout(15000), ...options,
  });
  await response.arrayBuffer();
  return response;
}
for (const path of publicPaths) assert.equal((await request(path)).status, 200, path);
for (const path of ['/dashboard', '/profile', '/admin', '/admin/courses', '/super-admin', '/super-admin/admins']) {
  const response = await request(path);
  assert.equal(response.status, 307, path);
  assert(new URL(response.headers.get('location'), base).pathname === '/login', path);
}
for (const path of ['/api/admin/members', '/api/auth/sync']) {
  assert.equal((await request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401, path);
}
const durations = [];
let next = 0;
const started = performance.now();
await Promise.all(Array.from({ length: 10 }, async () => {
  while (next < 200) {
    const index = next++;
    const start = performance.now();
    assert.equal((await request(publicPaths[index % publicPaths.length])).status, 200);
    durations.push(performance.now() - start);
  }
}));
durations.sort((a, b) => a - b);
console.log(JSON.stringify({ result: 'PASS', requests: durations.length, concurrency: 10,
  elapsedMs: Math.round(performance.now() - started),
  p50Ms: Math.round(durations[Math.ceil(durations.length * .5) - 1]),
  p95Ms: Math.round(durations[Math.ceil(durations.length * .95) - 1]),
  maxMs: Math.round(durations.at(-1)),
  scope: 'Local public pages, anonymous route/API protection; no authenticated capacity claim',
}, null, 2));
