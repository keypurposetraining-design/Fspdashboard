// Admin data access. RLS (is_admin()) and the SECURITY DEFINER RPCs re-check
// the caller's trusted role on every call; hiding admin pages in the UI is
// only a convenience.

import { createClient } from "@/lib/supabase/client";
import { toDataError, unwrap } from "@/lib/data/errors";
import type {
  AdminDashboardStats,
  AdminMemberRow,
  ApplicationStatus,
  AuditLogEntry,
  DocumentStatus,
  MemberDocument,
  MemberProfile,
  Membership,
  MembershipApplication,
  MonthlySeriesRow,
} from "@/lib/data/types";

const supabase = () => createClient();

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const res = await supabase().rpc("admin_dashboard_stats");
  return unwrap(res, "getDashboardStats") as AdminDashboardStats;
}

export async function getMonthlySeries(from: Date, to: Date): Promise<MonthlySeriesRow[]> {
  // Local calendar date (toISOString would shift to UTC and can change the day/month).
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const res = await supabase().rpc("admin_monthly_series", { p_from: iso(from), p_to: iso(to) });
  const rows = (unwrap(res, "getMonthlySeries") ?? []) as MonthlySeriesRow[];
  return rows.map((r) => ({
    ...r,
    new_members: Number(r.new_members),
    applications_submitted: Number(r.applications_submitted),
    applications_approved: Number(r.applications_approved),
    applications_rejected: Number(r.applications_rejected),
    documents_uploaded: Number(r.documents_uploaded),
  }));
}

export interface MemberSearchParams {
  search?: string;
  membership?: string | null;
  application?: string | null;
  sort?: "name" | "member_number" | "created_at" | "updated_at";
  desc?: boolean;
  page: number;
  pageSize: number;
}

export async function searchMembers(p: MemberSearchParams): Promise<{ total: number; rows: AdminMemberRow[] }> {
  const res = await supabase().rpc("admin_search_members", {
    p_search: p.search?.trim() || null,
    p_membership: p.membership || null,
    p_application: p.application || null,
    p_sort: p.sort ?? "created_at",
    p_desc: p.desc ?? true,
    p_limit: p.pageSize,
    p_offset: (p.page - 1) * p.pageSize,
  });
  const data = unwrap(res, "searchMembers") as { total: number; rows: AdminMemberRow[] };
  return { total: Number(data?.total ?? 0), rows: data?.rows ?? [] };
}

export interface MemberDetail {
  profile: MemberProfile & { users: { email: string; name: string | null; role: string; is_active?: boolean } | null };
  memberships: Membership[];
  applications: MembershipApplication[];
  documents: MemberDocument[];
}

export async function getMemberDetail(memberId: string): Promise<MemberDetail | null> {
  const db = supabase();
  const profileRes = await db.from("members").select("*, users!members_user_id_fkey(*)").eq("id", memberId).maybeSingle();
  const profile = unwrap(profileRes, "getMemberDetail.profile");
  if (!profile) return null;

  const [ms, apps, docs] = await Promise.all([
    db.from("memberships").select("*").eq("member_id", memberId).order("created_at", { ascending: false }),
    db.from("membership_applications").select("*").eq("member_id", memberId).order("created_at", { ascending: false }),
    db.from("member_documents").select("*").eq("member_id", memberId).order("uploaded_at", { ascending: false }),
  ]);

  return {
    profile: profile as MemberDetail["profile"],
    memberships: (unwrap(ms, "getMemberDetail.memberships") ?? []) as Membership[],
    // Applications/documents may not exist before migration 004; degrade to empty lists.
    applications: (apps.error ? [] : apps.data ?? []) as MembershipApplication[],
    documents: (docs.error ? [] : docs.data ?? []) as MemberDocument[],
  };
}

/** Audit entries about one member (their member row, applications, documents, memberships). */
export async function getMemberActivity(detail: MemberDetail, limit = 50): Promise<AuditLogEntry[]> {
  const ids = [
    detail.profile.id,
    ...detail.applications.map((a) => a.id),
    ...detail.documents.map((d) => d.id),
    ...detail.memberships.map((m) => m.id),
  ];
  const res = await supabase()
    .from("audit_logs")
    .select("*, users:performed_by(name, email)")
    .in("record_id", ids)
    .order("performed_at", { ascending: false })
    .limit(limit);
  return (unwrap(res, "getMemberActivity") ?? []) as AuditLogEntry[];
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export type ApplicationWithMember = MembershipApplication & {
  members: Pick<MemberProfile, "id" | "user_id" | "first_name" | "last_name" | "member_number" | "avatar_url"> & {
    users: { email: string } | null;
  };
};

export async function listApplications(opts: {
  statuses?: ApplicationStatus[];
  page: number;
  pageSize: number;
  oldestFirst?: boolean;
}): Promise<{ total: number; rows: ApplicationWithMember[] }> {
  let q = supabase()
    .from("membership_applications")
    .select("*, members!inner(id, user_id, first_name, last_name, member_number, avatar_url, users!members_user_id_fkey(email))", {
      count: "exact",
    })
    .neq("status", "draft");
  if (opts.statuses?.length) q = q.in("status", opts.statuses);
  const from = (opts.page - 1) * opts.pageSize;
  const res = await q
    .order("submitted_at", { ascending: opts.oldestFirst ?? true, nullsFirst: false })
    .range(from, from + opts.pageSize - 1);
  if (res.error) throw toDataError(res.error, "listApplications");
  return { total: res.count ?? 0, rows: (res.data ?? []) as ApplicationWithMember[] };
}

export async function getApplicationForReview(id: string): Promise<ApplicationWithMember | null> {
  const res = await supabase()
    .from("membership_applications")
    .select("*, members!inner(*, users!members_user_id_fkey(email, name, role))")
    .eq("id", id)
    .maybeSingle();
  return unwrap(res, "getApplicationForReview") as ApplicationWithMember | null;
}

export async function reviewApplication(
  id: string,
  decision: Extract<ApplicationStatus, "under_review" | "approved" | "rejected" | "changes_requested">,
  reason?: string
): Promise<void> {
  const res = await supabase().rpc("review_application", {
    p_application_id: id,
    p_decision: decision,
    p_reason: reason?.trim() || null,
  });
  unwrap(res, "reviewApplication");
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export type DocumentWithMember = MemberDocument & {
  members: Pick<MemberProfile, "id" | "user_id" | "first_name" | "last_name" | "member_number">;
};

export async function listDocuments(opts: {
  status?: DocumentStatus | null;
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{ total: number; rows: DocumentWithMember[] }> {
  let q = supabase()
    .from("member_documents")
    .select("*, members!inner(id, user_id, first_name, last_name, member_number)", { count: "exact" });
  if (opts.status) q = q.eq("status", opts.status);
  const s = opts.search?.trim().replace(/[%,()]/g, "");
  if (s) {
    q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,member_number.ilike.%${s}%`, {
      referencedTable: "members",
    });
  }
  const from = (opts.page - 1) * opts.pageSize;
  const res = await q.order("uploaded_at", { ascending: opts.status === "pending" }).range(from, from + opts.pageSize - 1);
  if (res.error) throw toDataError(res.error, "listDocuments");
  return { total: res.count ?? 0, rows: (res.data ?? []) as DocumentWithMember[] };
}

export async function reviewDocument(id: string, decision: "approved" | "rejected", reason?: string): Promise<void> {
  const res = await supabase().rpc("review_document", {
    p_document_id: id,
    p_decision: decision,
    p_reason: reason?.trim() || null,
  });
  unwrap(res, "reviewDocument");
}

/** Signed URL for review; storage RLS allows admins to read any member folder. */
export async function getDocumentUrlForReview(storagePath: string): Promise<string> {
  const res = await supabase().storage.from("member-documents").createSignedUrl(storagePath, 60);
  if (res.error || !res.data) throw toDataError(res.error, "getDocumentUrlForReview");
  return res.data.signedUrl;
}

// ---------------------------------------------------------------------------
// Audit log (RLS hides role/security/settings entries from ordinary admins)
// ---------------------------------------------------------------------------

export async function listAuditLogs(opts: {
  action?: string | null;
  from?: string | null;
  to?: string | null;
  page: number;
  pageSize: number;
}): Promise<{ total: number; rows: AuditLogEntry[] }> {
  let q = supabase()
    .from("audit_logs")
    .select("*, users:performed_by(name, email)", { count: "exact" });
  if (opts.action) q = q.eq("action", opts.action);
  if (opts.from) q = q.gte("performed_at", opts.from);
  if (opts.to) q = q.lte("performed_at", opts.to);
  const start = (opts.page - 1) * opts.pageSize;
  const res = await q.order("performed_at", { ascending: false }).range(start, start + opts.pageSize - 1);
  if (res.error) throw toDataError(res.error, "listAuditLogs");
  return { total: res.count ?? 0, rows: (res.data ?? []) as AuditLogEntry[] };
}
