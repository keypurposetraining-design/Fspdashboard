"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Clock, History, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAsync } from "@/lib/useAsync";
import { getRenewalFee, getMyProfile, getMyMemberships } from "@/lib/data/member";
import { fullName } from "@/lib/profile";
import { MEMBERSHIP_STATUS } from "@/lib/status";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/components/ui/Timeline";
import { MembershipCard } from "@/components/member/MembershipCard";
import { LinkButton } from "@/components/member/LinkButton";
import {
  currentMembership,
  membershipStatusOf,
  membershipTerm,
  membershipTypeLabel,
} from "@/components/member/workflow";

async function loadMembershipPage() {
  const profile = await getMyProfile();
  const [memberships, fee] = await Promise.all([profile ? getMyMemberships(profile.id) : Promise.resolve([]), getRenewalFee().catch(() => null)]);
  return { profile, memberships, applications: [], documents: [], fee };
}

function formatFee(fee: { amount: number; currency: string }) {
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: fee.currency }).format(fee.amount);
  } catch {
    return `${fee.currency} ${fee.amount}`;
  }
}

/** Renew soon when the term ends within this many days. */
const RENEWAL_WINDOW_DAYS = 30;

export default function MembershipPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useAsync(loadMembershipPage, []);

  const header = <PageHeader title="Membership" description="Your FSP membership status, validity and history." />;

  if (loading && !data) return <>{header}<LoadingState variant="detail" label="Loading your membership" /></>;
  if (error || !data)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load your membership" onRetry={reload} />
      </>
    );

  const membership = currentMembership(data.memberships);
  const term = membershipTerm(membership);
  const history = data.memberships.slice(1);
  const feeText = data.fee ? `Renewal fee: ${formatFee(data.fee)}` : null;

  let panel: React.ReactNode;
  if (term.status === "active") {
    const renewSoon = term.daysRemaining !== null && term.daysRemaining <= RENEWAL_WINDOW_DAYS;
    panel = (
      <div className="rounded-2xl border border-[var(--success-border)] bg-[var(--success-light)] p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          Your membership is active
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {membership?.end_date
            ? `Valid until ${formatDate(membership.end_date)}. ${term.renewalText}.`
            : "Your membership has no expiry date."}
        </p>
        {renewSoon && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <LinkButton href="/payments" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
              Renew membership
            </LinkButton>
            {feeText && <span className="text-xs text-slate-700">{feeText}</span>}
          </div>
        )}
      </div>
    );
  } else if (term.status === "expired") {
    panel = (
      <div role="alert" className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Membership expired
        </p>
        <p className="mt-1 text-sm text-slate-700">
          Your membership expired on {formatDate(membership?.end_date)}. Renew to restore your member benefits.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <LinkButton href="/payments" icon={<RefreshCw className="h-4 w-4" />}>
            Renew membership
          </LinkButton>
          {feeText && <span className="text-sm font-medium text-slate-800">{feeText}</span>}
        </div>
      </div>
    );
  } else if (term.status === "pending" || term.status === "none") {
    panel = (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-xs">
        <p className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <Clock className="h-5 w-5 text-[var(--brand-navy)]" aria-hidden="true" />
          {term.status === "pending" ? "Waiting for approval" : "You're not a member yet"}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Your membership becomes active for one year when FSP verifies payment for the 30 Days Challenge, TTX, or GTX.
          Submit your payment screenshot and transaction reference, then wait for payment approval.
        </p>
        <LinkButton href="/courses" variant="outline" size="sm" className="mt-4">
          Browse qualifying courses
        </LinkButton>
      </div>
    );
  } else {
    panel = (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-xs">
        <p className="text-sm font-semibold text-[var(--foreground)]">{MEMBERSHIP_STATUS[term.status].label}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{MEMBERSHIP_STATUS[term.status].description}</p>
      </div>
    );
  }

  return (
    <>
      {header}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <MembershipCard
          membership={membership}
          memberNumber={data.profile?.member_number}
          memberName={fullName(data.profile) || user?.name}
          className="lg:col-span-2 lg:self-start"
        />
        <div className="space-y-6 lg:col-span-3">
          {panel}
          <Section title="Membership history" description="Earlier membership terms">
            {history.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <History className="h-4 w-4" aria-hidden="true" />
                No earlier memberships.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--card-border)]">
                {history.map((m) => (
                  <li key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {membershipTypeLabel(m.membership_type)} membership
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {formatDate(m.start_date)} – {m.end_date ? formatDate(m.end_date) : "no expiry"}
                      </p>
                    </div>
                    <StatusBadge kind="membership" status={membershipStatusOf(m)} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
