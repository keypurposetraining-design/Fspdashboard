"use client";

import React, { useState } from "react";
import { CalendarClock, CalendarX, Percent, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { TextField } from "@/components/ui/Form";
import { BarList, ChartCard, ColumnChart, KpiCard, SERIES_COLORS, monthLabel, type BarListItem } from "@/components/charts/Charts";
import { isoDay, monthStartUtc, todayUtc } from "@/components/admin-ui/format";
import { useAsync } from "@/lib/useAsync";
import { getDashboardStats, getMonthlySeries } from "@/lib/data/admin";
import { DOCUMENT_STATUS, MEMBERSHIP_STATUS } from "@/lib/status";
import type { DocumentStatus, EffectiveMembershipStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type Preset = "3" | "6" | "12" | "custom";
const PRESETS: { key: Preset; label: string }[] = [
  { key: "3", label: "3 months" },
  { key: "6", label: "6 months" },
  { key: "12", label: "12 months" },
  { key: "custom", label: "Custom" },
];
const MAX_RANGE_DAYS = 3660; // admin_monthly_series rejects longer ranges

const MEMBERSHIP_ORDER: EffectiveMembershipStatus[] = ["active", "pending", "expired", "suspended", "cancelled", "none"];
const DOCUMENT_ORDER: DocumentStatus[] = ["pending", "approved", "rejected"];

function resolveRange(preset: Preset, from: string, to: string): { from: string; to: string; error: string | null } {
  if (preset !== "custom") {
    return { from: isoDay(monthStartUtc(Number(preset) - 1)), to: isoDay(todayUtc()), error: null };
  }
  if (!from || !to) return { from, to, error: "Choose both a start and an end date." };
  if (from > to) return { from, to, error: "The start date must be on or before the end date." };
  const days = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  if (days > MAX_RANGE_DAYS) return { from, to, error: "Choose a range of 10 years or less." };
  return { from, to, error: null };
}

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<Preset>("6");
  const [customFrom, setCustomFrom] = useState(() => isoDay(monthStartUtc(5)));
  const [customTo, setCustomTo] = useState(() => isoDay(todayUtc()));
  const range = resolveRange(preset, customFrom, customTo);

  // Date-only strings parse as UTC midnight, so toISOString() keeps the same day.
  const series = useAsync(
    () => getMonthlySeries(new Date(range.from), new Date(range.to)),
    [range.from, range.to],
    !range.error
  );
  const stats = useAsync(getDashboardStats, []);

  const header = (
    <PageHeader title="Reports" description="Membership growth, application outcomes and document reviews." />
  );

  const filters = (
    <div className="mb-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div role="radiogroup" aria-label="Date range" className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              role="radio"
              aria-checked={preset === p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                "h-10 rounded-lg border px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]",
                preset === p.key
                  ? "border-[var(--brand-navy)] bg-[var(--brand-navy)] text-white"
                  : "border-[var(--card-border)] bg-white text-[var(--foreground)] hover:bg-[var(--muted-light)]"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-96">
            <TextField
              label="From"
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <TextField
              label="To"
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        )}
      </div>
      {range.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {range.error}
        </p>
      )}
    </div>
  );

  if ((series.error && !series.data) || (stats.error && !stats.data)) {
    return (
      <>
        {header}
        {filters}
        <ErrorState
          error={series.error ?? stats.error}
          onRetry={() => {
            series.reload();
            stats.reload();
          }}
        />
      </>
    );
  }
  if ((!series.data && !range.error) || !stats.data) {
    return (
      <>
        {header}
        {filters}
        <LoadingState variant="cards" label="Loading reports" />
      </>
    );
  }

  const rows = series.data ?? [];
  const s = stats.data;
  const chartRows = rows.map((r) => ({
    label: monthLabel(r.month),
    new_members: r.new_members,
    submitted: r.applications_submitted,
    approved: r.applications_approved,
    rejected: r.applications_rejected,
    documents: r.documents_uploaded,
  }));
  const sum = (k: keyof (typeof chartRows)[number]) => chartRows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
  const totalNew = sum("new_members");
  const totalApproved = sum("approved");
  const totalRejected = sum("rejected");
  const decided = totalApproved + totalRejected;
  const periodLabel = chartRows.length
    ? chartRows.length === 1
      ? chartRows[0].label
      : `${chartRows[0].label} – ${chartRows[chartRows.length - 1].label}`
    : "Selected period";

  const membershipItems: BarListItem[] = MEMBERSHIP_ORDER.map((k) => ({
    key: k,
    label: k === "none" ? "No membership" : MEMBERSHIP_STATUS[k].label,
    value: k === "none" ? s.members_without_membership : s.membership[k] ?? 0,
    tone: MEMBERSHIP_STATUS[k].tone,
    icon: MEMBERSHIP_STATUS[k].icon,
    href: `/admin/members?membership=${k}`,
  }));
  const documentItems: BarListItem[] = DOCUMENT_ORDER.map((k) => ({
    key: k,
    label: DOCUMENT_STATUS[k].label,
    value: s.documents[k] ?? 0,
    tone: DOCUMENT_STATUS[k].tone,
    icon: DOCUMENT_STATUS[k].icon,
    href: `/admin/documents?tab=${k}`,
  }));

  return (
    <>
      {header}
      {filters}

      <div className={cn("space-y-6", series.loading && "opacity-70 transition-opacity")} aria-busy={series.loading}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="New members"
            value={range.error ? "—" : totalNew}
            context={periodLabel}
            icon={<UserPlus className="h-5 w-5" />}
            tone="info"
          />
          <KpiCard
            label="Approval rate"
            value={!range.error && decided > 0 ? `${Math.round((totalApproved / decided) * 100)}%` : "—"}
            context={
              !range.error && decided > 0
                ? `${totalApproved} approved, ${totalRejected} rejected`
                : "No applications were decided in this period"
            }
            icon={<Percent className="h-5 w-5" />}
            tone="success"
          />
          <KpiCard
            label="Expired memberships"
            value={s.membership.expired ?? 0}
            context="Current total"
            icon={<CalendarX className="h-5 w-5" />}
            tone="danger"
            href="/admin/members?membership=expired"
          />
          <KpiCard
            label="Expiring in 30 days"
            value={s.expiring_30_days}
            context="Active memberships ending soon"
            icon={<CalendarClock className="h-5 w-5" />}
            tone="warning"
            href="/admin/memberships"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {!range.error && (
            <>
              <ChartCard
                title="Member growth"
                description={`New members per month · ${periodLabel}`}
                isEmpty={totalNew === 0}
                empty={<p className="py-10 text-center text-sm text-[var(--muted)]">No new members in this period.</p>}
                table={{ columns: ["Month", "New members"], rows: chartRows.map((r) => [r.label, r.new_members]) }}
              >
                <ColumnChart
                  data={chartRows}
                  series={[{ key: "new_members", label: "New members", color: SERIES_COLORS.blue }]}
                  valueLabel="New members"
                />
              </ChartCard>

              <ChartCard
                title="Applications over time"
                description={`Submitted and decided per month · ${periodLabel}`}
                isEmpty={sum("submitted") + decided === 0}
                empty={<p className="py-10 text-center text-sm text-[var(--muted)]">No application activity in this period.</p>}
                table={{
                  columns: ["Month", "Submitted", "Approved", "Rejected"],
                  rows: chartRows.map((r) => [r.label, r.submitted, r.approved, r.rejected]),
                }}
              >
                <ColumnChart
                  data={chartRows}
                  series={[
                    { key: "submitted", label: "Submitted", color: SERIES_COLORS.blue },
                    { key: "approved", label: "Approved", color: SERIES_COLORS.green },
                    { key: "rejected", label: "Rejected", color: SERIES_COLORS.red },
                  ]}
                  valueLabel="Applications"
                />
              </ChartCard>

              <ChartCard
                title="Documents uploaded"
                description={`Uploads per month · ${periodLabel}`}
                isEmpty={sum("documents") === 0}
                empty={<p className="py-10 text-center text-sm text-[var(--muted)]">No documents uploaded in this period.</p>}
                table={{ columns: ["Month", "Documents"], rows: chartRows.map((r) => [r.label, r.documents]) }}
              >
                <ColumnChart
                  data={chartRows}
                  series={[{ key: "documents", label: "Documents uploaded", color: SERIES_COLORS.blue }]}
                  valueLabel="Documents uploaded"
                />
              </ChartCard>
            </>
          )}

          <ChartCard
            title="Membership status"
            description="All members today, by latest membership"
            isEmpty={membershipItems.every((i) => i.value === 0)}
            empty={<p className="py-10 text-center text-sm text-[var(--muted)]">No members yet.</p>}
            table={{ columns: ["Status", "Members"], rows: membershipItems.map((i) => [i.label, i.value]) }}
          >
            <BarList items={membershipItems} />
          </ChartCard>

          <ChartCard
            title="Document review status"
            description="All uploaded documents today"
            isEmpty={documentItems.every((i) => i.value === 0)}
            empty={<p className="py-10 text-center text-sm text-[var(--muted)]">No documents uploaded yet.</p>}
            table={{ columns: ["Status", "Documents"], rows: documentItems.map((i) => [i.label, i.value]) }}
          >
            <BarList items={documentItems} />
          </ChartCard>
        </div>
      </div>
    </>
  );
}
