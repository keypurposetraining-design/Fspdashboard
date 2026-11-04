"use client";

import React from "react";
import { TodaysUpdates } from "@/components/member/TodaysUpdates";
import Link from "next/link";
import {
  ArrowRight,
  Lock,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
  UserX,
  Users,
  RefreshCcw,
} from "lucide-react";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { ActivityFeed } from "@/components/ui/Timeline";
import { KpiCard } from "@/components/charts/Charts";
import { StatusIconGlyph } from "@/components/ui/StatusBadge";
import { useAsync } from "@/lib/useAsync";
import { listAuditLogs } from "@/lib/data/admin";
import { listSyncIssues } from "@/lib/data/superAdmin";
import { recentAccessChanges, listPrivilegedUsers, isActive } from "@/components/super-admin/accessData";
import { toActivityEvents } from "@/components/super-admin/auditLabels";

const SECTIONS = [
  { href: "/super-admin/admins", label: "Admin Management", text: "Promote, demote and disable admin accounts.", icon: UserCog },
  { href: "/super-admin/users", label: "User Management", text: "Find any account and change its role or access.", icon: Users },
  { href: "/super-admin/settings", label: "System Settings", text: "Membership term, renewal fee and other settings.", icon: SlidersHorizontal },
  { href: "/super-admin/audit-logs", label: "Audit Logs", text: "The complete, read-only history of changes.", icon: ScrollText },
  { href: "/super-admin/security", label: "Security", text: "Sign-in sync issues and privileged accounts.", icon: Lock },
];

export default function SuperAdminOverviewPage() {
  const { data, error, loading, reload } = useAsync(async () => {
    const [privileged, issues, access, settings] = await Promise.all([
      listPrivilegedUsers(),
      // Sync issues are optional (migration 002); a failure shouldn't hide the page.
      listSyncIssues(false).catch(() => null),
      recentAccessChanges(6),
      listAuditLogs({ action: "SETTINGS_CHANGED", page: 1, pageSize: 6 }),
    ]);
    return { privileged, issues, access, settings: settings.rows };
  }, []);

  const header = (
    <>
    <PageHeader
      title="Super Admin"
      description="Access control, system settings and the audit trail."
    />
    <TodaysUpdates />
    </>
  );

  if (loading && !data) {
    return (
      <>
        {header}
        <LoadingState variant="cards" label="Loading overview" />
      </>
    );
  }
  if (error && !data) {
    return (
      <>
        {header}
        <ErrorState error={error} onRetry={reload} />
      </>
    );
  }
  if (!data) return null;

  const superAdmins = data.privileged.filter((u) => u.role === "super_admin");
  const activeSuperAdmins = superAdmins.filter(isActive);
  const admins = data.privileged.filter((u) => u.role === "admin");
  const hasActiveFlag = data.privileged.some((u) => typeof u.is_active === "boolean");
  const disabledPrivileged = data.privileged.filter((u) => !isActive(u)).length;

  return (
    <div className="space-y-6">
      {header}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Super admins"
          value={activeSuperAdmins.length}
          context={
            activeSuperAdmins.length === 1
              ? "Only one active — add a second"
              : superAdmins.length !== activeSuperAdmins.length
                ? `${superAdmins.length - activeSuperAdmins.length} disabled`
                : "Active accounts"
          }
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          tone={activeSuperAdmins.length <= 1 ? "warning" : "neutral"}
          href="/super-admin/admins"
        />
        <KpiCard
          label="Admins"
          value={admins.filter(isActive).length}
          context="Active admin accounts"
          icon={<UserCog className="h-5 w-5" aria-hidden="true" />}
          href="/super-admin/admins"
        />
        {hasActiveFlag && (
          <KpiCard
            label="Disabled privileged accounts"
            value={disabledPrivileged}
            context="Admins and super admins"
            icon={<UserX className="h-5 w-5" aria-hidden="true" />}
            tone={disabledPrivileged > 0 ? "warning" : "neutral"}
            href="/super-admin/admins"
          />
        )}
        <KpiCard
          label="Open sign-in sync issues"
          value={data.issues ? data.issues.length : "—"}
          context={data.issues ? (data.issues.length ? "Need review" : "Nothing to review") : "Not available yet"}
          icon={<RefreshCcw className="h-5 w-5" aria-hidden="true" />}
          tone={data.issues && data.issues.length > 0 ? "danger" : "neutral"}
          href="/super-admin/security"
        />
      </div>

      {activeSuperAdmins.length === 1 && (
        <div
          role="note"
          className="flex items-start gap-3 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-light)] p-4 text-sm text-[var(--brand-gold-ink)]"
        >
          <StatusIconGlyph icon="alert" className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            There is only one active super admin. If that account is lost, nobody can change roles or system settings.{" "}
            <Link href="/super-admin/admins" className="font-semibold underline">
              Promote a second super admin
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section
          title="Recent role & access changes"
          actions={
            <Link href="/super-admin/audit-logs" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
              View all
            </Link>
          }
        >
          {data.access.length ? (
            <ActivityFeed events={toActivityEvents(data.access)} />
          ) : (
            <EmptyPanel compact title="No role or access changes yet" description="Changes made here will appear in this list." />
          )}
        </Section>

        <Section
          title="Recent settings changes"
          actions={
            <Link href="/super-admin/settings" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
              Settings
            </Link>
          }
        >
          {data.settings.length ? (
            <ActivityFeed events={toActivityEvents(data.settings)} />
          ) : (
            <EmptyPanel compact title="No settings changes yet" description="Edits to system settings are logged here." />
          )}
        </Section>
      </div>

      <Section title="Sections">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="group flex h-full items-start gap-3 rounded-xl border border-[var(--card-border)] p-4 transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]">
                  <s.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-semibold text-[var(--foreground)]">
                    {s.label}
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">{s.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
