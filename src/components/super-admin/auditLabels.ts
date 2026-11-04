// Human labels and tones for audit_logs.action values, shared by the
// super-admin overview, audit log and security pages.

import type { Tone } from "@/lib/status";
import { ROLE_LABEL } from "@/lib/status";
import type { AuditLogEntry } from "@/lib/data/types";
import type { ActivityEvent } from "@/components/ui/Timeline";

export interface AuditActionMeta {
  label: string;
  tone: Tone;
}

export const AUDIT_ACTIONS: Record<string, AuditActionMeta> = {
  APPLICATION_SUBMITTED: { label: "Application submitted", tone: "info" },
  APPLICATION_UNDER_REVIEW: { label: "Application under review", tone: "warning" },
  APPLICATION_APPROVED: { label: "Application approved", tone: "success" },
  APPLICATION_REJECTED: { label: "Application rejected", tone: "danger" },
  APPLICATION_CHANGES_REQUESTED: { label: "Changes requested", tone: "warning" },
  DOCUMENT_UPLOADED: { label: "Document uploaded", tone: "info" },
  DOCUMENT_APPROVED: { label: "Document approved", tone: "success" },
  DOCUMENT_REJECTED: { label: "Document rejected", tone: "danger" },
  PROFILE_UPDATED: { label: "Profile updated", tone: "neutral" },
  MEMBERSHIP_UPDATED: { label: "Membership updated", tone: "info" },
  MEMBER_CREATED: { label: "Member created", tone: "success" },
  ROLE_CHANGED: { label: "Role changed", tone: "warning" },
  USER_ENABLED: { label: "Account enabled", tone: "success" },
  USER_DISABLED: { label: "Account disabled", tone: "danger" },
  SETTINGS_CHANGED: { label: "Settings changed", tone: "info" },
};

export const ACCESS_ACTIONS = ["ROLE_CHANGED", "USER_DISABLED", "USER_ENABLED"] as const;

export function auditMeta(action: string): AuditActionMeta {
  return (
    AUDIT_ACTIONS[action] ?? {
      // Unknown actions still read as words rather than SHOUTY_SNAKE_CASE.
      label: action
        .toLowerCase()
        .split("_")
        .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
        .join(" "),
      tone: "neutral",
    }
  );
}

export function actorLabel(entry: AuditLogEntry): string {
  if (entry.users) return entry.users.name?.trim() || entry.users.email;
  return entry.performed_by ? "Unknown user" : "System";
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

export function auditReason(entry: AuditLogEntry): string | null {
  const r = entry.details?.reason;
  return typeof r === "string" && r.trim() ? r.trim() : null;
}

/** One-line summary for feeds, e.g. "jane@x.org: Admin → Super Admin". */
export function describeAuditEntry(entry: AuditLogEntry): string {
  const d = entry.details ?? {};
  const oldV = asRecord(d.old_value);
  const newV = asRecord(d.new_value);
  if (entry.action === "ROLE_CHANGED" || entry.action === "USER_ENABLED" || entry.action === "USER_DISABLED") {
    const target = typeof d.target_email === "string" ? d.target_email : "A user";
    if (entry.action === "ROLE_CHANGED" && oldV && newV) {
      const from = ROLE_LABEL[String(oldV.role)] ?? String(oldV.role);
      const to = ROLE_LABEL[String(newV.role)] ?? String(newV.role);
      return `${target}: ${from} → ${to}`;
    }
    return target;
  }
  if (entry.action === "SETTINGS_CHANGED") {
    const key = typeof d.key === "string" ? d.key : "setting";
    return SETTING_LABEL[key] ?? key;
  }
  return entry.table_name;
}

export const SETTING_LABEL: Record<string, string> = {
  renewal_fee: "Renewal fee",
  membership_term_months: "Membership term",
};

/** Audit rows → ActivityFeed events (title, actor and reason). */
export function toActivityEvents(rows: AuditLogEntry[]): ActivityEvent[] {
  return rows.map((r) => {
    const meta = auditMeta(r.action);
    const reason = auditReason(r);
    return {
      id: r.id,
      title: `${meta.label} — ${describeAuditEntry(r)}`,
      detail: `By ${actorLabel(r)}${reason ? ` · “${reason}”` : ""}`,
      at: r.performed_at,
      tone: meta.tone,
    };
  });
}
