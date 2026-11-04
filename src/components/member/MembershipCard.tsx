import React from "react";
import { BadgeCheck, CalendarClock } from "lucide-react";
import type { Membership } from "@/lib/data/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressLine } from "@/components/ui/ProgressRing";
import { formatDate } from "@/components/ui/Timeline";
import { membershipTerm, membershipTypeLabel } from "@/components/member/workflow";
import { cn } from "@/lib/utils";

/**
 * Professional membership card: status, member number, type, dates and a bar
 * of the term elapsed (only when both start and end dates exist).
 */
export function MembershipCard({
  membership,
  memberNumber,
  memberName,
  footer,
  className,
  compact = false,
}: {
  membership: Membership | null;
  memberNumber: string | null | undefined;
  memberName?: string;
  footer?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  const term = membershipTerm(membership);
  const active = term.status === "active";

  return (
    <section
      aria-labelledby="membership-card-title"
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-xs",
        className
      )}
    >
      <div className="relative bg-[var(--brand-navy)] px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">FSP Professional Membership</p>
            <h2 id="membership-card-title" className="mt-1 truncate text-lg font-bold">
              {memberName || "Membership"}
            </h2>
            <p className="mt-0.5 font-mono text-sm text-white/80">
              {memberNumber ? memberNumber : "Member ID not assigned"}
            </p>
          </div>
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              active ? "bg-[var(--brand-gold)] text-[var(--brand-navy)]" : "bg-white/10 text-white/80"
            )}
            aria-hidden="true"
          >
            <BadgeCheck className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-4" aria-live="polite">
          <StatusBadge kind="membership" status={term.status} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        {compact && <p className="text-sm font-medium">{term.renewalText}</p>}
        <details open={!compact} className="space-y-4">
          <summary className={compact ? "cursor-pointer text-sm font-semibold" : "hidden"}>View membership details</summary>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-[var(--muted)]">Membership type</dt>
            <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
              {membership ? membershipTypeLabel(membership.membership_type) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--muted)]">Renewal status</dt>
            <dd className="mt-0.5 font-semibold text-[var(--foreground)]">{term.renewalText}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--muted)]">Start date</dt>
            <dd className="mt-0.5 text-[var(--foreground)]">{formatDate(membership?.start_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-[var(--muted)]">Expiry date</dt>
            <dd className="mt-0.5 text-[var(--foreground)]">
              {membership ? (membership.end_date ? formatDate(membership.end_date) : "No expiry") : "—"}
            </dd>
          </div>
        </dl>

        {term.percentElapsed !== null && (active || term.status === "expired") && (
          <div>
            <ProgressLine value={term.percentElapsed} label="Term elapsed" />
            {active && term.daysRemaining !== null && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-[var(--foreground)]">{term.daysRemaining}</span> day
                  {term.daysRemaining === 1 ? "" : "s"} remaining
                </span>
              </p>
            )}
          </div>
        )}

        </details>
        {footer}
      </div>
    </section>
  );
}
