const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(path, deps) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const mod = { exports: {} };
  new Function('require', 'exports', 'module', code)(name => name in deps ? deps[name] : require(name), mod.exports, mod);
  return mod.exports;
}
function find(node, check) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node)) { for (const child of node) { const found = find(child, check); if (found) return found; } return null; }
  return check(node) ? node : find(node.props?.children, check);
}
function harness(role = 'admin', providers = ['email'], failure) {
  let cursor = 0, capturedLoader;
  const state = [], updates = [], notifications = [];
  let logoutOpened = false;
  const mockReact = { ...React, useState(initial) {
    const i = cursor++;
    if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial;
    return [state[i], v => { state[i] = typeof v === 'function' ? v(state[i]) : v; }];
  }};
  const signIn = { providers, hasPassword: providers.includes('email'), usesGoogle: providers.includes('google') };
  const button = ({ children, icon, variant, size, ...props }) => React.createElement('button', props, children);
  const link = ({ children, href }) => React.createElement('a', { href }, children);
  const deps = {
    react: mockReact,
    '@/components/auth/AuthProvider': { useAuth: () => ({ user: { id: 'current-user', name: 'Test Admin', email: 'admin@example.test' }, role,
      updatePassword: async password => { updates.push(password); if (failure) throw failure; } }) },
    '@/components/shell/AppShell': { useShell: () => ({ openLogout: () => { logoutOpened = true; } }) },
    '@/lib/supabase/client': { createClient: () => ({ auth: { getUser: async () => ({ data: { user: { identities: providers.map(provider => ({ provider })), app_metadata: { providers } } }, error: null }) } }) },
    '@/lib/useAsync': { useAsync: loader => { capturedLoader = loader; return { data: { signIn, memberNumber: 'FSP-001' }, loading: false, error: null, reload() {} }; } },
    '@/lib/data/member': { getMyProfile: async () => ({ member_number: 'FSP-001' }) },
    '@/lib/data/errors': { DataError: Error },
    '@/lib/status': { ROLE_LABEL: { admin: 'Admin', super_admin: 'Super admin', member: 'Member' } },
    '@/components/ui/PageHeader': {
      PageHeader: ({ title, actions }) => React.createElement('header', null, React.createElement('h1', null, title), actions),
      Section: ({ title, children }) => React.createElement('section', null, React.createElement('h2', null, title), children),
      DescriptionList: ({ items }) => React.createElement('div', null, items.map(item => React.createElement('div', { key: item.label }, item.label, ': ', item.value))),
    },
    '@/components/ui/States': { ErrorState: () => null, LoadingState: () => null },
    '@/components/ui/StatusBadge': { Pill: ({ children }) => React.createElement('span', null, children) },
    '@/components/ui/Form': { TextField: () => null },
    '@/components/ui/Button': { Button: button },
    '@/components/ui/Toast': { useToast: () => (...args) => notifications.push(args) },
    '@/components/member/LinkButton': { LinkButton: link },
  };
  const Page = load('src/app/(member)/settings/page.tsx', deps).default;
  function pageTree() { cursor = 0; return Page(); }
  function formTree() { cursor = 0; const form = find(pageTree(), node => typeof node.type === 'function' && node.type.name === 'PasswordForm'); return form?.type(); }
  function fill(label, value) { find(formTree(), n => n.props?.label === label).props.onChange({ target: { value } }); }
  return { pageTree, formTree, fill, updates, notifications, signIn, render: () => { cursor = 0; return renderToStaticMarkup(React.createElement(Page)); }, loader: () => capturedLoader(), logoutOpened: () => logoutOpened };
}
test('admin and super-admin account pages offer correct profile links and no member-only/unfinished sections', () => {
  for (const role of ['admin', 'super_admin']) {
    const h = harness(role); const html = h.render();
    assert.match(html, /Account settings/); assert.match(html, /Name: Test Admin/);
    assert.match(html, /href="\/admin\/account\/profile\/edit"/); assert.match(html, /href="\/admin\/account\/profile"/);
    assert.doesNotMatch(html, /Member number|Notifications|preferences|Organizations/);
  }
});
test('member settings retain membership number and member profile links', () => {
  const h = harness('member'); const html = h.render();
  assert.match(html, /Member number: FSP-001/); assert.match(html, /href="\/profile\/edit"/);
});
test('Google-only account explains provider-managed password and exposes no password form', async () => {
  const h = harness('admin', ['google']); const html = h.render();
  assert.match(html, /password is managed by your Google account/); assert.equal(h.formTree(), undefined);
  const data = await h.loader(); assert.equal(data.signIn.hasPassword, false); assert.equal(data.signIn.usesGoogle, true);
});
test('password form blocks short and mismatched passwords before contacting authentication', async () => {
  const h = harness(); h.fill('New password', 'short'); h.fill('Confirm new password', 'short');
  await h.formTree().props.onSubmit({ preventDefault() {} }); assert.equal(h.updates.length, 0);
  assert.match(find(h.formTree(), n => n.props?.label === 'New password').props.error, /8 characters/);
  h.fill('New password', 'Test-only-pass123'); h.fill('Confirm new password', 'Mismatch123');
  await h.formTree().props.onSubmit({ preventDefault() {} }); assert.equal(h.updates.length, 0);
  assert.match(find(h.formTree(), n => n.props?.label === 'Confirm new password').props.error, /don't match/);
});
test('valid password update clears fields and confirms success using an isolated auth stub', async () => {
  const h = harness(); h.fill('New password', 'Test-only-pass123'); h.fill('Confirm new password', 'Test-only-pass123');
  await h.formTree().props.onSubmit({ preventDefault() {} }); assert.deepEqual(h.updates, ['Test-only-pass123']);
  assert.equal(find(h.formTree(), n => n.props?.label === 'New password').props.value, '');
  assert.deepEqual(h.notifications, [['Password updated']]);
});
test('session control opens sign-out confirmation', () => {
  const h = harness(); find(h.pageTree(), n => n.props?.children === 'Log out').props.onClick(); assert.equal(h.logoutOpened(), true);
});
test('all navigation groups omit Organizations', () => {
  const nav = load('src/components/shell/nav.ts', {});
  for (const role of ['member', 'trainer', 'admin', 'super_admin']) {
    assert.ok(!nav.groupsForRole(role).flatMap(g => g.links).some(link => link.href.startsWith('/organizations')));
  }
});
