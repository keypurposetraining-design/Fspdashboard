const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const React=require('react');
const wait=()=>new Promise(resolve=>setTimeout(resolve,15));
function harness() {
 let cursor=0,listener;const state=[],effects=[],calls={users:0,members:0,memberships:0,getSession:0};
 let resolveUser;
 const gate=new Promise(resolve=>{resolveUser=resolve;});
 const account={id:'test-user',email:'test@example.test',app_metadata:{},user_metadata:{}};
 const db={auth:{
  onAuthStateChange(callback){listener=callback;return{data:{subscription:{unsubscribe(){}}}};},
  getSession(){calls.getSession++;throw new Error('Duplicate initialization');},
  getUser:async()=>({data:{user:account}}),
  signInWithPassword:async()=>{listener('SIGNED_IN',{user:account});return{error:null,data:{user:account}};},
 },from(table){
  const query={select(){return query;},eq(){return query;},order(){return query;},limit(){return query;},maybeSingle(){
   calls[table]++;
   if(table==='users')return gate;
   if(table==='members')return Promise.resolve({data:{id:'member-id',avatar_url:null},error:null});
   return Promise.resolve({data:{status:'active',end_date:'2099-01-01'},error:null});
  }};return query;
 }};
 const mock={...React,createContext:()=>({Provider:()=>null}),useContext:()=>null,
  useState(initial){const i=cursor++;if(!(i in state))state[i]=typeof initial==='function'?initial():initial;return[state[i],v=>state[i]=typeof v==='function'?v(state[i]):v];},
  useRef(initial){const i=cursor++;if(!(i in state))state[i]={current:initial};return state[i];},
  useEffect(fn){effects.push(fn);}
 };
 const code=ts.transpileModule(fs.readFileSync('src/components/auth/AuthProvider.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const mod={exports:{}};
 new Function('require','exports','module',code)(name=>name==='react'?mock:name==='@/lib/supabase'?{createClient:()=>db}:name==='@/lib/activity-log'?{logMemberActivity:async()=>{}}:require(name),mod.exports,mod);
 function value(){cursor=0;return mod.exports.AuthProvider({children:null}).props.value;}
 const initial=value();const cleanup=effects[0]();
 return {initial,value,calls,account,emit:(event,session)=>listener(event,session),resolve:()=>resolveUser({data:{id:account.id,email:account.email,name:'Test Admin',role:'admin'},error:null}),cleanup};
}
test('SDK initial event is the only session bootstrap, with parallel independent profile queries',async()=>{
 const h=harness();h.emit('INITIAL_SESSION',{user:h.account});await wait();
 assert.equal(h.calls.getSession,0);assert.equal(h.calls.users,1);assert.equal(h.calls.members,1);
 assert.equal(h.value().loading,true);h.resolve();await wait();assert.equal(h.value().role,'admin');assert.equal(h.value().loading,false);assert.equal(h.calls.memberships,0);h.cleanup();
});
test('password sign-in and its auth event share concurrent lookups without permanently caching roles',async()=>{
 const h=harness();const login=h.initial.login('test@example.test','test-password');await wait();
 assert.equal(h.calls.users,1);assert.equal(h.calls.members,1);h.resolve();await login;await wait();
 assert.equal(h.value().user.id,h.account.id);assert.equal(h.value().role,'admin');
 await h.value().refreshUser();assert.equal(h.calls.users,2);assert.equal(h.calls.members,2);h.cleanup();
});
test('anonymous initial session exits loading without profile requests',()=>{
 const h=harness();h.emit('INITIAL_SESSION',null);assert.equal(h.value().loading,false);assert.equal(h.value().user,null);assert.equal(h.calls.users,0);h.cleanup();
});
