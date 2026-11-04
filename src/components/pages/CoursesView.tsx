"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Calendar, RefreshCcw, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PaymentReceiptLink } from "@/components/member/PaymentReceiptLink";
import { offeringDates, programTimeLabel } from "@/lib/data/enrollments";
import { ProgramFlyer } from "@/components/member/TodaysUpdates";
import { DashboardPrograms } from "@/components/member/DashboardPrograms";
import { indiaDate, registrationOpen } from "@/lib/program-schedule";
import { enrollmentAction, enrollmentError, feeLabel, isUpcoming, offeringFeeLabel, loadEnrollmentData, statusLabel, type Offering, type OfferingEnrollment } from "@/lib/data/enrollments";

const DashboardEnrollmentOverview = dynamic(() => import("@/components/admin/DashboardEnrollmentOverview").then(module => module.DashboardEnrollmentOverview));
const EnrollmentManagement = dynamic(() => import("@/components/admin/EnrollmentManagement").then(module => module.EnrollmentManagement));

export const CoursesView: React.FC<{ initialView?: "course" | "enrollments"; dashboard?: boolean; sessions?: boolean }> = ({ initialView = "course", dashboard = false, sessions = false }) => {
  const { user, loading: authLoading } = useAuth();
  if (authLoading) return <p role="status">Loading your account…</p>;
  if (!user) return <Card className="p-5">Please <Link className="underline" href="/login">sign in</Link> to browse and enroll.</Card>;
  return <MemberCourses key={user.id} userId={user.id} initialView={initialView} dashboard={dashboard || sessions} sessions={sessions} />;
};

function MemberCourses({ userId, initialView, dashboard, sessions }: { userId: string; initialView: "course" | "enrollments"; dashboard: boolean; sessions: boolean }) {
  const [view, setView] = useState<"course" | "program" | "enrollments">(initialView);
  const [sessionFilter,setSessionFilter] = useState<"all" | "unregistered" | "registered">("all");
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const { role } = useAuth();
  const manager = role === "admin" || role === "super_admin";
  const [allOfferings,setAllOfferings] = useState<Offering[]>([]);
  const [adminEnrollments,setAdminEnrollments] = useState<OfferingEnrollment[]>([]);
  const [today,setToday] = useState(() => indiaDate());
  const [setupOpen,setSetupOpen] = useState(false);
  const [enrollments, setEnrollments] = useState<OfferingEnrollment[]>([]);
  const [instructions, setInstructions] = useState("");
  const [hasMember, setHasMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Offering | null>(null);
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const requestVersion = useRef(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    try {
      const [data, member] = await Promise.all([
        loadEnrollmentData(manager),
        createClient().from("members").select("id").eq("user_id", userId).maybeSingle(),
      ]);
      if (member.error) throw member.error;
      if (signal?.aborted || version !== requestVersion.current) return;
      setError("");
      setOfferings(data.offerings.filter(item => item.is_active)); setEnrollments(data.enrollments.filter(row => row.member_id === member.data?.id)); setAdminEnrollments(data.enrollments); setAllOfferings(data.offerings);
      setInstructions(data.instructions); setHasMember(Boolean(member.data));
      setSelected(current => current ? data.offerings.find(item => item.id === current.id) ?? current : null);
    } catch (err) { if (!signal?.aborted && version === requestVersion.current) setError(enrollmentError(err)); }
    finally { if (!signal?.aborted && version === requestVersion.current) setLoading(false); }
  }, [userId,manager]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => refresh(controller.signal));
    return () => controller.abort();
  }, [refresh]);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'hidden') return; setToday(indiaDate()); void refresh(); };
    const timer = setInterval(onFocus, 60000);
    window.addEventListener("focus",onFocus);
    return () => { clearInterval(timer); window.removeEventListener("focus",onFocus); };
  }, [refresh]);
  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);

  const existing = selected ? enrollments.find(row => row.offering_id === selected.id) : undefined;
  const openDetails = (item: Offering) => { setReference(""); setReceipt(null); setUploadedPath(null); setError(""); setMessage(""); setSelected(item); };

  async function confirmEnrollment() {
    if (!selected || busy || manager) return;
    setBusy(true); setError("");
    try {
      const row = await enrollmentAction("enroll_offering", { p_offering_id: selected.id });
      setEnrollments(previous => [{ ...row, offerings: selected }, ...previous.filter(item => item.id !== row.id)]);
      window.dispatchEvent(new Event("fsp-enrollment-changed"));
      setMessage(row.status === "active" ? "Registration confirmed." : "Enrollment saved. Complete your payment and submit its reference below.");
    } catch (err) { setError(enrollmentError(err)); }
    finally { setBusy(false); }
  }
  async function submitReference(event: React.FormEvent) {
    event.preventDefault();
    if (!existing || !selected || busy) return;
    setBusy(true); setError("");
    try {
      let path = uploadedPath ?? existing.receipt_path;
      if (receipt && !uploadedPath) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(receipt.type) || receipt.size > 5 * 1024 * 1024) throw new Error("Choose a JPG, PNG, or WebP image no larger than 5 MB.");
        const extension = receipt.type === "image/png" ? "png" : receipt.type === "image/webp" ? "webp" : "jpg";
        path = `${userId}/${existing.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await createClient().storage.from("payment-receipts").upload(path, receipt, { contentType: receipt.type, upsert: false });
        if (uploadError) throw uploadError;
        setUploadedPath(path);
      }
      if (!path) throw new Error("Upload a payment screenshot before submitting.");
      const row = await enrollmentAction("submit_enrollment_payment", { p_enrollment_id: existing.id, p_reference: reference.trim(), p_receipt_path: path });
      setEnrollments(previous => previous.map(item => item.id === row.id ? { ...row, offerings: selected } : item));
      setMessage("Payment reference submitted. Your enrollment becomes active after an administrator verifies payment."); setReference("");
    } catch (err) { setError(enrollmentError(err)); }
    finally { setBusy(false); }
  }

  const catalog = offerings.filter(item => item.kind === view);
  const sessionOfferings = (sessionFilter === "registered" ? allOfferings : offerings).filter(item => {
    if (item.kind !== "program" || !item.start_date) return false;
    const registered = enrollments.some(row => row.offering_id === item.id);
    if (sessionFilter === "registered") return registered;
    return item.start_date >= today && (sessionFilter === "all" || !registered);
  });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="fsp-dot text-3xl font-black">{sessions ? "Events & Calendar" : dashboard ? "Programs & Enrollments" : initialView === "enrollments" ? "Course Payments" : "Courses & Programs"}</h1><p className="mt-2 text-sm text-[var(--muted)]">Explore experiences, enroll, and follow your learning journey.</p></div>
      <Button variant="outline" size="sm" disabled={loading || busy} onClick={() => { setLoading(true); void refresh(); }} icon={<RefreshCcw className="w-4 h-4" />}>Refresh</Button>
    </div>
    {!selected && error && <div role="alert" className="rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">{error}</div>}
    {sessions && <div className="space-y-3"><p className="text-sm text-[var(--muted)]">Browse scheduled sessions and register by clicking a poster or topic.</p><div className="flex flex-wrap gap-2">{([["all","All upcoming sessions"],["unregistered","Not registered"],["registered","My registered sessions"]] as const).map(([key,label])=><Button key={key} size="sm" variant={sessionFilter===key?"primary":"outline"} aria-pressed={sessionFilter===key} onClick={()=>setSessionFilter(key)}>{label}</Button>)}</div></div>}
    {!loading && !error && !hasMember && !manager && <Card className="p-5">Complete your <Link className="underline" href="/profile">member profile</Link> before enrolling. If it is already complete, contact FSP support.</Card>}
    {!dashboard && <div className="flex flex-wrap gap-2" aria-label="Catalog views">
      {([["course", "Courses"], ["program", "Programs"], ["enrollments", "My Enrollments"]] as const).map(([key, label]) => <Button key={key} variant={view === key ? "primary" : "outline"} size="sm" onClick={() => setView(key)} aria-pressed={view === key}>{label} ({key === "enrollments" ? enrollments.length : offerings.filter(item => item.kind === key).length})</Button>)}
    </div>}
    {loading ? <p role="status">Loading courses and enrollments…</p> : dashboard ? <><DashboardPrograms sessions={sessions} includePast={sessions && sessionFilter === "registered"} offerings={sessions ? sessionOfferings : offerings} enrollments={enrollments} date={today} manager={manager} onOpen={openDetails} />{manager && !sessions && <><DashboardEnrollmentOverview offerings={allOfferings} enrollments={adminEnrollments} date={today} refresh={refresh} /><details className="rounded-xl border border-[var(--card-border)] p-4" onToggle={event=>setSetupOpen(event.currentTarget.open)}><summary className="cursor-pointer font-semibold">Program setup &amp; payment instructions</summary>{setupOpen && <div className="mt-5"><EnrollmentManagement setupOnly onProgramChanged={refresh}/></div>}</details></>}</> : view === "enrollments" ? <div className="space-y-3">
      {!enrollments.length && <Card className="p-6 text-[var(--muted)]">You haven’t enrolled yet. Choose a course or program to get started.</Card>}
      {enrollments.map(row => <Card key={row.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div><h2 className="font-bold">{row.offerings.title}</h2><p className="mt-1 text-sm text-[var(--muted)]">{feeLabel(row.amount, row.currency)} · {new Date(row.created_at).toLocaleDateString("en-IN")}</p><p className="mt-1 text-sm">Payment: {row.amount === 0 ? "Not required" : row.status === "active" ? "Verified" : row.status === "payment_review" ? "Awaiting verification" : "Not verified"}</p>{row.review_note && <p className="mt-2 text-sm">Admin note: {row.review_note}</p>}</div>
        <div className="flex items-center gap-3"><Badge variant={row.status === "active" ? "success" : "warning"}>{statusLabel(row.status)}</Badge><Button variant="outline" size="sm" onClick={() => openDetails(row.offerings)}>{row.status === "pending_payment" ? "Payment details" : "View details"}</Button></div>
      </Card>)}
    </div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {!catalog.length && !error && <p>No {view === "course" ? "courses" : "programs"} available.</p>}
      {catalog.map(item => {
        const enrollment = enrollments.find(row => row.offering_id === item.id);
        return <Card key={item.id} className="flex flex-col justify-between space-y-5 p-5">
          <div className="space-y-3">
            <div className="flex justify-between gap-2"><div className="rounded-xl bg-[var(--brand-navy)] p-3 text-white">{item.kind === "course" ? <BookOpen size={24} /> : <Users size={24} />}</div><Badge variant={enrollment?.status === "active" ? "success" : isUpcoming(item) ? "warning" : "secondary"}>{enrollment ? statusLabel(enrollment.status) : isUpcoming(item) ? "Upcoming" : "Available"}</Badge></div>
            <p className="text-xs font-bold text-[var(--muted)]">{item.code}</p><h2 className="text-lg font-bold">{item.title}</h2><p className="line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
            <p className="flex items-center gap-2 text-xs text-[var(--muted)]"><Calendar size={14} />{item.duration}{item.format ? ` · ${item.format}` : ""}</p>
            {offeringDates(item) && <p className="text-sm font-medium">Dates: {offeringDates(item)}</p>}
            {item.program_time && <p className="text-sm">Time: {programTimeLabel(item.program_time)}</p>}
            <p className={isUpcoming(item) ? "font-bold text-[var(--muted)]" : "font-bold text-[var(--brand-navy)]"}>{offeringFeeLabel(item)}</p>
          </div>
          {/* An upcoming offering still opens its details; it just cannot be enrolled in yet. */}
          <Button fullWidth size="sm" variant={!enrollment && isUpcoming(item) ? "outline" : "primary"} onClick={() => openDetails(item)}>{enrollment ? enrollment.status === "pending_payment" ? "Complete enrollment" : "View enrollment" : isUpcoming(item) ? "Coming soon · View details" : item.kind === "course" ? "Enroll in Course" : "Register for Program"}</Button>
        </Card>;
      })}
    </div>}
    <dialog ref={dialog} onCancel={event => { if (busy) event.preventDefault(); else setSelected(null); }} aria-labelledby="enrollment-title" className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 text-[var(--foreground)] shadow-xl backdrop:bg-black/50">
      {selected && <div className="space-y-5">
        <div className="flex items-start justify-between gap-4"><h2 id="enrollment-title" className="text-xl font-bold">{selected.title}</h2><Button variant="ghost" size="icon" aria-label="Close enrollment details" disabled={busy} onClick={() => setSelected(null)}><X size={20} /></Button></div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed [overflow-wrap:anywhere]">{selected.description}</p><p className="text-sm text-[var(--muted)]">{selected.duration}</p><p className="text-lg font-bold">{existing ? feeLabel(existing.amount, selected.currency) : offeringFeeLabel(selected)}</p>
        {selected.flyer_path && <ProgramFlyer path={selected.flyer_path} title={selected.title} />}
        {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}{message && <p role="status" className="text-sm text-[var(--success)]">{message}</p>}
        {!existing ? <>
          {!manager && !registrationOpen(selected,today) && <p className="text-sm font-semibold text-[var(--muted)]">{isUpcoming(selected) ? "This offering is upcoming. Registration has not opened yet." : "Registration is closed for this program."}</p>}
          <p className="text-sm">{manager ? "Administrators manage enrollment records below. This view does not enroll an administrator as a member." : !registrationOpen(selected,today) ? isUpcoming(selected) ? "Dates and fee will be announced. Check back once registration opens." : "Please contact FSP or check again when registration opens." : selected.price === 0 ? "Registration is free and will be confirmed immediately." : "Your place will be marked pending payment. Enrollment becomes active after payment verification."}</p>
          {!hasMember && <p>Please complete your <Link href="/profile" className="underline">member profile</Link> before enrolling.</p>}
          <Button fullWidth disabled={busy || !hasMember || manager || !registrationOpen(selected,today)} onClick={() => void confirmEnrollment()}>{busy ? "Saving…" : !registrationOpen(selected,today) ? isUpcoming(selected) ? "Opens soon" : "Registration closed" : selected.price === 0 ? "Confirm free registration" : "Confirm enrollment"}</Button>
        </> : <>
          <Badge variant={existing.status === "active" ? "success" : "warning"}>{statusLabel(existing.status)}</Badge>{existing.review_note && <p className="text-sm">Admin note: {existing.review_note}</p>}
          {existing.receipt_path && <PaymentReceiptLink path={existing.receipt_path} />}
          {existing.status === "pending_payment" && <>
            <div className="rounded-xl bg-[var(--muted-light)] p-4"><h3 className="mb-2 font-bold">Payment instructions</h3><p className="whitespace-pre-wrap text-sm">{instructions.trim() || "Contact FSP support for payment details. Your enrollment is saved; do not pay until you receive the official instructions."}</p></div>
            <form onSubmit={submitReference} className="space-y-3"><label htmlFor="payment-screenshot" className="block text-sm font-medium">Payment screenshot (JPG, PNG, WebP; maximum 5 MB)</label><input id="payment-screenshot" type="file" accept="image/jpeg,image/png,image/webp" required={!existing.receipt_path && !uploadedPath} disabled={busy} onChange={event => { setReceipt(event.target.files?.[0] ?? null); setUploadedPath(null); }} className="block w-full text-sm" /><label htmlFor="payment-reference" className="block text-sm font-medium">Transaction / UTR reference</label><input id="payment-reference" className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3" required minLength={3} maxLength={120} value={reference} onChange={event => setReference(event.target.value)} placeholder="Enter the reference from your completed payment" /><p className="text-xs text-[var(--muted)]">Submit only after paying {feeLabel(existing.amount, existing.currency)}. Never enter a card number, PIN, or password.</p><Button fullWidth disabled={busy || reference.trim().length < 3} type="submit">{busy ? "Submitting…" : "Submit payment for review"}</Button></form>
          </>}
          {existing.status === "payment_review" && <p className="text-sm">Reference: {existing.payment_reference}. An administrator will verify your payment. Use Refresh to check its status.</p>}
          {existing.status === "active" && <p className="text-sm">{selected.kind === "program" ? "Your registration is confirmed." : "Your enrollment is active."}</p>}
        </>}
      </div>}
    </dialog>
  </div>;
};
