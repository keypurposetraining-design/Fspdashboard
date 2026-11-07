"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { PaymentReceiptLink } from "@/components/member/PaymentReceiptLink";
import { ProgramFlyer } from "@/components/member/TodaysUpdates";
import { DailyTaskEditor } from "@/components/admin/DailyTaskEditor";
import { uploadProgramFlyer } from "@/lib/data/enrollments";
import { enrollmentAction, enrollmentError, feeLabel, loadEnrollmentData, statusLabel, type Offering, type OfferingEnrollment } from "@/lib/data/enrollments";

const fieldStyle = "w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-sm";

function OfferingEditor({ offering, onSaved, newProgram = false }: { offering: Offering; onSaved: () => Promise<void>; newProgram?: boolean }) {
  const [price, setPrice] = useState(String(offering.price));
  const [active, setActive] = useState(offering.is_active);
  const [title, setTitle] = useState(offering.title);
  const [description, setDescription] = useState(offering.description);
  const [duration, setDuration] = useState(offering.duration);
  const [format, setFormat] = useState(offering.format ?? "");
  const [startDate, setStartDate] = useState(offering.start_date ?? "");
  const [endDate, setEndDate] = useState(offering.end_date ?? "");
  const [programTime, setProgramTime] = useState(offering.program_time ?? "");
  const [endTime,setEndTime] = useState(offering.program_end_time ?? "");
  const [mode,setMode] = useState(offering.mode ?? "");
  const [registrationOpen,setRegistrationOpen] = useState(offering.registration_open !== false);
  const [kind, setKind] = useState(offering.kind);
  const [flyer, setFlyer] = useState<File | null>(null);
  const [flyerPath, setFlyerPath] = useState(offering.flyer_path);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  async function uploadImage(file: File | null = flyer) {
    if (!file || busy) return;
    setFlyer(file);
    setUploading(true);
    setBusy(true); setMessage("");
    try { setFlyerPath(await uploadProgramFlyer(file)); setFlyer(null); setMessage("Image uploaded. Save the program to publish it."); }
    catch (err) { setMessage(enrollmentError(err)); } finally { setBusy(false); setUploading(false); }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setMessage("");
    const amount = Number(price);
    if (!price.trim() || !Number.isFinite(amount) || amount < 0 || amount > 99999999.99) { setMessage("Enter a valid fee of zero or more."); return; }
    if (!title.trim() || !description.trim() || !duration.trim()) { setMessage("Enter a title, description, and duration."); return; }
    if (endDate && (!startDate || endDate < startDate)) { setMessage("End date must be on or after the start date."); return; }
    setBusy(true);
    try {
      const db = createClient();
      let path = flyerPath;
      if (flyer) {
        path = await uploadProgramFlyer(flyer);
        setFlyerPath(path); setFlyer(null);
      }
      const { data, error } = await db.rpc("save_program", { p_offering_id: offering.id, p_values: { title: title.trim(), description: description.trim(), duration: duration.trim(), format: format.trim() || null, start_date: startDate || null, end_date: endDate || null, price: amount, is_active: active, kind, flyer_path: path, program_time: programTime || null, program_end_time: endTime || null, mode: mode || null, registration_open: registrationOpen } });
      if (error) throw error;
      if (!data) throw new Error("Course could not be saved.");
      await onSaved(); setMessage("Saved. Existing enrollment amounts are unchanged.");
    } catch (err) { setMessage(enrollmentError(err)); }
    finally { setBusy(false); }
  }
  return <div><form onSubmit={save} className="space-y-3 rounded-xl border border-[var(--card-border)] p-4">
    <h3 className="font-bold">{newProgram ? "Add a program or course" : offering.title}</h3>
    {newProgram && <label className="block text-sm">Catalog section<select className={fieldStyle} value={kind} onChange={event => setKind(event.target.value as Offering["kind"])}><option value="program">Program</option><option value="course">Course</option></select></label>}
    <div className="space-y-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
      <p className="text-sm font-semibold">Program image</p>
      {flyerPath && <ProgramFlyer path={flyerPath} title={title || "New program"} />}
      <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="sr-only" aria-label="Choose a program image" onChange={event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) void uploadImage(file);
      }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => imageInput.current?.click()}>{uploading ? "Uploading image..." : flyerPath ? "Replace image" : "Upload image"}</Button>
        {flyer && !uploading && <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void uploadImage()}>Retry upload</Button>}
        {uploading && <span role="status" className="text-xs text-[var(--muted)]">Uploading {flyer?.name}</span>}
      </div>
      <p className="text-xs text-[var(--muted)]">JPG, PNG or WebP, up to 5 MB. Save the program to publish the image.</p>
    </div>
    <label className="block text-sm">Title<input className={fieldStyle} required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} /></label>
    <label className="block text-sm">Program time (India time)<input className={fieldStyle} type="time" value={programTime} onChange={event => setProgramTime(event.target.value)} /></label>
    <label className="block text-sm">Program end time (India time)<input className={fieldStyle} type="time" value={endTime} onChange={event=>setEndTime(event.target.value)}/></label>
    <label className="block text-sm">Program mode<select className={fieldStyle} value={mode} onChange={event=>setMode(event.target.value as typeof mode)}><option value="">To be confirmed</option><option value="online">Online / Zoom</option><option value="offline">Offline / in person</option></select></label>
    {/* Writes the same offerings.registration_open flag as before; worded by what
        members see, because "Upcoming" is the member-facing result of closing it. */}
    <label className="block text-sm">Listing status<select className={fieldStyle} value={registrationOpen ? "open" : "upcoming"} onChange={event=>setRegistrationOpen(event.target.value === "open")}><option value="open">Open for registration — members can enroll</option><option value="upcoming">Upcoming — shown as &quot;Upcoming&quot;, no enrollment yet</option></select><span className="mt-1 block text-xs text-[var(--muted)]">{registrationOpen ? "Members see the fee and an enroll button." : "Members see an Upcoming badge and “Fee to be announced”; enrollment stays blocked."}</span></label>
    <label className="block text-sm">Description<textarea className={fieldStyle} required maxLength={5000} rows={4} value={description} onChange={event => setDescription(event.target.value)} /></label>
    <label className="block text-sm">Duration<input className={fieldStyle} required maxLength={100} value={duration} onChange={event => setDuration(event.target.value)} placeholder="For example, 2 Days or 6 Months" /></label>
    <label className="block text-sm">Format / venue<input className={fieldStyle} maxLength={200} value={format} onChange={event => setFormat(event.target.value)} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Start date (optional)<input className={fieldStyle} type="date" value={startDate} onChange={event => setStartDate(event.target.value)} /></label><label className="block text-sm">End date (optional)<input className={fieldStyle} type="date" min={startDate || undefined} value={endDate} onChange={event => setEndDate(event.target.value)} /></label></div>
    <label className="block text-sm">Fee (INR, zero means Free)<input className={fieldStyle} type="number" min="0" max="99999999.99" step="0.01" required value={price} onChange={event => setPrice(event.target.value)} /></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />Available for new enrollments</label>
    <p className="text-xs text-[var(--muted)]">Available programs are published automatically to member dashboards when saved.</p>
    <Button size="sm" type="submit" disabled={busy}>{busy ? "Saving…" : newProgram ? "Add & publish program" : "Update & publish"}</Button>{message && <p role="status" className="text-sm">{message}</p>}
  </form>{offering.code==="FSP-30DC" && <details className="mt-3 rounded-xl border border-[var(--card-border)] p-4"><summary className="cursor-pointer font-semibold">Edit 30 daily tasks</summary><div className="mt-4"><DailyTaskEditor offeringId={offering.id}/></div></details>}</div>;
}

export function PaymentReview({ row, onReviewed }: { row: OfferingEnrollment; onReviewed: () => Promise<void> }) {
  const [note, setNote] = useState("");
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function review(approve: boolean) {
    if (busy || (approve && !verified)) return;
    setBusy(true); setError("");
    try {
      await enrollmentAction("review_enrollment_payment", { p_enrollment_id: row.id, p_approve: approve, p_note: note.trim() });
      await onReviewed();
    } catch (err) { setError(enrollmentError(err)); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 space-y-3 border-t border-[var(--card-border)] pt-4">
    <p className="text-sm">Transaction reference: <strong>{row.payment_reference}</strong></p>
    <PaymentReceiptLink path={row.receipt_path} />
    <label className="block text-sm">Review note (required when returning a payment)<textarea className={fieldStyle} maxLength={1000} value={note} onChange={event => setNote(event.target.value)} /></label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={verified} onChange={event => setVerified(event.target.checked)} />I verified receipt of {feeLabel(row.amount, row.currency)} against this reference.</label>
    <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy || !verified} onClick={() => void review(true)}>{busy ? "Saving…" : "Approve & activate"}</Button><Button size="sm" variant="outline" disabled={busy || !note.trim()} onClick={() => void review(false)}>Return for correction</Button></div>
    {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
  </div>;
}

export function EnrollmentManagement({ paymentsOnly = false, setupOnly = false, onProgramChanged }: { paymentsOnly?: boolean; setupOnly?: boolean; onProgramChanged?: () => Promise<void> }) {
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState<Offering>(() => ({ id: crypto.randomUUID(),code:"",title:"",description:"",kind:"program",duration:"",format:null,price:0,currency:"INR",is_active:true,start_date:null,end_date:null,flyer_path:null }));
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [enrollments, setEnrollments] = useState<OfferingEnrollment[]>([]);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("payment_review");
  const refresh = useCallback(async () => {
    try {
      const data = await loadEnrollmentData(true);
      setError("");
      setOfferings(data.offerings); setEnrollments(data.enrollments); setInstructions(data.instructions);
    } catch (err) { setError(enrollmentError(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(() => refresh()); }, [refresh]);
  async function saveInstructions(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    try {
      const { error } = await createClient().from("enrollment_payment_settings").update({ instructions: instructions.trim() }).eq("id", 1).select("id").single();
      if (error) throw error;
      setMessage("Payment instructions saved.");
    } catch (err) { setError(enrollmentError(err)); }
    finally { setSaving(false); }
  }
  const rows = enrollments.filter(row => filter === "all" || row.status === filter);
  return <div className="space-y-6">
    <div className="flex flex-wrap justify-between gap-4"><div><h1 className="fsp-dot text-3xl font-black">{setupOnly ? "Program Setup" : paymentsOnly ? "Payments & Approvals" : "Courses & Enrollments"}</h1><p className="mt-2 text-sm text-[var(--muted)]">Manage fees, payment instructions, and member registrations.</p></div><Button variant="outline" size="sm" className="h-8 shrink-0 self-start" disabled={loading || saving} onClick={() => { setLoading(true); void refresh(); }}>Refresh</Button></div>
    {error && <p role="alert" className="rounded-xl border border-[var(--danger)] p-4 text-sm text-[var(--danger)]">{error}</p>}{message && <p role="status" className="text-sm text-[var(--success)]">{message}</p>}
    {loading ? <p role="status">Loading enrollments…</p> : <>
      {!paymentsOnly && <Card className="space-y-4 p-5"><h2 className="fsp-dot text-xl font-bold">Payment instructions</h2><form onSubmit={saveInstructions} className="space-y-3"><label htmlFor="payment-instructions" className="block text-sm">Provide official UPI / bank details, payee name, and a support contact. Members see these after confirming a paid enrollment.</label><textarea id="payment-instructions" className={fieldStyle} rows={5} maxLength={4000} value={instructions} onChange={event => setInstructions(event.target.value)} placeholder="Enter your official payment details" /><Button size="sm" type="submit" disabled={saving || Boolean(error)}>{saving ? "Saving…" : "Save instructions"}</Button></form></Card>}
      {!paymentsOnly && <section className="space-y-4"><div className="flex items-center justify-between gap-3"><h2 className="fsp-dot text-xl font-bold">Programs &amp; Updates</h2><Button size="sm" variant="outline" onClick={() => setShowAdd(value => !value)}>{showAdd ? "Cancel" : "Add Program"}</Button></div><p className="text-sm text-[var(--muted)]">Create or update a program and flyer. Available programs are shared automatically on all member dashboards.</p>{showAdd && <OfferingEditor key={draft.id} offering={draft} newProgram onSaved={async () => { await refresh(); await onProgramChanged?.(); setShowAdd(false); setDraft(previous => ({ ...previous, id: crypto.randomUUID() })); setMessage("Program published to the catalog and all member dashboards."); }} />}<div className="grid gap-4 md:grid-cols-2">{offerings.map(offering => <OfferingEditor key={JSON.stringify(offering)} offering={offering} onSaved={async () => { await refresh(); await onProgramChanged?.(); setMessage("Program updated in the catalog and member dashboard updates."); }} />)}</div></section>}
      {!setupOnly && <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="fsp-dot text-xl font-bold">Enrollments</h2><label className="text-sm">Status <select className="ml-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-2" value={filter} onChange={event => setFilter(event.target.value)}><option value="payment_review">Awaiting review</option><option value="pending_payment">Pending payment</option><option value="active">Active</option><option value="all">All</option></select></label></div>
        {!rows.length && <Card className="p-5 text-sm text-[var(--muted)]">No enrollments in this category.</Card>}
        {rows.map(row => <Card key={row.id} className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-bold">{row.offerings.title}</h3><p className="mt-1 text-sm">{[row.members?.first_name, row.members?.last_name].filter(Boolean).join(" ") || "Member"} · {feeLabel(row.amount, row.currency)}</p><p className="mt-1 text-xs text-[var(--muted)]">Enrollment: {row.id} · {new Date(row.created_at).toLocaleDateString("en-IN")}</p></div><Badge variant={row.status === "active" ? "success" : "warning"}>{statusLabel(row.status)}</Badge></div>{row.review_note && <p className="mt-3 text-sm">Review note: {row.review_note}</p>}{row.status === "payment_review" && <PaymentReview row={row} onReviewed={refresh} />}</Card>)}
      </section>}
    </>}
  </div>;
}
