"use client";

import React, { Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyPanel } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, Pagination, type DataColumn } from "@/components/ui/DataTable";
import { FilterSelect, SearchInput } from "@/components/ui/Form";
import { formatDate } from "@/components/ui/Timeline";
import { Button } from "@/components/ui/Button";
import { MemberCell } from "@/components/admin-ui/MemberAvatar";
import { memberName } from "@/components/admin-ui/format";
import { useDebouncedSearch, useQueryParams } from "@/components/admin-ui/useQueryParams";
import { useAsync } from "@/lib/useAsync";
import { searchMembers, type MemberSearchParams } from "@/lib/data/admin";
import { APPLICATION_STATUS, MEMBERSHIP_STATUS } from "@/lib/status";
import type { AdminMemberRow } from "@/lib/data/types";

const PAGE_SIZE = 20;
type SortKey = NonNullable<MemberSearchParams["sort"]>;
const SORT_KEYS: SortKey[] = ["name", "member_number", "created_at", "updated_at"];

const MEMBERSHIP_OPTIONS = [
  { value: "all", label: "All memberships" },
  ...(["active", "pending", "expired", "suspended", "cancelled", "none"] as const).map((s) => ({
    value: s,
    label: s === "none" ? "No membership" : MEMBERSHIP_STATUS[s].label,
  })),
];

const APPLICATION_OPTIONS = [
  { value: "all", label: "All applications" },
  ...(["draft", "submitted", "under_review", "changes_requested", "approved", "rejected", "none"] as const).map((s) => ({
    value: s,
    label: s === "none" ? "No application" : APPLICATION_STATUS[s].label,
  })),
];

const pick = (v: string | null, allowed: { value: string }[]) =>
  v && allowed.some((o) => o.value === v) ? v : "all";

function MembersList() {
  const { role } = useAuth();
  const router = useRouter();
  const { params, update, page } = useQueryParams();

  const q = params.get("q") ?? "";
  const membership = pick(params.get("membership"), MEMBERSHIP_OPTIONS);
  const application = pick(params.get("application"), APPLICATION_OPTIONS);
  const sortParam = params.get("sort") as SortKey | null;
  const sort: SortKey = sortParam && SORT_KEYS.includes(sortParam) ? sortParam : "created_at";
  const desc = params.get("desc") !== "0";

  const [searchText, setSearchText] = useDebouncedSearch(q, update);

  const { data, error, loading, reload } = useAsync(
    () =>
      searchMembers({
        search: q,
        membership: membership === "all" ? null : membership,
        application: application === "all" ? null : application,
        sort,
        desc,
        page,
        pageSize: PAGE_SIZE,
      }),
    [q, membership, application, sort, desc, page]
  );

  const filtered = !!q || membership !== "all" || application !== "all";

  const columns: DataColumn<AdminMemberRow>[] = [
    {
      key: "member",
      header: "Member",
      sortKey: "name",
      hideOnCard: true,
      cell: (m) => <MemberCell name={memberName(m, m.email)} email={m.email} />,
    },
    { key: "number", header: "Member ID", sortKey: "member_number", cell: (m) => m.member_number ?? "—" },
    {
      key: "application",
      header: "Application",
      cell: (m) => <StatusBadge kind="application" status={m.application_status} size="sm" />,
    },
    {
      key: "membership",
      header: "Membership",
      cell: (m) => <StatusBadge kind="membership" status={m.membership_status} size="sm" />,
    },
    { key: "created", header: "Registered", sortKey: "created_at", cell: (m) => formatDate(m.created_at) },
    { key: "updated", header: "Last updated", sortKey: "updated_at", cell: (m) => formatDate(m.updated_at) },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (m) => (
        <span className="inline-flex items-center gap-3">
          {m.application_id && (m.application_status === "submitted" || m.application_status === "under_review") && (
            <Link
              href={`/admin/applications/${m.application_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium text-[var(--brand-gold-ink)] hover:underline"
            >
              Review
            </Link>
          )}
          <Link
            href={`/admin/members/${m.member_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-medium text-[var(--brand-navy)] hover:underline"
            aria-label={`View ${memberName(m, m.email)}`}
          >
            View
          </Link>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Members"
        description="Search, filter and open member records."
        actions={
          role === 'super_admin' && <Button onClick={() => router.push("/admin/members/new")} icon={<UserPlus className="h-4 w-4" />}>
            Add member
          </Button>
        }
      />

      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs">
        <div className="flex flex-col gap-3 border-b border-[var(--card-border)] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            value={searchText}
            onChange={setSearchText}
            label="Search members"
            placeholder="Name, email, phone or member ID"
          />
          <FilterSelect
            label="Membership status"
            value={membership}
            onChange={(v) => update({ membership: v === "all" ? null : v })}
            options={MEMBERSHIP_OPTIONS}
          />
          <FilterSelect
            label="Application status"
            value={application}
            onChange={(v) => update({ application: v === "all" ? null : v })}
            options={APPLICATION_OPTIONS}
          />
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setSearchText("");
                update({ q: null, membership: null, application: null });
              }}
              className="text-sm font-medium text-[var(--brand-navy)] hover:underline sm:ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && !data ? (
          <div className="p-4">
            <ErrorState error={error} onRetry={reload} />
          </div>
        ) : !data ? (
          <div className="p-4">
            <LoadingState variant="table" label="Loading members" />
          </div>
        ) : data.rows.length === 0 ? (
          <div className="p-4">
            <EmptyPanel
              icon={<Users className="h-6 w-6" />}
              title={filtered ? "No members match these filters" : "No members yet"}
              description={
                filtered ? "Try a different search or clear the filters." : "Members appear here once they register or are added."
              }
              action={
                filtered
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setSearchText("");
                        update({ q: null, membership: null, application: null });
                      },
                    }
                  : role === 'super_admin' ? { label: "Add member", href: "/admin/members/new" } : undefined
              }
            />
          </div>
        ) : (
          <>
            {error && (
              <p role="alert" className="mx-4 mt-4 rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
                {error.message}
              </p>
            )}
            <div className="p-3 md:p-0">
              <DataTable
                caption="Members"
                columns={columns}
                rows={data.rows}
                rowKey={(m) => m.member_id}
                loading={loading}
                sort={{ key: sort, desc }}
                onSortChange={(s) => update({ sort: s.key, desc: s.desc ? null : "0" })}
                onRowClick={(m) => router.push(`/admin/members/${m.member_id}`)}
                cardTitle={(m) => <MemberCell name={memberName(m, m.email)} email={m.email} />}
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
    </>
  );
}

export default function AdminMembersPage() {
  return (
    <Suspense fallback={<LoadingState variant="table" label="Loading members" />}>
      <MembersList />
    </Suspense>
  );
}
