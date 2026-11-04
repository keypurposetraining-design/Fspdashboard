// Small read helpers shared by the super-admin overview and security pages.

import { listAuditLogs } from "@/lib/data/admin";
import { listUsers } from "@/lib/data/superAdmin";
import type { AppUserRow, AuditLogEntry } from "@/lib/data/types";
import { ACCESS_ACTIONS } from "@/components/super-admin/auditLabels";

/**
 * Most recent role/access audit entries. listAuditLogs filters on a single
 * action, so we fetch the top `limit` of each access action in parallel and
 * merge; the newest `limit` overall are guaranteed to be in that set.
 */
export async function recentAccessChanges(limit = 8): Promise<AuditLogEntry[]> {
  const pages = await Promise.all(
    ACCESS_ACTIONS.map((action) => listAuditLogs({ action, page: 1, pageSize: limit }))
  );
  return pages
    .flatMap((p) => p.rows)
    .sort((a, b) => b.performed_at.localeCompare(a.performed_at))
    .slice(0, limit);
}

/** All admin and super-admin accounts (a small set; capped defensively). */
export async function listPrivilegedUsers(): Promise<AppUserRow[]> {
  const res = await listUsers({ roles: ["admin", "super_admin"], page: 1, pageSize: 200 });
  return res.rows;
}

/** users.is_active may not exist before migration 001; missing means active. */
export const isActive = (u: Pick<AppUserRow, "is_active">) => u.is_active !== false;

export const displayName = (u: Pick<AppUserRow, "name" | "email">) => u.name?.trim() || u.email;
