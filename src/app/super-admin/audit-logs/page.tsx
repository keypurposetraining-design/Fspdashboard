"use client";

import React, { useState } from "react";
import { ScrollText } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { DataTable, Pagination, type DataColumn } from "@/components/ui/DataTable";
import { FilterSelect } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/StatusBadge";
import { formatDate } from "@/components/ui/Timeline";
import { useAsync } from "@/lib/useAsync";
import { listAuditLogs } from "@/lib/data/admin";
import type { AuditLogEntry } from "@/lib/data/types";
import { AUDIT_ACTIONS, actorLabel, auditMeta, auditReason } from "@/components/super-admin/auditLabels";
import { AuditDetailDialog } from "@/components/super-admin/AuditDetailDialog";

const PAGE_SIZE = 50;

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  ...Object.entries(AUDIT_ACTIONS).map(([value, m]) => ({ value, label: m.label })),
];

/** <input type="date"> value (local day) → ISO instant at the start/end of that day. */
function dayBoundary(day: string, end: boolean): string | null {
  if (!day) return null;
  const d = new Date(`${day}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (end) d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const shortId = (id: string | null) => (id ? id.slice(0, 8) : null);

export default function AuditLogsPage() {
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  const rangeInvalid = !!from && !!to && from > to;

  const filterKey = `${action}|${from}|${to}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const { data, error, loading, reload } = useAsync(
    () =>
      listAuditLogs({
        action: action || null,
        from: dayBoundary(from, false),
        to: dayBoundary(to, true),
        page,
        pageSize: PAGE_SIZE,
      }),
    [action, from, to, page],
    !rangeInvalid
  );

  const columns: DataColumn<AuditLogEntry>[] = [
    {
      key: "time",
      header: "Time",
      cell: (r) => <span className="whitespace-nowrap">{formatDate(r.performed_at, true)}</span>,
    },
    {
      key: "action",
      header: "Action",
      cell: (r) => {
        const m = auditMeta(r.action);
        return (
          <Pill tone={m.tone} size="sm">
            {m.label}
          </Pill>
        );
      },
      hideOnCard: true,
    },
    {
      key: "actor",
      header: "Actor",
      cell: (r) => (
        <span className="block max-w-[14rem] truncate" title={r.users?.email}>
          {actorLabel(r)}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      cell: (r) => (
        <span className="font-mono text-xs">
          {r.table_name}
          {r.record_id && <span className="text-[var(--muted)]"> · {shortId(r.record_id)}</span>}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (r) => {
        const reason = auditReason(r);
        return reason ? (
          <span className="block max-w-[16rem] truncate" title={reason}>
            {reason}
          </span>
        ) : (
          <span className="text-[var(--muted)]">—</span>
        );
      },
    },
    {
      key: "view",
      header: "Details",
      className: "text-right",
      // Row click is mouse-only; this button gives keyboard users the same detail view.
      cell: (r) => (
        <Button
          size="xs"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            setSelected(r);
          }}
          aria-label={`View details of ${auditMeta(r.action).label} at ${formatDate(r.performed_at, true)}`}
        >
          View
        </Button>
      ),
    },
  ];

  const filtered = !!action || !!from || !!to;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="The complete, read-only record of changes. Select an entry to see its details."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Audit Logs" }]}
      />

      <Section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div>
            <span className="mb-1 block text-xs font-medium text-[var(--muted)]" aria-hidden="true">
              Action
            </span>
            <FilterSelect label="Filter by action" value={action} onChange={setAction} options={ACTION_OPTIONS} />
          </div>
          <DateInput label="From" value={from} onChange={setFrom} max={to || undefined} />
          <DateInput label="To" value={to} onChange={setTo} min={from || undefined} />
          {filtered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAction("");
                setFrom("");
                setTo("");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {rangeInvalid ? (
          <p role="alert" className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
            The “From” date must be on or before the “To” date.
          </p>
        ) : loading && !data ? (
          <LoadingState variant="table" label="Loading audit log" />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.rows.length === 0 ? (
          <EmptyPanel
            compact
            icon={<ScrollText className="h-6 w-6" aria-hidden="true" />}
            title={filtered ? "No entries match these filters" : "No audit entries yet"}
            description={filtered ? "Try another action or date range." : "Changes made in the dashboard are logged here."}
          />
        ) : (
          <div className="-mx-5 -mb-5">
            <div className="px-5 md:px-0">
              <DataTable
                columns={columns}
                rows={data.rows}
                rowKey={(r) => r.id}
                onRowClick={setSelected}
                cardTitle={(r) => {
                  const m = auditMeta(r.action);
                  return (
                    <Pill tone={m.tone} size="sm">
                      {m.label}
                    </Pill>
                  );
                }}
                caption="Audit log entries"
                loading={loading}
              />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </Section>

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function DateInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--muted)]">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--card-border)] bg-white px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)] sm:w-auto"
      />
    </label>
  );
}
