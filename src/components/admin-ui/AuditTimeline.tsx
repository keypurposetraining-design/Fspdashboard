import React from "react";
import { cn } from "@/lib/utils";
import { StatusIconGlyph, TONE_ICON_CLASSES } from "@/components/ui/StatusBadge";
import { formatDate, formatRelative } from "@/components/ui/Timeline";
import { DOCUMENT_TYPES, ROLE_LABEL, type StatusIcon, type Tone } from "@/lib/status";
import { PROFILE_FIELDS } from "@/lib/profile";
import type { AuditLogEntry, DocumentType } from "@/lib/data/types";

interface ActionMeta {
  label: string;
  tone: Tone;
  icon: StatusIcon;
}

/** Readable labels for audit actions written by the RPCs, triggers and API routes. */
export const AUDIT_ACTIONS: Record<string, ActionMeta> = {
  MEMBER_CREATED: { label: "Member account created", tone: "success", icon: "check" },
  PROFILE_UPDATED: { label: "Profile updated", tone: "neutral", icon: "edit" },
  APPLICATION_SUBMITTED: { label: "Application submitted", tone: "info", icon: "clock" },
  APPLICATION_UNDER_REVIEW: { label: "Review started", tone: "warning", icon: "clock" },
  APPLICATION_APPROVED: { label: "Application approved", tone: "success", icon: "check" },
  APPLICATION_REJECTED: { label: "Application rejected", tone: "danger", icon: "x" },
  APPLICATION_CHANGES_REQUESTED: { label: "Changes requested", tone: "warning", icon: "alert" },
  DOCUMENT_UPLOADED: { label: "Document uploaded", tone: "info", icon: "dot" },
  DOCUMENT_APPROVED: { label: "Document approved", tone: "success", icon: "check" },
  DOCUMENT_REJECTED: { label: "Document rejected", tone: "danger", icon: "x" },
  MEMBERSHIP_UPDATED: { label: "Membership updated", tone: "info", icon: "check" },
  ROLE_CHANGED: { label: "Role changed", tone: "warning", icon: "alert" },
  USER_ENABLED: { label: "Account enabled", tone: "success", icon: "check" },
  USER_DISABLED: { label: "Account disabled", tone: "danger", icon: "pause" },
  SETTINGS_CHANGED: { label: "Settings changed", tone: "neutral", icon: "edit" },
};

export function auditActionMeta(action: string): ActionMeta {
  return (
    AUDIT_ACTIONS[action] ?? {
      label: action
        .toLowerCase()
        .split("_")
        .filter(Boolean)
        .join(" ")
        .replace(/^\w/, (c) => c.toUpperCase()),
      tone: "neutral",
      icon: "dot",
    }
  );
}

type Details = Record<string, unknown>;
const obj = (v: unknown): Details | null => (v && typeof v === "object" ? (v as Details) : null);
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const humanize = (v: unknown) => String(v ?? "none").replace(/_/g, " ");

/** One-line summary of what changed, derived from the audit details payload. */
function describe(entry: AuditLogEntry): string | null {
  const d = obj(entry.details) ?? {};
  const oldV = obj(d.old_value);
  const newV = obj(d.new_value);
  const docType = str(d.document_type) as DocumentType | null;

  if (entry.action.startsWith("DOCUMENT_") && docType) {
    return DOCUMENT_TYPES[docType]?.label ?? humanize(docType);
  }
  if (entry.action === "PROFILE_UPDATED" && newV) {
    const keys = Object.keys(newV).filter((k) => k !== "user_id");
    const labels = keys.map((k) => PROFILE_FIELDS[k as keyof typeof PROFILE_FIELDS]?.label ?? humanize(k));
    if (labels.length === 0) return null;
    return `Changed ${labels.slice(0, 4).join(", ")}${labels.length > 4 ? ` and ${labels.length - 4} more` : ""}`;
  }
  if (entry.action === "ROLE_CHANGED") {
    const from = str(oldV?.role);
    const to = str(newV?.role);
    if (to) return `${from ? ROLE_LABEL[from] ?? from : "—"} → ${ROLE_LABEL[to] ?? to}`;
  }
  if (newV && "status" in newV) {
    const to = humanize(newV.status);
    return oldV && "status" in oldV ? `Status: ${humanize(oldV.status)} → ${to}` : `Status: ${to}`;
  }
  return null;
}

function actorName(entry: AuditLogEntry): string {
  const d = obj(entry.details);
  if (d?.self_edit === true) return "the member";
  return entry.users?.name?.trim() || entry.users?.email || (entry.performed_by ? "Unknown user" : "System");
}

/** Readable, most-recent-first audit trail: action, actor, time, change and reason. */
export function AuditTimeline({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <ol className="space-y-5">
      {entries.map((e) => {
        const meta = auditActionMeta(e.action);
        const summary = describe(e);
        const reason = str(obj(e.details)?.reason);
        return (
          <li key={e.id} className="flex gap-3">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                TONE_ICON_CLASSES[meta.tone]
              )}
            >
              <StatusIconGlyph icon={meta.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{meta.label}</p>
                <time
                  dateTime={e.performed_at}
                  title={formatDate(e.performed_at, true)}
                  className="shrink-0 text-xs text-[var(--muted)]"
                >
                  {formatRelative(e.performed_at)}
                </time>
              </div>
              <p className="text-xs text-[var(--muted)]">
                By {actorName(e)}
                {summary && <> · {summary}</>}
              </p>
              {reason && (
                <p className="mt-1.5 rounded-lg bg-[var(--muted-light)] px-3 py-2 text-sm text-[var(--foreground)]">
                  <span className="font-medium">Reason:</span> {reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
