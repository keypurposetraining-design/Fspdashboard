"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronRight, FileText, UserX } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { createDraftApplication } from "@/lib/data/member";
import { toDataError } from "@/lib/data/errors";
import { PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StepTimeline, formatDate } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/member/LinkButton";
import { ActionAlert } from "@/components/member/RequiredActions";
import {
  applicationStatusDescription,
  buildApplicationSteps,
  currentMembership,
  latestApplication,
  loadMemberOverview,
  membershipTypeLabel,
  openApplication,
  requiredActions,
} from "@/components/member/workflow";

export default function ApplicationPage() {
  const router = useRouter();
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(loadMemberOverview, []);
  const [starting, setStarting] = useState(false);

  const header = <PageHeader title="Application" description="Track your FSP membership application." />;

  if (loading && !data) return <>{header}<LoadingState variant="detail" label="Loading your application" /></>;
  if (error || !data)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load your application" onRetry={reload} />
      </>
    );

  const profile = data.profile;
  if (!profile)
    return (
      <>
        {header}
        <EmptyPanel
          icon={<UserX className="h-6 w-6" />}
          title="Your profile isn't ready yet"
          description="Your member profile is created when you first sign in. Try again in a moment."
          action={{ label: "Try again", onClick: reload }}
        />
      </>
    );

  const start = async () => {
    setStarting(true);
    try {
      const app = await createDraftApplication(profile.id);
      toast("Application draft created");
      router.push(`/application/${app.id}`);
    } catch (e) {
      toast(toDataError(e, "startApplication").message, "error");
      setStarting(false);
    }
  };

  const app = openApplication(data.applications) ?? latestApplication(data.applications);

  if (!app)
    return (
      <>
        {header}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--muted-light)]/40 px-6 py-14 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">No application submitted</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--muted)]">
            Start your membership application. You can save it as a draft and submit when you&apos;re ready.
          </p>
          <Button className="mt-5" onClick={start} disabled={starting}>
            {starting ? "Starting…" : "Start application"}
          </Button>
        </div>
      </>
    );

  const steps = buildApplicationSteps({
    profile,
    application: app,
    documents: data.documents,
    membership: currentMembership(data.memberships),
  });
  const next = requiredActions(data)[0];
  const others = data.applications.filter((a) => a.id !== app.id);

  return (
    <>
      {header}
      <div className="space-y-6">
        <section
          aria-labelledby="app-status-title"
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 shadow-xs sm:p-6"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {membershipTypeLabel(app.membership_type)} membership application
              </p>
              <h2 id="app-status-title" className="mt-2">
                <span className="sr-only">Status: </span>
                <span aria-live="polite">
                  <StatusBadge kind="application" status={app.status} />
                </span>
              </h2>
              <p className="mt-3 text-sm text-[var(--foreground)]">{applicationStatusDescription(app.status)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {app.submitted_at ? `Submitted ${formatDate(app.submitted_at)}` : `Started ${formatDate(app.created_at)}`}
                {app.reviewed_at && ` · Reviewed ${formatDate(app.reviewed_at)}`}
              </p>
            </div>
            <LinkButton
              href={`/application/${app.id}`}
              variant="outline"
              className="sm:shrink-0"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              View application details
            </LinkButton>
          </div>
        </section>

        {next && (
          <ActionAlert title={next.title} description={next.description}>
            <LinkButton href={next.href} size="sm">
              {next.label}
            </LinkButton>
          </ActionAlert>
        )}

        <Section title="Progress" description="Where your application is in the membership process">
          <StepTimeline steps={steps} />
        </Section>

        {others.length > 0 && (
          <Section title="Past applications">
            <ul className="divide-y divide-[var(--card-border)]">
              {others.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/application/${a.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg py-3 hover:bg-[var(--muted-light)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        {membershipTypeLabel(a.membership_type)} application
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {a.submitted_at ? `Submitted ${formatDate(a.submitted_at)}` : `Started ${formatDate(a.created_at)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusBadge kind="application" status={a.status} size="sm" />
                      <ChevronRight className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </>
  );
}
