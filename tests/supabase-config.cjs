const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function check(env){
 const errors=[],logs=[];const context={require:name=>{assert.equal(name,'@next/env');return{loadEnvConfig(){}};},process:{env,exitCode:0,cwd:()=>'.'},console:{error:message=>errors.push(message),log:message=>logs.push(message)},URL};
 vm.runInNewContext(fs.readFileSync('scripts/check-env.cjs','utf8'),context);return{exitCode:context.process.exitCode,errors,logs};
}
test('missing production variables fail with actionable names and no prerender attempt',()=>{
 const result=check({});assert.equal(result.exitCode,1);assert.match(result.errors.join(' '),/NEXT_PUBLIC_SUPABASE_URL/);assert.match(result.errors.join(' '),/NEXT_PUBLIC_SUPABASE_ANON_KEY/);assert.match(result.errors.join(' '),/Vercel/);
});
test('example placeholders and invalid project URLs fail validation',()=>{
 assert.equal(check({NEXT_PUBLIC_SUPABASE_URL:'https://your-project.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'your-public-supabase-key'}).exitCode,1);
 assert.equal(check({NEXT_PUBLIC_SUPABASE_URL:'invalid-url',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test-key'}).exitCode,1);
});
test('configured production build passes without printing key values',()=>{
 const result=check({NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-test-key'});
 assert.equal(result.exitCode,0);assert.doesNotMatch([...result.logs,...result.errors].join(' '),/public-test-key/);
});
test('browser module imports without credentials and only constructs the client when requested',()=>{
 let calls=0;const env={};const processMock={env};const mod={exports:{}};
 const compiled=ts.transpileModule(fs.readFileSync('src/lib/supabase/client.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const fake={auth:{}};
 new Function('require','exports','module','process',compiled)(()=>({createBrowserClient:()=>{calls++;return fake;}}),mod.exports,mod,processMock);
 assert.equal(calls,0);assert.throws(()=>mod.exports.createClient(),/configuration is missing/);assert.equal(calls,0);
 env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';env.NEXT_PUBLIC_SUPABASE_ANON_KEY='public-test-key';
 assert.equal(mod.exports.createClient(),fake);assert.equal(calls,1);
});
