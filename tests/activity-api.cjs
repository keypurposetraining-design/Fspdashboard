const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(client) {
  const js = ts.transpileModule(fs.readFileSync('src/app/api/activity/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const mod = { exports: {} };
  const deps = {
    '@/lib/supabase/server': { createClient: client },
    'next/server': { NextResponse: { json: (body, options) => Response.json(body, options) } },
  };
  new Function('require', 'exports', 'module', js)(name => deps[name] || require(name), mod.exports, mod);
  return mod.exports.POST;
}
const request = body => new Request('http://localhost/api/activity', {
  method: 'POST', body, headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '192.0.2.1, 198.51.100.1' },
});
test('malformed activity input returns 400 without contacting the database', async () => {
  const post = load(() => { throw new Error('Must not contact database'); });
  for (const body of ['{', 'null', '[]', '{}', '{"action":42}', '{"action":" "}', JSON.stringify({ action: 'x'.repeat(256) }), '{"action":"AUTH_LOGIN","details":[]}']) {
    assert.equal((await post(request(body))).status, 400, body);
  }
});
test('failed login stores a bounded email and one proxy IP', async () => {
  let inserted;
  const post = load(async () => ({ from: () => ({ insert: async row => { inserted = row; return {}; } }) }));
  assert.equal((await post(request(JSON.stringify({ action: 'AUTH_LOGIN_FAILED', details: { email: 'x'.repeat(300) } })))).status, 200);
  assert.equal(inserted.ip_address, '192.0.2.1');
  assert.equal(inserted.metadata.email.length, 255);
});
test('anonymous callers cannot record authenticated events', async () => {
  const post = load(async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }));
  assert.equal((await post(request('{"action":"AUTH_LOGIN"}'))).status, 401);
});
