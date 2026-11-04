import React from "react";
import { Mail, Hash, Shield } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROLE_LABEL } from "@/lib/status";
import { MemberAvatar } from "@/components/admin-ui/MemberAvatar";

/** Identity card at the top of admin member pages. */
export function MemberHeader({
  name,
  email,
  memberNumber,
  role,
  membershipStatus,
  applicationStatus,
  inactive,
  actions,
}: {
  name: string;
  email?: string | null;
  memberNumber?: string | null;
  role?: string | null;
  membershipStatus: string;
  applicationStatus: string;
  inactive?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <MemberAvatar name={name} size="lg" />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-[var(--foreground)]">{name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              {email && (
                <span className="flex min-w-0 items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{email}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Member ID</span>
                {memberNumber || "No member ID yet"}
              </span>
              {role && (
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  {ROLE_LABEL[role] ?? role}
                  {inactive && <span className="text-red-700">(account disabled)</span>}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                Membership <StatusBadge kind="membership" status={membershipStatus} size="sm" />
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                Application <StatusBadge kind="application" status={applicationStatus} size="sm" />
              </span>
            </div>
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </section>
  );
}
