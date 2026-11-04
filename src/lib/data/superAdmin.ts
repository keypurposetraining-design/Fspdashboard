// Super-admin data access. Role changes go only through set_user_role()
// (001_security_hotfix.sql), which re-checks is_super_admin(), refuses to
// remove the last super admin, and writes the audit row.

import { createClient } from "@/lib/supabase/client";
import { toDataError, unwrap } from "@/lib/data/errors";
import type { AppRole, AppUserRow } from "@/lib/data/types";

const supabase = () => createClient();

export async function listUsers(opts: {
  roles?: AppRole[];
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{ total: number; rows: AppUserRow[] }> {
  // select("*") so the page still works before is_active exists (pre-001).
  let q = supabase().from("users").select("*", { count: "exact" });
  if (opts.roles?.length) q = q.in("role", opts.roles);
  const s = opts.search?.trim().replace(/[%,()]/g, "");
  if (s) q = q.or(`email.ilike.%${s}%,name.ilike.%${s}%`);
  const from = (opts.page - 1) * opts.pageSize;
  const res = await q.order("created_at", { ascending: false }).range(from, from + opts.pageSize - 1);
  if (res.error) throw toDataError(res.error, "listUsers");
  return { total: res.count ?? 0, rows: (res.data ?? []) as AppUserRow[] };
}

export async function setUserRole(opts: {
  userId: string;
  role: AppRole;
  isActive?: boolean | null;
  reason: string;
}): Promise<void> {
  const res = await supabase().rpc("set_user_role", {
    p_user_id: opts.userId,
    p_role: opts.role,
    p_is_active: opts.isActive ?? null,
    p_reason: opts.reason.trim() || null,
  });
  unwrap(res, "setUserRole");
}

export interface SettingRow {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

export async function listSettings(): Promise<SettingRow[]> {
  const res = await supabase().from("app_settings").select("*").order("key");
  return (unwrap(res, "listSettings") ?? []) as SettingRow[];
}

/** RLS: renewal_fee is admin-editable; every other key is super-admin only. Audited by trigger. */
export async function updateSetting(key: string, value: Record<string, unknown>): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  const res = await supabase()
    .from("app_settings")
    .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: auth.user?.id ?? null });
  unwrap(res, "updateSetting");
}

export interface SyncIssue {
  id: string;
  auth_user_id: string;
  email: string | null;
  issue: string;
  detail: string | null;
  created_at: string;
  resolved_at: string | null;
}

export async function listSyncIssues(includeResolved = false): Promise<SyncIssue[]> {
  let q = supabase().from("auth_sync_issues").select("*").order("created_at", { ascending: false }).limit(100);
  if (!includeResolved) q = q.is("resolved_at", null);
  return (unwrap(await q, "listSyncIssues") ?? []) as SyncIssue[];
}

export async function resolveSyncIssue(id: string): Promise<void> {
  const { data: auth } = await supabase().auth.getUser();
  const res = await supabase()
    .from("auth_sync_issues")
    .update({ resolved_at: new Date().toISOString(), resolved_by: auth.user?.id ?? null })
    .eq("id", id);
  unwrap(res, "resolveSyncIssue");
}
