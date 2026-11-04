"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyPanel } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Pagination, type DataColumn } from "@/components/ui/DataTable";
import { TabBar, TabPanel, type TabItem } from "@/components/ui/TabBar";
import { formatDate } from "@/components/ui/Timeline";
import { MemberCell } from "@/components/admin-ui/MemberAvatar";
import { daysSince, memberName, waitingLabel } from "@/components/admin-ui/format";
import { useQueryParams } from "@/components/admin-ui/useQueryParams";
import { useAsync } from "@/lib/useAsync";
import { getDashboardStats, listApplications, type ApplicationWithMember } from "@/lib/data/admin";
import type { ApplicationStatus } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type TabKey = "review" | "changes" | "approved" | "rejected" | "all";

const TABS: Record<TabKey, { label: string; statuses?: ApplicationStatus[]; oldestFirst: boolean; empty: string }> = {
  review: {
    label: "Needs review",
    statuses: ["submitted", "under_review"],
    oldestFirst: true,
    empty: "No applications are waiting for review.",
  },
  changes: {
    label: "Changes requested",
    statuses: ["changes_requested"],
    oldestFirst: false,
    empty: "No applications are waiting on member changes.",
  },
  approved: { label: "Approved", statuses: ["approved"], oldestFirst: false, empty: "No approved applications yet." },
  rejected: { label: "Rejected", statuses: ["rejected"], oldestFirst: false, empty: "No rejected applications." },
  all: { label: "All", oldestFirst: false, empty: "No submitted applications yet." },
};
const TAB_KEYS = Object.keys(TABS) as TabKey[];
const isPending = (s: ApplicationStatus) => s === "submitted" || s === "under_review";

function ApplicationsQueue() {
  const router = useRouter();
  const { params, update, page } = useQueryParams();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = tabParam && TAB_KEYS.includes(tabParam) ? tabParam : "review";
  const cfg = TABS[tab];

  const { data, error, loading, reload } = useAsync(
    () => listApplications({ statuses: cfg.statuses, page, pageSize: PAGE_SIZE, oldestFirst: cfg.oldestFirst }),
    [tab, page]
  );
  // Tab counts are a convenience; the list still works if stats fail.
  const stats = useAsync(() => getDashboardStats().catch(() => null), []);
  const counts = stats.data?.applications;

  const countFor = (k: TabKey): number | undefined => {
    if (!counts) return undefined;
    const statuses = TABS[k].statuses;
    if (!statuses) {
      return Object.entries(counts).reduce((sum, [s, n]) => (s === "draft" ? sum : sum + (n ?? 0)), 0);
    }
    return statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0);
  };
  const tabs: TabItem<TabKey>[] = TAB_KEYS.map((k) => ({ key: k, label: TABS[k].label, count: countFor(k) }));

  const columns: DataColumn<ApplicationWithMember>[] = [
    {
      key: "member",
      header: "Member",
      hideOnCard: true,
      cell: (a) => <MemberCell name={memberName(a.members)} email={a.members.users?.email} />,
    },
    { key: "number", header: "Member ID", cell: (a) => a.members.member_number ?? "—" },
    { key: "status", header: "Status", cell: (a) => <StatusBadge kind="application" status={a.status} size="sm" /> },
    {
      key: "submitted",
      header: "Submitted",
      cell: (a) => (
        <span className="inline-flex flex-col md:items-start">
          <span>{formatDate(a.submitted_at)}</span>
          {isPending(a.status) && a.submitted_at && (
            <span className={cn("text-xs", daysSince(a.submitted_at) > 7 ? "font-medium text-red-700" : "text-[var(--muted)]")}>
              {waitingLabel(a.submitted_at)}
            </span>
          )}
        </span>
      ),
    },
    { key: "reviewed", header: "Reviewed", cell: (a) => (a.reviewed_at ? formatDate(a.reviewed_at) : "—") },
    {
      key: "action",
      header: "Action",
      className: "text-right",
      cell: (a) => (
        <Link
          href={`/admin/applications/${a.id}`}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium",
            isPending(a.status)
              ? "bg-[var(--brand-navy)] text-white hover:bg-[var(--brand-navy-hover)]"
              : "text-[var(--brand-navy)] hover:underline"
          )}
        >
          {isPending(a.status) ? "Review" : "Open"}
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Approvals" description="Review membership applications. The oldest waiting applications are listed first." />

      <TabBar tabs={tabs} active={tab} onChange={(k) => update({ tab: k === "review" ? null : k })} label="Application status" idPrefix="apps" />
      <TabPanel idPrefix="apps" activeKey={tab}>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs">
          {error && !data ? (
            <div className="p-4">
              <ErrorState error={error} onRetry={reload} />
            </div>
          ) : !data ? (
            <div className="p-4">
              <LoadingState variant="table" label="Loading applications" />
            </div>
          ) : data.rows.length === 0 ? (
            <div className="p-4">
              <EmptyPanel icon={<ClipboardCheck className="h-6 w-6" />} title={cfg.empty} />
            </div>
          ) : (
            <>
              <div className="p-3 md:p-0">
                <DataTable
                  caption={`${cfg.label} applications`}
                  columns={columns}
                  rows={data.rows}
                  rowKey={(a) => a.id}
                  loading={loading}
                  onRowClick={(a) => router.push(`/admin/applications/${a.id}`)}
                  cardTitle={(a) => <MemberCell name={memberName(a.members)} email={a.members.users?.email} />}
                />
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data.total}
                onPageChange={(p) => update({ page: p > 1 ? String(p) : null }, { resetPage: false })}
              />
            </>
          )}
        </div>
      </TabPanel>
    </>
  );
}

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={<LoadingState variant="table" label="Loading applications" />}>
      <ApplicationsQueue />
    </Suspense>
  );
}
