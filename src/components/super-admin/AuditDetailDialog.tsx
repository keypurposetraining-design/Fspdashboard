"use client";

import React, { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Pill } from "@/components/ui/StatusBadge";
import { DescriptionList } from "@/components/ui/PageHeader";
import { formatDate } from "@/components/ui/Timeline";
import { ROLE_LABEL } from "@/lib/status";
import type { AuditLogEntry } from "@/lib/data/types";
import { auditMeta, auditReason, SETTING_LABEL } from "@/components/super-admin/auditLabels";

// Keys rendered in their own rows; anything else in details is listed under "Other details".
const KNOWN_KEYS = new Set(["old_value", "new_value", "reason", "actor_role", "target_email", "key"]);

/** Read-only detail view of one audit entry. */
export function AuditDetailDialog({ entry, onClose }: { entry: AuditLogEntry | null; onClose: () => void }) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!entry) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [entry, onClose]);

  if (!entry) return null;

  const meta = auditMeta(entry.action);
  const d = entry.details ?? {};
  const actorRole = typeof d.actor_role === "string" ? d.actor_role : null;
  const others = Object.entries(d).filter(([k]) => !KNOWN_KEYS.has(k));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--card-border)] px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)]">
              Audit entry
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Pill tone={meta.tone} size="sm">
                {meta.label}
              </Pill>
              <span className="text-xs text-[var(--muted)]">{formatDate(entry.performed_at, true)}</span>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--muted-light)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <DescriptionList
            items={[
              {
                label: "Performed by",
                value: entry.users
                  ? `${entry.users.name?.trim() ? `${entry.users.name} · ` : ""}${entry.users.email}`
                  : entry.performed_by
                    ? "Unknown user"
                    : "System",
              },
              { label: "Actor role", value: actorRole ? ROLE_LABEL[actorRole] ?? actorRole : null },
              {
                label: "Entity",
                value: (
                  <span className="font-mono text-xs">
                    {entry.table_name}
                    {entry.record_id ? ` · ${entry.record_id}` : ""}
                  </span>
                ),
              },
              ...(typeof d.target_email === "string" ? [{ label: "Target account", value: d.target_email }] : []),
              ...(typeof d.key === "string"
                ? [{ label: "Setting", value: `${SETTING_LABEL[d.key] ?? d.key} (${d.key})` }]
                : []),
              { label: "Reason", value: auditReason(entry) },
            ]}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ValueBlock title="Old value" value={d.old_value} />
            <ValueBlock title="New value" value={d.new_value} />
          </div>

          {others.length > 0 && (
            <ValueBlock title="Other details" value={Object.fromEntries(others)} />
          )}

          <p className="text-xs text-[var(--muted)]">Audit entries are append-only and cannot be edited or deleted.</p>
        </div>
      </div>
    </div>
  );
}

function ValueBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)]">
      <h3 className="border-b border-[var(--card-border)] bg-[var(--muted-light)]/60 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
        {title}
      </h3>
      <div className="p-3">
        <KeyValues value={value} />
      </div>
    </div>
  );
}

function KeyValues({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <p className="text-sm text-[var(--muted)]">None</p>;
  if (typeof value !== "object" || Array.isArray(value)) {
    return <p className="break-words font-mono text-xs text-[var(--foreground)]">{formatScalar(value)}</p>;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <p className="text-sm text-[var(--muted)]">None</p>;
  return (
    <dl className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 text-xs">
          <dt className="truncate font-mono text-[var(--muted)]" title={k}>
            {k}
          </dt>
          <dd className="whitespace-pre-wrap break-words font-mono text-[var(--foreground)]">{formatScalar(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return JSON.stringify(v, null, 2);
}
