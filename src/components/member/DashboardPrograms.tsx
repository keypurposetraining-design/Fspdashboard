"use client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgramFlyer } from "@/components/member/TodaysUpdates";
import { feeLabel, offeringDates, programTimeLabel, statusLabel, type Offering, type OfferingEnrollment } from "@/lib/data/enrollments";
import { scheduledPrograms, modeLabel } from "@/lib/program-schedule";

export function ProgramFacts({ item }: { item: Offering }) {
  return <div className="min-w-0 space-y-2 text-sm [overflow-wrap:anywhere]"><p>{offeringDates(item) ?? "Date to be announced"}</p><p>Start: {programTimeLabel(item.program_time) ?? "To be confirmed"} · End: {programTimeLabel(item.program_end_time) ?? "To be confirmed"}</p>
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${item.mode === "online" ? "bg-[var(--brand-navy-light)] text-[var(--brand-navy)]" : item.mode === "offline" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}>{modeLabel(item)}</span>{item.format && <p>{item.format}</p>}
  </div>;
}
function ProgramCard({ item, enrollment, today, onOpen }: { item: Offering; enrollment?: OfferingEnrollment; today?: boolean; date: string; manager: boolean; onOpen: (item: Offering) => void }) {
  return <Card className="flex h-full min-w-0 flex-col gap-4 p-4 sm:p-5">
    <div className="flex flex-wrap justify-between gap-2">{today && <Badge variant="secondary">TODAY</Badge>}{enrollment && <Badge variant={enrollment.status === "active" ? "success" : "warning"}>{statusLabel(enrollment.status)}</Badge>}</div>
    {item.kind !== "course" && (item.flyer_path ? <ProgramFlyer path={item.flyer_path} title={item.title} onOpen={()=>onOpen(item)}/> : <button type="button" onClick={()=>onOpen(item)} className="rounded-xl bg-[var(--muted-light)] p-10 text-center text-sm text-[var(--muted)]" aria-label={`View program details: ${item.title}`}>Poster coming soon · View details</button>)}
    <button type="button" onClick={()=>onOpen(item)} className="text-left text-lg font-bold leading-snug [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]">{item.title}</button>
    <div className="mt-auto grid grid-cols-3 gap-2 text-center">
      <div className="min-w-0 rounded-xl border border-[var(--card-border)] bg-[var(--muted-light)] px-2 py-3"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Date</p><p className="text-xs font-semibold [overflow-wrap:anywhere]">{offeringDates(item) ?? "To be announced"}</p></div>
      <div className="min-w-0 rounded-xl border border-[var(--card-border)] bg-[var(--muted-light)] px-2 py-3"><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Time</p><p className="text-xs font-semibold">{programTimeLabel(item.program_time) ?? "To be confirmed"}</p>{item.program_end_time && <p className="mt-1 text-[11px]">to {programTimeLabel(item.program_end_time)}</p>}</div>
      <div className={`flex min-w-0 flex-col justify-center rounded-xl border px-2 py-3 ${item.mode === "online" ? "border-[var(--brand-navy-border)] bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]" : item.mode === "offline" ? "border-green-200 bg-green-50 text-green-800" : "border-[var(--card-border)] bg-[var(--muted-light)]"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wide">Mode</p><p className="text-xs font-bold [overflow-wrap:anywhere]">{modeLabel(item)}</p></div>
    </div>
    {enrollment && <p className="text-xs text-[var(--muted)]">{statusLabel(enrollment.status)} · {feeLabel(enrollment.amount,item.currency)}</p>}
  </Card>;
}
export function DashboardPrograms({ offerings, enrollments, date, manager, onOpen, sessions = false, includePast = false }: { offerings: Offering[]; enrollments: OfferingEnrollment[]; date: string; manager: boolean; onOpen: (item: Offering) => void; sessions?: boolean; includePast?: boolean }) {
  const groups = scheduledPrograms(offerings,date,includePast);
  return <div className="space-y-8">
    {([ [sessions ? "Today's Sessions" : "Today's Programs",groups.today,sessions ? "No matching sessions for today." : "No programs scheduled for today."], [sessions ? "Upcoming Sessions" : "Upcoming Programs",groups.upcoming,sessions ? "No matching upcoming sessions." : "No upcoming programs scheduled."] ] as const).map(([title,items,empty],index) => <section key={title} className="space-y-4"><h2 className="fsp-dot text-xl font-bold">{title}</h2><div className="grid gap-5 md:grid-cols-2">{items.map(item => <ProgramCard key={item.id} item={item} enrollment={enrollments.find(row => row.offering_id===item.id)} today={index===0} date={date} manager={manager} onOpen={onOpen} />)}</div>{!items.length && <Card className="p-5 text-sm text-[var(--muted)]">{empty}</Card>}</section>)}
    {includePast && <section className="space-y-4"><h2 className="fsp-dot text-xl font-bold">Past Registered Sessions</h2><div className="grid gap-5 md:grid-cols-2">{groups.past.map(item => <ProgramCard key={item.id} item={item} enrollment={enrollments.find(row => row.offering_id === item.id)} date={date} manager={manager} onOpen={onOpen} />)}</div>{!groups.past.length && <Card className="p-5 text-sm text-[var(--muted)]">No past registered sessions.</Card>}</section>}
  </div>;
}
