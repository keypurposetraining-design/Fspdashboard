// Component behavior tests use an isolated auth stub: no accounts or emails are created.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
function harness(result = { needsEmailConfirmation: true }, failure, page = "signup") {
  let values = [], cursor = 0;
  const calls = [], redirects = [];
  const mockReact = { ...React, useEffect() {}, useState(initial) {
    const index = cursor++;
    if (!(index in values)) values[index] = initial;
    return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }];
  }};
  const action = async (...args) => { calls.push(args); if (failure) throw failure; return result; };
  const auth = { signUp: action, login: action, loginWithGoogle: action, loading: false, user: null };
  const compiled = ts.transpileModule(fs.readFileSync(`src/app/${page}/page.tsx`,'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true }
  }).outputText;
  const mod = {exports:{}};
  const requireStub = name => {
    if (name === 'react') return mockReact;
    if (name === 'react/jsx-runtime') return require(name);
    if (name.includes('AuthProvider')) return { useAuth: () => auth };
    if (name === 'next/navigation') return { useRouter: () => ({replace:path=>redirects.push(path)}) };
    if (name === 'next/link') return {__esModule:true,default: 'a'};
    return new Proxy({}, { get: (_,key) => String(key) });
  };
  new Function('require','module','exports','window',compiled)(requireStub,mod,mod.exports,{location:{replace:path=>redirects.push(path)}});
  function render() {cursor=0; return mod.exports.default();}
  function all(node, predicate, found=[]) {
    if (!node || typeof node !== 'object') return found;
    if (Array.isArray(node)) {node.forEach(n=>all(n,predicate,found));return found;}
    if (predicate(node)) found.push(node);
    all(node.props?.children,predicate,found);return found;
  }
  const find = predicate => all(render(),predicate)[0];
  function fill(id,value) { const field=find(n=>n.props?.id===id && n.props?.onChange); assert.ok(field,`field ${id}`);field.props.onChange({target:{value}}); }
  function valid() {fill('name','  Test Member  ');fill('email',' TEST@EXAMPLE.COM ');fill('password','Test-only-pass123');fill('confirm-password','Test-only-pass123');}
  async function submit() {await find(n=>n.type==='form').props.onSubmit({preventDefault(){}});}
  const text = node => { if (node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);if(Array.isArray(node))return node.map(text).join('');return text(node.props?.children);};
  return {fill,valid,submit,calls,redirects,find,text:()=>text(render())};
}
test('sign-up requires name and validates password length and confirmation before contacting auth',async()=>{
  const h=harness();await h.submit();assert.match(h.text(),/Enter your full name/);assert.equal(h.calls.length,0);
  h.fill('name','Test Member');h.fill('password','short');await h.submit();assert.match(h.text(),/at least 8/);assert.equal(h.calls.length,0);
  h.valid();h.fill('confirm-password','Different123');await h.submit();assert.match(h.text(),/Passwords do not match/);assert.equal(h.calls.length,0);
});
test('sign-up normalizes name/email, preserves password and shows email confirmation without redirect',async()=>{
  const h=harness();h.valid();await h.submit();assert.deepEqual(h.calls,[['test@example.com','Test-only-pass123','Test Member']]);
  assert.match(h.text(),/check your inbox and spam folder/);assert.deepEqual(h.redirects,[]);assert.equal(h.find(n=>n.type==='form'),undefined);
});
test('immediate authenticated registration redirects to dashboard',async()=>{
  const h=harness({needsEmailConfirmation:false});h.valid();await h.submit();assert.deepEqual(h.redirects,['/dashboard']);
});
test('existing account errors use the same confirmation flow',async()=>{
  const h=harness(undefined,new Error('User already registered'));h.valid();await h.submit();assert.match(h.text(),/check your inbox and spam folder/);assert.deepEqual(h.redirects,[]);
});
test('rate limit and network failures allow retry and do not redirect',async()=>{
  for(const [failure,message] of [['email rate limit exceeded',/Too many attempts/],['fetch failed',/could not create/]]){
    const h=harness(undefined,new Error(failure));h.valid();await h.submit();assert.match(h.text(),message);
    assert.equal(h.find(n=>n.props?.type==='submit').props.disabled,false);assert.deepEqual(h.redirects,[]);
  }
});

test('login footer points to signup and has no admin login link',()=>{
  const h=harness(undefined,undefined,'login');
  assert.ok(h.find(n=>n.props?.href==='/signup'));
  assert.equal(h.find(n=>n.props?.href==='/login/admin'),undefined);
});
test('email sign-in submits credentials and gives useful authentication errors',async()=>{
  for (const failure of [undefined,new Error('Invalid login credentials'),new Error('Email not confirmed')]) {
    const h=harness(undefined,failure,'login');h.fill('email','test@example.com');h.fill('password','Test-only-pass123');await h.submit();
    assert.deepEqual(h.calls,[['test@example.com','Test-only-pass123']]);
    if(failure)assert.match(h.text(),failure.message.includes('Invalid')?/Invalid email or password/:/Confirm your email/);
    assert.equal(h.find(n=>n.props?.type==='submit').props.disabled,false);
  }
});
