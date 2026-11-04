"use client";

import React, { useState } from "react";
import { Users } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { DataTable, Pagination, type DataColumn } from "@/components/ui/DataTable";
import { FilterSelect, SearchInput } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/components/ui/Timeline";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { listUsers } from "@/lib/data/superAdmin";
import type { AppRole, AppUserRow } from "@/lib/data/types";
import { RoleChangeDialog } from "@/components/super-admin/RoleChangeDialog";
import { AccountStatusPill, RolePill, UserCell } from "@/components/super-admin/UserPills";
import { useDebounced } from "@/components/super-admin/useDebounced";

const PAGE_SIZE = 25;

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "member", label: "Members" },
  { value: "trainer", label: "Trainers" },
  { value: "admin", label: "Admins" },
  { value: "super_admin", label: "Super Admins" },
];

export default function UserManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AppUserRow | null>(null);
  const term = useDebounced(search.trim(), 350);

  // Any filter change goes back to page 1 (adjusted during render, not in an effect).
  const filterKey = `${role}|${term}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const { data, error, loading, reload } = useAsync(
    () =>
      listUsers({
        roles: role ? [role as AppRole] : undefined,
        search: term,
        page,
        pageSize: PAGE_SIZE,
      }),
    [role, term, page]
  );

  const columns: DataColumn<AppUserRow>[] = [
    { key: "user", header: "User", cell: (u) => <UserCell user={u} isYou={u.id === user?.id} />, hideOnCard: true },
    { key: "role", header: "Role", cell: (u) => <RolePill role={u.role} /> },
    { key: "status", header: "Status", cell: (u) => <AccountStatusPill user={u} /> },
    { key: "created", header: "Created", cell: (u) => formatDate(u.created_at) },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (u) => (
        <Button size="sm" variant="outline" onClick={() => setTarget(u)} aria-label={`Change role or access for ${u.email}`}>
          Change role / access
        </Button>
      ),
    },
  ];

  const filtered = !!role || !!term;

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Every account that can sign in. Change a role or disable access; each change is audited."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "User Management" }]}
      />

      <Section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or email…" label="Search users" />
          <FilterSelect label="Filter by role" value={role} onChange={setRole} options={ROLE_FILTERS} />
        </div>

        {loading && !data ? (
          <LoadingState variant="table" label="Loading users" />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.rows.length === 0 ? (
          <EmptyPanel
            compact
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title={filtered ? "No users match these filters" : "No users yet"}
            description={filtered ? "Try a different search or role." : "Accounts appear here after their first sign-in."}
          />
        ) : (
          <div className="-mx-5 -mb-5">
            <div className="px-5 md:px-0">
              <DataTable
                columns={columns}
                rows={data.rows}
                rowKey={(u) => u.id}
                cardTitle={(u) => <UserCell user={u} isYou={u.id === user?.id} />}
                caption="Users"
                loading={loading}
              />
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPageChange={setPage} />
          </div>
        )}
      </Section>

      <RoleChangeDialog
        target={target}
        mode="both"
        onClose={() => setTarget(null)}
        onDone={(m) => {
          setTarget(null);
          toast(m);
          reload();
        }}
      />
    </div>
  );
}
