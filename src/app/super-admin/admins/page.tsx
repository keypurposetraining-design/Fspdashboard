"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, ShieldCheck, UserPlus, X } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { SearchInput } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/components/ui/Timeline";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { listUsers } from "@/lib/data/superAdmin";
import type { AppRole, AppUserRow } from "@/lib/data/types";
import { listPrivilegedUsers, isActive } from "@/components/super-admin/accessData";
import { RoleChangeDialog, type RoleDialogMode } from "@/components/super-admin/RoleChangeDialog";
import { AccountStatusPill, RolePill, UserCell } from "@/components/super-admin/UserPills";
import { useDebounced } from "@/components/super-admin/useDebounced";

interface DialogState {
  target: AppUserRow;
  mode: RoleDialogMode;
  initialRole?: AppRole;
  roleOptions?: AppRole[];
}

export default function AdminManagementPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [adding, setAdding] = useState(false);

  const { data, error, loading, reload } = useAsync(listPrivilegedUsers, []);

  // Super admins first, then admins; newest first within each group.
  const rows = (data ?? []).slice().sort((a, b) =>
    a.role === b.role ? b.created_at.localeCompare(a.created_at) : a.role === "super_admin" ? -1 : 1
  );
  const activeSuperAdmins = rows.filter((u) => u.role === "super_admin" && isActive(u)).length;

  const onDone = (message: string) => {
    setDialog(null);
    toast(message);
    reload();
  };

  const columns: DataColumn<AppUserRow>[] = [
    {
      key: "user",
      header: "Account",
      cell: (u) => <UserCell user={u} isYou={u.id === user?.id} />,
      hideOnCard: true,
    },
    { key: "role", header: "Role", cell: (u) => <RolePill role={u.role} /> },
    { key: "status", header: "Status", cell: (u) => <AccountStatusPill user={u} /> },
    { key: "since", header: "Since", cell: (u) => formatDate(u.created_at) },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (u) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setDialog({ target: u, mode: "role" })}>
            Change role
          </Button>
          <Button
            size="sm"
            variant={isActive(u) ? "ghost" : "soft"}
            onClick={() => setDialog({ target: u, mode: "access" })}
            aria-label={`${isActive(u) ? "Disable" : "Enable"} ${u.email}`}
          >
            {isActive(u) ? "Disable" : "Enable"}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Management"
        description="Accounts with admin or super admin access. Every change needs a reason and is recorded in the audit log."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Admin Management" }]}
        actions={
          !adding && (
            <Button onClick={() => setAdding(true)} icon={<UserPlus className="h-4 w-4" />}>
              Add admin
            </Button>
          )
        }
      />

      {adding && (
        <AddAdminPanel
          onClose={() => setAdding(false)}
          onPick={(u) =>
            setDialog({ target: u, mode: "role", initialRole: "admin", roleOptions: ["admin", "super_admin"] })
          }
        />
      )}

      {data && activeSuperAdmins === 1 && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-light)] p-4 text-sm text-[var(--brand-gold-ink)]"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            Only one active super admin. We recommend promoting a second trusted person so the system can still be
            managed if that account is unavailable. The database will not let the last super admin be removed.
          </p>
        </div>
      )}

      <Section title="Privileged accounts" description={data ? `${rows.length} account${rows.length === 1 ? "" : "s"}` : undefined}>
        {loading && !data ? (
          <LoadingState variant="table" label="Loading admin accounts" />
        ) : error && !data ? (
          <ErrorState error={error} onRetry={reload} />
        ) : rows.length === 0 ? (
          <EmptyPanel compact title="No admin accounts found" description="Use “Add admin” to promote an existing user." />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(u) => u.id}
            cardTitle={(u) => <UserCell user={u} isYou={u.id === user?.id} />}
            caption="Admin and super admin accounts"
            loading={loading}
          />
        )}
      </Section>

      <RoleChangeDialog
        target={dialog?.target ?? null}
        mode={dialog?.mode ?? "role"}
        initialRole={dialog?.initialRole}
        roleOptions={dialog?.roleOptions}
        onClose={() => setDialog(null)}
        onDone={(m) => {
          onDone(m);
          if (dialog?.initialRole) setAdding(false);
        }}
      />
    </div>
  );
}

function AddAdminPanel({ onClose, onPick }: { onClose: () => void; onPick: (u: AppUserRow) => void }) {
  const [search, setSearch] = useState("");
  const term = useDebounced(search.trim(), 350);
  const enabled = term.length >= 2;

  const { data, error, loading, reload } = useAsync(
    () => listUsers({ roles: ["member", "trainer"], search: term, page: 1, pageSize: 10 }),
    [term],
    enabled
  );

  return (
    <Section
      title="Add an admin"
      description="Find an existing member or trainer account and promote it."
      actions={
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close add admin">
          <X className="h-4 w-4" />
        </Button>
      }
    >
      <div className="mb-4 flex gap-2 rounded-lg bg-[var(--info-light)] px-3 py-2 text-sm text-[var(--brand-navy)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          The person needs an account first: they sign in once with Google, or an admin creates them on{" "}
          <Link href="/admin/members/new" className="font-semibold underline">
            Admin › Members › Add member
          </Link>
          . Then search for them here and promote them.
        </p>
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" label="Search users" />

      <div className="mt-4">
        {!enabled ? (
          <p className="text-sm text-[var(--muted)]">Type at least 2 characters to search.</p>
        ) : loading && !data ? (
          <LoadingState variant="list" label="Searching" />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data || data.rows.length === 0 ? (
          <EmptyPanel
            compact
            title="No matching members or trainers"
            description="Check the spelling, or make sure they have signed in at least once."
          />
        ) : (
          <ul className="divide-y divide-[var(--card-border)] rounded-xl border border-[var(--card-border)]" aria-busy={loading}>
            {data.rows.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                <UserCell user={u} />
                <div className="flex items-center gap-2">
                  <RolePill role={u.role} />
                  <AccountStatusPill user={u} />
                  <Button size="sm" onClick={() => onPick(u)}>
                    Promote
                  </Button>
                </div>
              </li>
            ))}
            {data.total > data.rows.length && (
              <li className="p-3 text-xs text-[var(--muted)]">
                Showing the first {data.rows.length} of {data.total} matches — refine your search.
              </li>
            )}
          </ul>
        )}
      </div>
    </Section>
  );
}
