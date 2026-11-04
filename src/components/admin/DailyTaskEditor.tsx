"use client";
import { useState } from "react";
import { useAsync } from "@/lib/useAsync";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { enrollmentError } from "@/lib/data/enrollments";

type Task={id:string;day_number:number;title:string;instructions:string};
function TaskForm({task}:{task:Task}){
  const [title,setTitle]=useState(task.title);const [instructions,setInstructions]=useState(task.instructions);const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");
  async function save(){setBusy(true);setMessage("");try{const {error}=await createClient().from("offering_daily_tasks").update({title:title.trim(),instructions:instructions.trim()}).eq("id",task.id).select("id").single();if(error)throw error;setMessage("Task saved.");}catch(err){setMessage(enrollmentError(err));}finally{setBusy(false);}}
  return <details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-semibold">Day {task.day_number}: {task.title}</summary><div className="mt-3 space-y-3"><label className="block text-sm">Title<input className="w-full rounded-lg border bg-[var(--card-bg)] p-2" maxLength={150} value={title} onChange={event=>setTitle(event.target.value)}/></label><label className="block text-sm">Instructions<textarea className="w-full rounded-lg border bg-[var(--card-bg)] p-2" rows={4} maxLength={5000} value={instructions} onChange={event=>setInstructions(event.target.value)}/></label><Button type="button" size="sm" disabled={busy || !title.trim() || !instructions.trim()} onClick={()=>void save()}>{busy?"Saving…":"Save day task"}</Button>{message && <p role="status" className="text-sm">{message}</p>}</div></details>;
}
export function DailyTaskEditor({offeringId}:{offeringId:string}){
  const {data,error,loading,reload}=useAsync(async()=>{const result=await createClient().from("offering_daily_tasks").select("*").eq("offering_id",offeringId).order("day_number");if(result.error)throw result.error;return result.data as Task[];},[offeringId]);
  return <section className="space-y-3"><h3 className="font-bold">30-day task instructions</h3><p className="text-sm text-[var(--muted)]">Review and customize the starter exercises for your course.</p>{loading && <p>Loading tasks…</p>}{error && <p role="alert">{error.message}</p>}<Button type="button" variant="outline" size="sm" onClick={reload}>Refresh tasks</Button>{data?.map(task=><TaskForm key={task.id} task={task}/>)}</section>;
}
