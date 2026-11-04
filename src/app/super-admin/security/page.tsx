"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Database, KeyRound, ScrollText, ShieldAlert, ShieldCheck, UserCog } from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { DataTable, type DataColumn } from "@/components/ui/DataTable";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { ActivityFeed, formatDate } from "@/components/ui/Timeline";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { listSyncIssues, resolveSyncIssue, type SyncIssue } from "@/lib/data/superAdmin";
import { isActive, listPrivilegedUsers, recentAccessChanges } from "@/components/super-admin/accessData";
import { toActivityEvents } from "@/components/super-admin/auditLabels";
import { AccountStatusPill, RolePill, UserCell } from "@/components/super-admin/UserPills";

const ISSUE_INFO: Record<string, { label: string; explain: string }> = {
  email_conflict: {
    label: "Email already in use",
    explain:
      "Someone signed in with an email that already belongs to a different account, so they were not linked automatically. Check which account is genuine before resolving.",
  },
  sync_failed: {
    label: "Account setup failed",
    explain:
      "The person signed in, but their dashboard account could not be created or updated. They may not be able to use the dashboard until this is fixed.",
  },
};

const issueInfo = (issue: string) =>
  ISSUE_INFO[issue] ?? { label: issue, explain: "An unrecognised sign-in sync problem." };

export default function SecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security"
        description="Sign-in problems, privileged accounts and how access is enforced."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Security" }]}
      />
      <SyncIssuesSection />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PrivilegedSection />
        <AccessChangesSection />
      </div>
      <EnforcementPanel />
    </div>
  );
}

function SyncIssuesSection() {
  const toast = useToast();
  const [showResolved, setShowResolved] = useState(false);
  const [resolving, setResolving] = useState<SyncIssue | null>(null);
  const { data, error, loading, reload } = useAsync(() => listSyncIssues(showResolved), [showResolved]);

  const columns: DataColumn<SyncIssue>[] = [
    {
      key: "email",
      header: "Email",
      cell: (i) => <span className="break-all font-medium">{i.email ?? "Unknown email"}</span>,
      hideOnCard: true,
    },
    {
      key: "issue",
      header: "Problem",
      cell: (i) => {
        const info = issueInfo(i.issue);
        return (
          <div className="max-w-sm text-left">
            <Pill tone={i.issue === "email_conflict" ? "warning" : "danger"} icon="alert" size="sm">
              {info.label}
            </Pill>
            <p className="mt-1 text-xs text-[var(--muted)]">{info.explain}</p>
          </div>
        );
      },
    },
    {
      key: "detail",
      header: "Detail",
      cell: (i) =>
        i.detail ? (
          <span className="block max-w-xs break-words text-xs text-[var(--muted)]">{i.detail}</span>
        ) : (
          <span className="text-[var(--muted)]">—</span>
        ),
    },
    { key: "created", header: "Reported", cell: (i) => <span className="whitespace-nowrap">{formatDate(i.created_at, true)}</span> },
    {
      key: "actions",
      header: "Status",
      className: "text-right",
      cell: (i) =>
        i.resolved_at ? (
          <Pill tone="success" icon="check" size="sm">
            Resolved {formatDate(i.resolved_at)}
          </Pill>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setResolving(i)}>
            Mark resolved
          </Button>
        ),
    },
  ];

  return (
    <Section
      title="Sign-in sync issues"
      description="Problems linking a Google or email sign-in to a dashboard account."
      actions={
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-[var(--muted)]">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--card-border)] accent-[var(--brand-navy)]"
          />
          Show resolved
        </label>
      }
    >
      {loading && !data ? (
        <LoadingState variant="table" label="Loading sync issues" />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyPanel
          compact
          icon={<CheckCircle2 className="h-6 w-6" aria-hidden="true" />}
          title={showResolved ? "No sync issues recorded" : "No open sync issues"}
          description="Everyone who signed in was linked to their account."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={data}
          rowKey={(i) => i.id}
          cardTitle={(i) => <span className="break-all">{i.email ?? "Unknown email"}</span>}
          caption="Sign-in sync issues"
          loading={loading}
        />
      )}

      <ConfirmDialog
        open={!!resolving}
        title="Mark this issue as resolved?"
        description={
          resolving && (
            <p>
              Only resolve <strong>{resolving.email ?? "this issue"}</strong> ({issueInfo(resolving.issue).label.toLowerCase()})
              once you have fixed the underlying account problem. If it happens again on the next sign-in, a new issue
              will be recorded.
            </p>
          )
        }
        confirmLabel="Mark resolved"
        onClose={() => setResolving(null)}
        onConfirm={async () => {
          if (!resolving) return;
          await resolveSyncIssue(resolving.id);
          setResolving(null);
          toast("Sync issue marked as resolved.");
          reload();
        }}
      />
    </Section>
  );
}

function PrivilegedSection() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(listPrivilegedUsers, []);
  const rows = (data ?? []).slice().sort((a, b) => (a.role === b.role ? 0 : a.role === "super_admin" ? -1 : 1));
  const activeSupers = rows.filter((u) => u.role === "super_admin" && isActive(u)).length;

  return (
    <Section
      title="Privileged accounts"
      description="Admins and super admins."
      actions={
        <Link href="/super-admin/admins" className="shrink-0 text-sm font-medium text-[var(--brand-navy)] hover:underline">
          Manage
        </Link>
      }
    >
      {loading && !data ? (
        <LoadingState variant="list" label="Loading privileged accounts" />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyPanel compact title="No privileged accounts found" />
      ) : (
        <>
          {activeSupers <= 1 && (
            <div
              role="note"
              className="mb-4 flex items-start gap-3 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-light)] p-3 text-sm text-[var(--brand-gold-ink)]"
            >
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                <strong>Single point of failure:</strong> there {activeSupers === 1 ? "is only one" : "is no"} active
                super admin. If that account is lost or locked out, nobody can change roles or settings. We recommend{" "}
                <Link href="/super-admin/admins" className="font-semibold underline">
                  promoting a second super admin
                </Link>
                .
              </p>
            </div>
          )}
          <ul className="divide-y divide-[var(--card-border)]">
            {rows.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <UserCell user={u} isYou={u.id === user?.id} />
                <div className="flex shrink-0 items-center gap-2">
                  <RolePill role={u.role} />
                  <AccountStatusPill user={u} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
  );
}

function AccessChangesSection() {
  const { data, error, loading, reload } = useAsync(() => recentAccessChanges(10), []);
  return (
    <Section
      title="Recent access changes"
      description="Role changes and enabled/disabled accounts."
      actions={
        <Link href="/super-admin/audit-logs" className="shrink-0 text-sm font-medium text-[var(--brand-navy)] hover:underline">
          Audit log
        </Link>
      }
    >
      {loading && !data ? (
        <LoadingState variant="list" label="Loading access changes" />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyPanel compact title="No access changes yet" description="Role and account status changes appear here." />
      ) : (
        <ActivityFeed events={toActivityEvents(data)} />
      )}
    </Section>
  );
}

const ENFORCEMENT = [
  {
    icon: UserCog,
    title: "Roles come from the database",
    text: "Each person's role is read from the users table on the server. Sign-in tokens and browser data are never trusted for access.",
  },
  {
    icon: KeyRound,
    title: "Role changes go through one audited function",
    text: "Only a super admin can change a role or disable an account, and only through set_user_role, which requires a reason and refuses to remove the last super admin.",
  },
  {
    icon: Database,
    title: "Row-level security on every table",
    text: "The database checks the caller's role on every read and write, so hiding a page in the dashboard is never the only protection.",
  },
  {
    icon: ScrollText,
    title: "The audit log is append-only",
    text: "Entries record who acted, their role, the old and new values and the reason. They cannot be edited or deleted from the app.",
  },
];

function EnforcementPanel() {
  return (
    <Section title="How access is enforced">
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ENFORCEMENT.map((e) => (
          <li key={e.title} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]">
              <e.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{e.title}</p>
              <p className="mt-0.5 text-sm text-[var(--muted)]">{e.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-[var(--muted)]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        The checks on these pages are for convenience; the database enforces every rule.
      </p>
    </Section>
  );
}
