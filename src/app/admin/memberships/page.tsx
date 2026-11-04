"use client";
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { membershipExpiry, todayDate, daysRemaining, csvCell } from '@/lib/membership-dates';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { MembershipUsersTable, type MembershipUserRow as Row } from '@/components/admin/MembershipUsersTable';
interface History {
  memberships:{id:string;start_date:string;end_date:string;status:string}[];
  logins:{id:string;action:string;created_at:string;metadata:{provider?:string}}[];
  changes:{action:string;performed_at:string;admin_name:string;admin_email:string;details:{reason?:string}}[];
}
const label = (s:string) => s==='none' ? 'No membership assigned' : s.charAt(0).toUpperCase()+s.slice(1);
const time = (s:string|null) => s ? new Date(s).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}) : 'Never';
const soon = (r:Row) => r.status==='active' && daysRemaining(r.end_date)!>=0 && daysRemaining(r.end_date)!<=30 && r.end_date!==null;
export default function AdminMemberships() {
  const [db] = useState(()=>createClient());
  const [rows,setRows]=useState<Row[]>([]), [loading,setLoading]=useState(true), [error,setError]=useState(''), [notice,setNotice]=useState('');
  const [search,setSearch]=useState(''), [filter,setFilter]=useState('all'), [page,setPage]=useState(1);
  const [editor,setEditor]=useState<{user:Row;renew:boolean}|null>(null);
  const [start,setStart]=useState(''), [status,setStatus]=useState('active'), [reason,setReason]=useState(''), [saving,setSaving]=useState(false), [formError,setFormError]=useState('');
  const [detail,setDetail]=useState<Row|null>(null), [history,setHistory]=useState<History|null>(null), [historyError,setHistoryError]=useState('');
  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try {
      const {data,error}=await db.rpc('admin_membership_users');
      if(error) throw error; setRows(data??[]);
    } catch(e) { setError(`Could not load users: ${(e as Error).message}. If the function is missing, apply migration 020_admin_membership_management.sql.`); }
    finally {setLoading(false);}
  },[db]);
  useEffect(()=>{const timer=setTimeout(()=>{void load();},0);return()=>clearTimeout(timer);},[load]);
  useEffect(()=>{
    if(!detail)return;let active=true;
    db.rpc('admin_membership_history',{p_user_id:detail.user_id}).then(({data,error})=>{
      if(!active)return;if(error)setHistoryError(error.message);else setHistory(data);
    });return()=>{active=false;};
  },[db,detail]);
  useEffect(()=>{
    if(!editor&&!detail)return;
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!saving){setEditor(null);setDetail(null);}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[editor,detail,saving]);
  const visible=rows.filter(r=>`${r.name} ${r.email}`.toLowerCase().includes(search.toLowerCase())&&(filter==='all'||r.status===filter||(filter==='soon'&&soon(r))));
  const pages=Math.max(1,Math.ceil(visible.length/25)), current=Math.min(page,pages);
  function edit(user:Row,renew=false){
    setEditor({user,renew});setReason('');setFormError('');
    setStart(renew?user.end_date??todayDate():user.start_date??todayDate());setStatus(renew||!user.membership_id?'active':user.status);
  }
  async function save(e:React.FormEvent){
    e.preventDefault();if(!editor||saving)return;setSaving(true);setFormError('');
    try{
      const {error}=await db.rpc('admin_save_membership',{p_user_id:editor.user.user_id,p_membership_id:editor.user.membership_id,p_start_date:start,p_status:status,p_reason:reason.trim(),p_renew:editor.renew});
      if(error)throw error;setEditor(null);setNotice('Membership saved. The member will see the updated dates.');await load();
    }catch(e){setFormError((e as Error).message);}finally{setSaving(false);}
  }
  function exportCsv(){
    const data=[['Name','Email','Role','Registered','Last login','Sign-in methods','Start date','Expiry','Status','Days remaining'],...visible.map(r=>[r.name,r.email,r.role,r.created_at,r.last_sign_in_at,r.providers.join(', '),r.start_date,r.end_date,label(r.status),daysRemaining(r.end_date)])];
    const url=URL.createObjectURL(new Blob(['\uFEFF'+data.map(r=>r.map(csvCell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`memberships-${todayDate()}.csv`;a.click();URL.revokeObjectURL(url);
  }
  return <div className="space-y-6 font-sans text-slate-800">
    <div><h1 className="fsp-dot text-2xl font-semibold tracking-tight">Users & Memberships</h1><p className="text-sm text-[var(--muted)]">Registered accounts, login activity and one-year memberships. Times shown in India Standard Time.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[['Registered users','all'],['Active','active'],['Expiring in 30 days','soon'],['Expired','expired'],['No membership','none']].map(([title,key])=><button key={key} className="text-left rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-colors hover:border-[var(--brand-navy-border)] focus-visible:outline-2 focus-visible:outline-[var(--brand-navy)]" onClick={()=>{setFilter(key);setPage(1);}}><div className="text-xs text-[var(--muted)]">{title}</div><div className="text-2xl font-bold">{loading||error?'—':rows.filter(r=>key==='all'||r.status===key||(key==='soon'&&soon(r))).length}</div></button>)}</div>
    {notice&&<p role="status" className="text-green-700">{notice}</p>}{error&&<p role="alert" className="border border-red-300 bg-red-50 p-4 rounded-xl text-red-700">{error}</p>}
    <Card hoverEffect={false} className="p-5"><CardContent className="flex flex-wrap items-center gap-3"><div className="flex-1 min-w-48"><Input aria-label="Search users" placeholder="Search name or email" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/></div><div className="min-w-48"><Select aria-label="Status" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="all">All registered users</option>{['none','active','pending','expired','suspended','cancelled'].map(s=><option key={s} value={s}>{label(s)}</option>)}<option value="soon">Expiring in 30 days</option></Select></div><Button variant="outline" onClick={load} disabled={loading}>Refresh</Button><Button variant="outline" onClick={exportCsv} disabled={loading||!!error||!visible.length}>Export filtered CSV</Button></CardContent></Card>
    <Card hoverEffect={false} className="overflow-hidden p-0"><CardContent>
      {loading ? <p className="p-12 text-center text-sm text-slate-500">Loading participants...</p>
        : error ? <p className="p-12 text-center text-sm text-slate-500">Participants could not be loaded. Refresh to retry.</p>
        : !visible.length ? <p className="p-12 text-center text-sm text-slate-500">No participants match these filters.</p>
        : <MembershipUsersTable rows={visible.slice((current-1)*25,current*25)} total={visible.length} onEdit={edit}
            onHistory={row => { setHistory(null); setHistoryError(''); setDetail(row); }} />}
    </CardContent></Card>
    <div className="flex justify-between text-sm items-center"><span>{visible.length} users · Page {current} of {pages}</span><div className="flex gap-2"><Button variant="outline" disabled={current<=1} onClick={()=>setPage(current-1)}>Previous</Button><Button variant="outline" disabled={current>=pages} onClick={()=>setPage(current+1)}>Next</Button></div></div>
    {editor&&<div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="membership-title"><form onSubmit={save} className="space-y-4"><h2 id="membership-title" className="text-xl font-bold">{editor.renew?'Renew membership':editor.user.membership_id?'Edit membership':'Assign membership'}</h2><p>{editor.user.name}<br/>{editor.user.email}</p><Input autoFocus label="Membership start date" type="date" value={start} min={editor.renew?editor.user.end_date??undefined:undefined} required onChange={e=>setStart(e.target.value)}/><p className="rounded-lg bg-[var(--muted-light)] p-3">Expiry: <strong>{membershipExpiry(start)||'Choose a start date'}</strong><br/><span className="text-xs">One calendar year. Past dates are allowed for existing members.{editor.renew&&' Renewal defaults to the current expiry; you may select a later date.'}</span></p><label className="block text-sm">Status<Select value={status} onChange={e=>setStatus(e.target.value)}>{['active','pending','expired','suspended','cancelled'].map(s=><option key={s} value={s}>{label(s)}</option>)}</Select></label>{status==='active'&&membershipExpiry(start)<todayDate()&&<p className="text-amber-700">This term has ended and will be saved as expired.</p>}<label className="block text-sm">Reason for change<textarea className="block border rounded-lg w-full p-2 mt-1" required minLength={3} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="For example: original joining date corrected from member records"/></label>{formError&&<p role="alert" className="text-red-600">{formError}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={()=>setEditor(null)}>Cancel</Button><Button type="submit" disabled={saving||reason.trim().length<3}>{saving?'Saving…':'Save membership'}</Button></div></form></Card></div>}
    {detail&&<div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center"><Card className="w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="history-title"><div className="flex justify-between gap-4"><h2 id="history-title" className="text-xl font-bold">{detail.name} — history</h2><Button autoFocus variant="outline" onClick={()=>setDetail(null)}>Close</Button></div><p className="text-sm mb-4">{detail.email} · Last successful login: {time(detail.last_sign_in_at)}</p>{historyError?<p role="alert" className="text-red-600">{historyError}</p>:!history?<p>Loading history…</p>:<div className="space-y-5"><section><h3 className="font-bold">Membership terms</h3>{history.memberships.length?history.memberships.map(m=><p key={m.id} className="border-b py-2 text-sm">{m.start_date} to {m.end_date??'No expiry'} · {label(m.status==='active'&&m.end_date&&m.end_date<todayDate()?'expired':m.status)}</p>):<p>No membership assigned.</p>}</section><section><h3 className="font-bold">Login / logout history (latest 100)</h3><p className="text-xs text-[var(--muted)]">Older login events may be unavailable. Last successful login above comes from authentication records.</p>{history.logins.map(l=><p key={l.id} className="border-b py-2 text-sm">{time(l.created_at)} · {l.action} {l.metadata?.provider&&`· ${l.metadata.provider}`}</p>)}</section><section><h3 className="font-bold">Admin changes (latest 100)</h3>{history.changes.map((c,i)=><div key={i} className="border-b py-2 text-sm"><p>{time(c.performed_at)} · {c.action} · {c.admin_name||c.admin_email}</p><p>{c.details?.reason||'No reason recorded in legacy entry'}</p></div>)}</section></div>}</Card></div>}
  </div>;
}
