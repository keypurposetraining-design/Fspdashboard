"use client";
import Link from "next/link";
import { useAsync } from "@/lib/useAsync";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/States";
import { TodaysUpdates } from "@/components/member/TodaysUpdates";

async function loadOverview() {
  const db = createClient();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const soon = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const results = await Promise.all([
    db.from("members").select("id, users!inner(role)", { count: "exact", head: true }).in("users.role", ["member", "trainer"]),
    db.from("offering_enrollments").select("id", { count: "exact", head: true }).eq("status", "payment_review"),
    db.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active").or(`end_date.is.null,end_date.gte.${today}`),
    db.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active").gte("end_date", today).lte("end_date", soon),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return results.map(result => result.count ?? 0);
}
export function ManagementOverview() {
  const { data, error, loading, reload } = useAsync(loadOverview, []);
  const cards = [
    { title: "Members", href: "/admin/members", detail: "View and manage member information." },
    { title: "Payments awaiting review", href: "/admin/payments", detail: "Verify screenshots and received payments." },
    { title: "Active memberships", href: "/admin/memberships", detail: "Check membership status and validity." },
    { title: "Expiring within 30 days", href: "/admin/memberships", detail: "Identify memberships that need renewal." },
  ];
  return <div className="space-y-6"><div className="flex items-start justify-between gap-3"><div><h1 className="fsp-dot text-3xl font-black">Admin Overview</h1><p className="mt-2 text-sm text-[var(--muted)]">Manage member records, verify payments, and publish updates.</p></div><Button size="sm" variant="outline" disabled={loading} onClick={reload}>Refresh</Button></div>
    {error && <ErrorState error={error} title="Could not load management totals" onRetry={reload} />}
    <TodaysUpdates />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map((card,index) => <Link href={card.href} key={card.href + index}><Card className="h-full space-y-3 p-5"><h2 className="text-sm font-semibold">{card.title}</h2><p className="text-3xl font-black">{data ? data[index] : loading ? "…" : "—"}</p><p className="text-sm text-[var(--muted)]">{card.detail}</p></Card></Link>)}</div>
    <Card className="space-y-3 p-5"><h2 className="fsp-dot text-xl font-bold">Daily management process</h2><ol className="list-decimal space-y-2 pl-5 text-sm"><li>Open Members to view or update a member’s profile.</li><li>Open Payment Approvals, inspect the screenshot, and verify the received amount.</li><li>Approve qualifying course payments to activate one-year membership, or return the payment with a reason.</li><li>Check Memberships for activation dates and upcoming expiry.</li><li>Publish program details and flyers in Today’s Updates.</li><li>Review the Activity Log when checking changes or approvals.</li></ol><div className="flex flex-wrap gap-4 pt-2 text-sm font-semibold"><Link href="/admin/payments" className="underline">Review payments</Link><Link href="/admin/updates" className="underline">Publish an update</Link><Link href="/admin/audit-logs" className="underline">View activity</Link></div></Card>
  </div>;
}
