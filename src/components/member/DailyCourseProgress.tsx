"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { enrollmentError, statusLabel, type OfferingEnrollment } from "@/lib/data/enrollments";

type Task = { id: string; offering_id: string; day_number: number; title: string; instructions: string };
type Completion = { enrollment_id: string; task_id: string };
async function loadProgress(memberId: string) {
  const db = createClient();
  const enrolled = await db.from("offering_enrollments").select("*, offerings!inner(*)").eq("member_id",memberId).eq("offerings.kind","course").order("created_at",{ascending:false});
  if (enrolled.error) throw enrolled.error;
  const enrollments = enrolled.data as unknown as OfferingEnrollment[];
  const active = enrollments.filter(row=>row.status==="active");
  if (!active.length) return { enrollments, tasks: [] as Task[], completions: [] as Completion[] };
  const [tasks,completed] = await Promise.all([
    db.from("offering_daily_tasks").select("*").in("offering_id",active.map(row=>row.offering_id)).order("day_number"),
    db.from("offering_task_completions").select("enrollment_id,task_id").in("enrollment_id",active.map(row=>row.id)),
  ]);
  if (tasks.error) throw tasks.error;
  if (completed.error) throw completed.error;
  return { enrollments,tasks:tasks.data as Task[],completions:completed.data as Completion[] };
}

export function DailyCourseProgress({ memberId }: { memberId: string | undefined }) {
  const { data,error,loading,reload,setData } = useAsync(()=>loadProgress(memberId!),[memberId],Boolean(memberId));
  const [selectedId,setSelectedId] = useState<string | null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [actionError,setActionError] = useState("");
  useEffect(()=>{if (!memberId) return; const timer=setInterval(()=>{if(document.visibilityState!=='hidden')reload();},60000); const refresh=()=>reload(); window.addEventListener("fsp-enrollment-changed",refresh);return()=>{clearInterval(timer);window.removeEventListener("fsp-enrollment-changed",refresh);};},[memberId,reload]);
  async function done(enrollmentId: string,task: Task) {
    if (busy) return;
    setBusy(true); setMessage(""); setActionError("");
    try {
      const { data: result,error }=await createClient().rpc("complete_daily_task",{p_enrollment_id:enrollmentId,p_task_id:task.id});
      if (error) throw error;
      if (result?.task_id!==task.id) throw new Error("Progress could not be confirmed. Please refresh.");
      setData(previous=>previous ? {...previous,completions:[...previous.completions.filter(row=>!(row.enrollment_id===enrollmentId && row.task_id===task.id)),{enrollment_id:enrollmentId,task_id:task.id}]} : previous!);
      setMessage(task.day_number===30 ? "All 30 days completed. Well done!" : `Day ${task.day_number} saved. Your next task is ready.`);
      reload();
    } catch(err){setActionError(enrollmentError(err));} finally{setBusy(false);}
  }
  return <div className="space-y-4 border-t border-[var(--card-border)] pt-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">My Enrolled Courses</h3><Button variant="ghost" size="sm" disabled={loading || busy || !memberId} onClick={reload}>Refresh</Button></div>
    {loading && !data && <p role="status" className="text-sm">Loading your courses…</p>}{error && <p role="alert" className="text-sm text-[var(--danger)]">{error.kind==="unavailable" ? "Daily tasks need database setup. Please contact the FSP administrator." : error.message}</p>}{actionError && <p role="alert" className="text-sm text-[var(--danger)]">{actionError}</p>}{message && <p role="status" className="text-sm text-[var(--success)]">{message}</p>}
    {data?.enrollments.length===0 && <p className="text-sm text-[var(--muted)]">Your enrolled courses and daily tasks will appear here.</p>}
    {data?.enrollments.map(row=>{
      const tasks=data.tasks.filter(task=>task.offering_id===row.offering_id);
      const completed=new Set(data.completions.filter(record=>record.enrollment_id===row.id).map(record=>record.task_id));
      const count=tasks.filter(task=>completed.has(task.id)).length;
      return <button type="button" key={row.id} onClick={()=>{setMessage("");setActionError("");setSelectedId(row.id);}} className="block w-full rounded-xl border border-[var(--card-border)] p-4 text-left transition-colors hover:bg-[var(--muted-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]">
        <span className="flex flex-wrap justify-between gap-2"><span className="font-semibold">{row.offerings.title}</span><Badge variant={row.status==="active" ? "success" : "warning"}>{statusLabel(row.status)}</Badge></span>
        <span className="mt-2 block text-xs text-[var(--muted)]">{tasks.length ? `${count}/${tasks.length} days complete · ${count===tasks.length ? "View completed tasks" : "Open daily tasks"}` : "View course details"} →</span>
      </button>;
    })}
    {data && selectedId && (()=>{
      const row=data.enrollments.find(item=>item.id===selectedId);
      if (!row) return null;
      return <DailyTaskDialog key={row.id} row={row} tasks={data.tasks.filter(task=>task.offering_id===row.offering_id)} completions={data.completions.filter(record=>record.enrollment_id===row.id)} busy={busy} message={message} error={actionError} onDone={done} onClose={()=>setSelectedId(null)}/>;
    })()}
  </div>;
}

function DailyTaskDialog({row,tasks,completions,busy,message,error,onDone,onClose}:{row:OfferingEnrollment;tasks:Task[];completions:Completion[];busy:boolean;message:string;error:string;onDone:(enrollmentId:string,task:Task)=>Promise<void>;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [viewedTask,setViewedTask]=useState<string | null>(null);
  const completed=new Set(completions.map(item=>item.task_id));
  const next=tasks.find(task=>!completed.has(task.id));
  const selected=tasks.find(task=>task.id===viewedTask) ?? next;
  const count=tasks.filter(task=>completed.has(task.id)).length;
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} aria-labelledby="daily-task-title" onCancel={event=>{if(busy)event.preventDefault();else onClose();}} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-[var(--foreground)] shadow-xl backdrop:bg-black/50">
    <div className="space-y-5"><div className="flex items-start justify-between gap-4"><div><h2 id="daily-task-title" className="text-xl font-bold">{row.offerings.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">Daily tasks and saved progress</p></div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={onClose}>Close</Button></div>
      <p className="text-sm leading-relaxed">{row.offerings.description}</p>
      {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}{message && <p role="status" className="text-sm text-[var(--success)]">{message}</p>}
      {row.status!=="active" ? <p className="text-sm">Daily tasks unlock after payment verification.</p> : !tasks.length ? <p className="text-sm">Daily tasks are not configured for this course yet.</p> : <>
        <p className="text-sm font-semibold">{count} of {tasks.length} days completed</p><progress value={count} max={tasks.length} aria-label="Course progress" className="h-2 w-full accent-[var(--brand-navy)]"/>
        {selected ? <div className="space-y-3 rounded-xl bg-[var(--muted-light)] p-4"><Badge variant={completed.has(selected.id)?"success":"secondary"}>Day {selected.day_number}{completed.has(selected.id)?" · Done":""}</Badge><h3 className="font-bold">{selected.title}</h3><p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.instructions}</p>{selected.id===next?.id && <Button type="button" size="sm" disabled={busy} onClick={()=>{setViewedTask(null);void onDone(row.id,selected);}}>{busy?"Saving…":"Done — next day"}</Button>}</div> : <p className="font-semibold text-[var(--success)]">All course tasks completed!</p>}
        <details><summary className="cursor-pointer text-sm font-semibold">Choose a day</summary><div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">{tasks.map(task=><Button type="button" key={task.id} size="sm" variant={task.id===selected?.id?"primary":"outline"} disabled={busy || (!completed.has(task.id) && task.id!==next?.id)} onClick={()=>setViewedTask(task.id)} aria-label={`Day ${task.day_number}${completed.has(task.id)?", completed":""}`}>{task.day_number}{completed.has(task.id)?" ✓":""}</Button>)}</div></details>
      </>}
    </div>
  </dialog>;
}
