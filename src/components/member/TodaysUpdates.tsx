"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/useAsync";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { enrollmentError, uploadProgramFlyer, programTimeLabel } from "@/lib/data/enrollments";

type Update = { id: string; title: string; message: string; program_date: string | null; location: string | null; flyer_path: string | null; is_published: boolean; created_at: string; expires_at?: string | null; program_time?: string | null; offering_id?: string | null };
async function loadUpdates() {
  const { data, error } = await createClient().from("member_updates").select("*").order("created_at", { ascending: false }).limit(30);
  if (error) throw error;
  return data as Update[];
}
export function ProgramFlyer({ path, title, onOpen }: { path: string; title: string; onOpen?: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => void createClient().storage.from("program-flyers").createSignedUrl(path, 3600).then(({ data, error }) => {
      if (!active) return;
      if (error) setError("Flyer could not be loaded.");
      else { setUrl(data.signedUrl); setError(""); }
    });
    load(); const timer = setInterval(load, 50 * 60 * 1000);
    return () => { active = false; clearInterval(timer); };
  }, [path]);
  if (error) return <p role="status" className="text-sm">{error}</p>;
  if (!url) return <p className="text-sm">Loading flyer…</p>;
  const poster = <>
    {/* Private Supabase flyers use temporary signed URLs. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={url} alt={`${title} program flyer`} className="mx-auto max-h-[480px] w-full rounded-xl object-contain" />
  </>;
  return onOpen ? <button type="button" onClick={onOpen} aria-label={`View program details: ${title}`} className="block w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]">{poster}</button> : <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open flyer for ${title}`}>{poster}</a>;
}

export function TodaysUpdates({ admin = false, announcementsOnly = false }: { admin?: boolean; announcementsOnly?: boolean }) {
  const { role } = useAuth();
  const isManager = role === "admin" || role === "super_admin";
  const { data, error, loading, reload } = useAsync(loadUpdates, []);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [flyer, setFlyer] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState === 'hidden') return; setNow(Date.now()); reload(); }, 60000); return () => clearInterval(timer); }, [reload]);
  useEffect(() => {
    const next = data?.map(update => update.expires_at ? Date.parse(update.expires_at) : Infinity).filter(time => time > Date.now()).sort((a,b) => a-b)[0];
    if (!next || !Number.isFinite(next)) return;
    const timer = setTimeout(() => { setNow(Date.now()); reload(); }, Math.min(next - Date.now() + 50, 2147483647));
    return () => clearTimeout(timer);
  }, [data,reload]);
  async function uploadImage() {
    if (!flyer || busy) return;
    setBusy(true); setActionError("");
    try { setUploadedPath(await uploadProgramFlyer(flyer)); setNotice("Image uploaded. Publish the update to share it."); }
    catch (err) { setActionError(enrollmentError(err)); } finally { setBusy(false); }
  }
  async function publish(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setNotice(""); setActionError("");
    try {
      const db = createClient(); let path = uploadedPath;
      if (flyer && !path) {
        if (!["image/jpeg","image/png","image/webp"].includes(flyer.type) || flyer.size > 5242880) throw new Error("Choose a JPG, PNG, or WebP flyer no larger than 5 MB.");
        const { data: { user } } = await db.auth.getUser();
        if (!user) throw new Error("Please sign in again.");
        const ext = flyer.type === "image/png" ? "png" : flyer.type === "image/webp" ? "webp" : "jpg";
        path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const upload = await db.storage.from("program-flyers").upload(path,flyer,{contentType:flyer.type,upsert:false});
        if (upload.error) throw upload.error;
        setUploadedPath(path);
      }
      const result = await db.rpc("publish_member_update", { p_title:title.trim(),p_message:message.trim(),p_program_date:date || null,p_location:location.trim() || null,p_flyer_path:path,p_program_time:time || null });
      if (result.error) throw result.error;
      setTitle(""); setMessage(""); setDate(""); setTime(""); setLocation(""); setFlyer(null); setUploadedPath(null); setFileKey(value => value + 1);
      setNotice("Published on every member dashboard. In-app notifications sent to active members."); reload();
    } catch (err) {
      const text = enrollmentError(err);
      setActionError(/bucket not found/i.test(text) ? "Flyer storage is not configured. Create the private program-flyers bucket in Supabase Storage, then try again." : text);
    }
    finally { setBusy(false); }
  }
  async function archive(id: string) {
    if (!window.confirm("Remove this update from member dashboards?")) return;
    setBusy(true); setActionError("");
    try { const { error } = await createClient().rpc("archive_member_update", {p_update_id:id}); if (error) throw error; reload(); }
    catch (err) { setActionError(enrollmentError(err)); } finally { setBusy(false); }
  }
  const field = "w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 text-sm";
  return <section className="my-6 space-y-4" aria-labelledby="todays-updates-title">
    <div className="flex items-center justify-between gap-3"><div><h2 id="todays-updates-title" className="text-xl font-bold">Today&apos;s Updates</h2><p className="mt-1 text-sm text-[var(--muted)]">Upcoming programs and announcements from FSP.</p></div><Button size="sm" variant="outline" disabled={loading || busy} onClick={reload}>Refresh</Button></div>
    {admin && <Card className="p-5"><form onSubmit={publish} className="space-y-4">
      <label className="block text-sm font-medium">Update title<input className={field} required maxLength={150} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label className="block text-sm font-medium">Program details / message<textarea className={field} rows={5} required maxLength={5000} value={message} onChange={event => setMessage(event.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm">Program date (optional)<input type="date" className={field} value={date} onChange={event => setDate(event.target.value)} /></label><label className="block text-sm">Venue / location (optional)<input className={field} maxLength={200} value={location} onChange={event => setLocation(event.target.value)} /></label></div>
      <label className="block text-sm">Flyer (optional, JPG/PNG/WebP, up to 5 MB)<input key={fileKey} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} className="mt-2 block w-full text-sm" onChange={event => {setFlyer(event.target.files?.[0] ?? null);setUploadedPath(null);}} /></label>
      <label className="block text-sm">Program time (India time)<input type="time" className={field} value={time} onChange={event => setTime(event.target.value)} /></label><p className="text-xs text-[var(--muted)]">Dated updates disappear at midnight after the program date (IST).</p><Button type="button" variant="secondary" disabled={busy || !flyer || Boolean(uploadedPath)} onClick={() => void uploadImage()}>Upload Image</Button>{uploadedPath && <p className="text-xs text-[var(--success)]">Image uploaded successfully.</p>}{flyer && <p className="text-xs">Attached: {flyer.name}</p>}<Button type="submit" disabled={busy || !title.trim() || !message.trim()}>{busy ? "Publishing…" : "Publish to all members"}</Button>
    </form></Card>}
    {notice && <p role="status" className="text-sm text-[var(--success)]">{notice}</p>}{actionError && <p role="alert" className="text-sm text-[var(--danger)]">{actionError}</p>}
    {error && <p role="alert" className="text-sm text-[var(--danger)]">Updates couldn&apos;t be loaded. {error.message} {admin && "Check that migrations 010–013 have been applied in Supabase."}</p>}
    {loading && !data && <p role="status">Loading updates…</p>}
    {data?.length === 0 && <Card className="p-5 text-sm text-[var(--muted)]">No updates yet. Upcoming program details will appear here.</Card>}
    <div className="grid gap-4 md:grid-cols-2">{data?.filter(update => (!announcementsOnly || !update.offering_id) && (admin || (update.is_published && (!update.expires_at || Date.parse(update.expires_at) > now)))).map(update => <Card key={update.id} className="space-y-4 p-5">
      <div><p className="text-xs text-[var(--muted)]">Posted {new Date(update.created_at).toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata"})}{!update.is_published && " · Archived"}</p><h3 className="mt-1 text-lg font-bold">{update.title}</h3></div>
      {update.flyer_path && <ProgramFlyer path={update.flyer_path} title={update.title} />}<p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{update.message}</p>
      {update.program_date && <p className="text-sm font-medium">Program date: {new Date(`${update.program_date}T00:00:00`).toLocaleDateString("en-IN")}</p>}{update.program_time && <p className="text-sm">Time: {programTimeLabel(update.program_time)}</p>}{update.location && <p className="text-sm">Venue: {update.location}</p>}
      {admin && update.is_published && <Button size="sm" variant="outline" disabled={busy} onClick={() => void archive(update.id)}>Archive update</Button>}
      {!admin && update.offering_id && <Link href={isManager ? "/admin/courses" : "/courses"} className="inline-block text-sm font-semibold underline">{isManager ? "Manage program" : "View programs & enroll"}</Link>}
    </Card>)}</div>
  </section>;
}
