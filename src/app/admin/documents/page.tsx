"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyPanel } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Pagination, type DataColumn } from "@/components/ui/DataTable";
import { TabBar, TabPanel, type TabItem } from "@/components/ui/TabBar";
import { SearchInput } from "@/components/ui/Form";
import { formatDate } from "@/components/ui/Timeline";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberCell } from "@/components/admin-ui/MemberAvatar";
import { DocumentActions, useDocumentReview } from "@/components/admin-ui/DocumentReview";
import { formatBytes, memberName } from "@/components/admin-ui/format";
import { useDebouncedSearch, useQueryParams } from "@/components/admin-ui/useQueryParams";
import { useAsync } from "@/lib/useAsync";
import { getDashboardStats, listDocuments, type DocumentWithMember } from "@/lib/data/admin";
import { DOCUMENT_TYPES } from "@/lib/status";
import type { DocumentStatus } from "@/lib/data/types";

const PAGE_SIZE = 20;
type TabKey = DocumentStatus | "all";
const TAB_KEYS: TabKey[] = ["pending", "approved", "rejected", "all"];
const TAB_LABEL: Record<TabKey, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  all: "All",
};
const EMPTY: Record<TabKey, string> = {
  pending: "No documents are waiting for review",
  approved: "No approved documents yet",
  rejected: "No rejected documents",
  all: "No documents uploaded yet",
};

function DocumentsQueue() {
  const { user } = useAuth();
  const { params, update, page } = useQueryParams();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = tabParam && TAB_KEYS.includes(tabParam) ? tabParam : "pending";
  const q = params.get("q") ?? "";

  const [searchText, setSearchText] = useDebouncedSearch(q, update);

  const { data, error, loading, reload } = useAsync(
    () => listDocuments({ status: tab === "all" ? null : tab, search: q, page, pageSize: PAGE_SIZE }),
    [tab, q, page]
  );
  const stats = useAsync(() => getDashboardStats().catch(() => null), []);
  const counts = stats.data?.documents;

  const afterReview = () => {
    reload();
    stats.reload();
  };
  const review = useDocumentReview({ onReviewed: afterReview });

  const tabs: TabItem<TabKey>[] = TAB_KEYS.map((k) => ({
    key: k,
    label: TAB_LABEL[k],
    count: counts
      ? k === "all"
        ? (counts.pending ?? 0) + (counts.approved ?? 0) + (counts.rejected ?? 0)
        : counts[k] ?? 0
      : undefined,
  }));

  const columns: DataColumn<DocumentWithMember>[] = [
    {
      key: "member",
      header: "Member",
      hideOnCard: true,
      cell: (d) => (
        <Link href={`/admin/members/${d.members.id}`} className="block hover:underline">
          <MemberCell name={memberName(d.members)} email={d.members.member_number} />
        </Link>
      ),
    },
    { key: "type", header: "Document type", cell: (d) => DOCUMENT_TYPES[d.document_type]?.label ?? d.document_type },
    {
      key: "file",
      header: "File",
      className: "max-w-[220px]",
      cell: (d) => (
        <span className="block min-w-0">
          <span className="block truncate" title={d.file_name}>
            {d.file_name}
          </span>
          {d.size_bytes ? <span className="text-xs text-[var(--muted)]">{formatBytes(d.size_bytes)}</span> : null}
        </span>
      ),
    },
    { key: "uploaded", header: "Uploaded", cell: (d) => formatDate(d.uploaded_at) },
    {
      key: "status",
      header: "Status",
      cell: (d) => (
        <span className="inline-flex flex-col items-end gap-1 md:items-start">
          <StatusBadge kind="document" status={d.status} size="sm" />
          {d.status === "rejected" && d.rejection_reason && (
            <span className="max-w-[220px] truncate text-xs text-[var(--muted)]" title={d.rejection_reason}>
              {d.rejection_reason}
            </span>
          )}
        </span>
      ),
    },
    { key: "reviewed", header: "Reviewed", cell: (d) => (d.reviewed_at ? formatDate(d.reviewed_at) : "—") },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (d) => (
        <DocumentActions
          doc={d}
          review={review}
          isOwn={!!user && d.members.user_id === user.id}
          memberName={memberName(d.members)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Documents" description="Review identity, address and other documents uploaded by members." />

      <TabBar tabs={tabs} active={tab} onChange={(k) => update({ tab: k === "pending" ? null : k })} label="Document status" idPrefix="docs" />
      <TabPanel idPrefix="docs" activeKey={tab}>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs">
          <div className="flex flex-col gap-3 border-b border-[var(--card-border)] p-4 sm:flex-row sm:items-center">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              label="Search by member"
              placeholder="Member name or ID"
            />
          </div>
          {error && !data ? (
            <div className="p-4">
              <ErrorState error={error} onRetry={reload} />
            </div>
          ) : !data ? (
            <div className="p-4">
              <LoadingState variant="table" label="Loading documents" />
            </div>
          ) : data.rows.length === 0 ? (
            <div className="p-4">
              <EmptyPanel
                icon={<FileCheck2 className="h-6 w-6" />}
                title={q ? "No documents match this search" : EMPTY[tab]}
                description={q ? "Try a different member name or ID." : undefined}
                action={
                  q
                    ? {
                        label: "Clear search",
                        onClick: () => {
                          setSearchText("");
                          update({ q: null });
                        },
                      }
                    : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="p-3 md:p-0">
                <DataTable
                  caption={`${TAB_LABEL[tab]} documents`}
                  columns={columns}
                  rows={data.rows}
                  rowKey={(d) => d.id}
                  loading={loading}
                  cardTitle={(d) => <MemberCell name={memberName(d.members)} email={d.members.member_number} />}
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
      {review.dialog}
    </>
  );
}

export default function AdminDocumentsPage() {
  return (
    <Suspense fallback={<LoadingState variant="table" label="Loading documents" />}>
      <DocumentsQueue />
    </Suspense>
  );
}
