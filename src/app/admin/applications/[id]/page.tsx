"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileQuestion, History } from "lucide-react";
import { Breadcrumbs, DescriptionList, PageHeader, Section } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyPanel } from "@/components/ui/States";
import { formatDate } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberHeader } from "@/components/admin-ui/MemberHeader";
import { DocumentReviewList } from "@/components/admin-ui/DocumentReview";
import { DecisionPanel, type ReviewDecision } from "@/components/admin-ui/DecisionPanel";
import { AuditTimeline } from "@/components/admin-ui/AuditTimeline";
import { memberName, waitingLabel } from "@/components/admin-ui/format";
import { useAsync } from "@/lib/useAsync";
import { getApplicationForReview, getMemberActivity, getMemberDetail, reviewApplication } from "@/lib/data/admin";
import { toDataError } from "@/lib/data/errors";
import { profileCompletion } from "@/lib/profile";
import { APPLICATION_STATUS, effectiveMembershipStatus } from "@/lib/status";

const SUCCESS: Record<ReviewDecision, string> = {
  under_review: "Review started. The member has been notified.",
  approved: "Application approved. The membership is now active.",
  changes_requested: "Changes requested. The member has been notified.",
  rejected: "Application rejected. The member has been notified.",
};

async function loadReview(id: string) {
  const app = await getApplicationForReview(id);
  if (!app) return null;
  const detail = await getMemberDetail(app.member_id);
  return detail ? { app, detail } : null;
}

const crumbs = (name: string) => [
  { label: "Admin", href: "/admin" },
  { label: "Approvals", href: "/admin/applications" },
  { label: name },
];

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const toast = useToast();

  const review = useAsync(() => loadReview(id), [id]);
  const data = review.data;
  const activity = useAsync(
    () => (data ? getMemberActivity(data.detail, 30) : Promise.resolve([])),
    [data],
    !!data
  );

  if (review.error && !data) {
    return (
      <>
        <Breadcrumbs items={crumbs("Application")} />
        <ErrorState error={review.error} onRetry={review.reload} />
      </>
    );
  }
  if (data === undefined) return <LoadingState variant="detail" label="Loading application" />;
  if (data === null) {
    return (
      <>
        <Breadcrumbs items={crumbs("Not found")} />
        <EmptyPanel
          icon={<FileQuestion className="h-6 w-6" />}
          title="Application not found"
          description="It may have been removed, or the link is incorrect."
          action={{ label: "Back to approvals", href: "/admin/applications" }}
        />
      </>
    );
  }

  const { app, detail } = data;
  const { profile } = detail;
  const name = memberName(profile, profile.users?.name || profile.users?.email);
  const isOwn = !!user && profile.user_id === user.id;
  const reviewable = app.status === "submitted" || app.status === "under_review";
  const latestMs = detail.memberships[0];
  const completion = profileCompletion(profile);

  // Presentation only: review_application re-checks both rules server-side.
  const blockedReason = isOwn
    ? "This is your own application. Another administrator must review it."
    : !reviewable
      ? app.status === "changes_requested"
        ? "Changes were requested. Decisions are available again once the member resubmits."
        : `This application is ${APPLICATION_STATUS[app.status].label.toLowerCase()}. Only submitted applications can be reviewed.`
      : null;

  const onDecide = async (decision: ReviewDecision, reason?: string) => {
    if (decision === "under_review") {
      try {
        await reviewApplication(app.id, decision);
      } catch (e) {
        toast(toDataError(e, "startReview").message, "error");
        return;
      }
    } else {
      // Errors propagate so the confirm dialog stays open and shows them.
      await reviewApplication(app.id, decision, reason);
    }
    toast(SUCCESS[decision]);
    review.reload();
  };

  const address = [profile.address, profile.city, profile.state, profile.postal_code, profile.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        title="Review application"
        description={
          app.submitted_at
            ? `Submitted ${formatDate(app.submitted_at, true)}${reviewable ? ` · ${waitingLabel(app.submitted_at)}` : ""}`
            : undefined
        }
        breadcrumbs={crumbs(name)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <MemberHeader
            name={name}
            email={profile.users?.email}
            memberNumber={profile.member_number}
            role={profile.users?.role}
            membershipStatus={effectiveMembershipStatus(latestMs?.status, latestMs?.end_date)}
            applicationStatus={app.status}
            actions={
              <Link
                href={`/admin/members/${profile.id}`}
                className="text-sm font-medium text-[var(--brand-navy)] hover:underline"
              >
                Open member record
              </Link>
            }
          />

          <Section title="Member information">
            <DescriptionList
              items={[
                { label: "Name", value: name },
                { label: "Email", value: profile.users?.email },
                { label: "Phone", value: profile.phone },
                { label: "Address", value: address },
                { label: "Occupation", value: profile.occupation },
                { label: "Company / workplace", value: profile.organization },
                { label: "Registered", value: formatDate(profile.created_at) },
                {
                  label: "Profile completion",
                  value: `${completion.percent}%${completion.missing.length ? ` · missing ${completion.missing.map((m) => m.label.toLowerCase()).join(", ")}` : ""}`,
                },
              ]}
            />
          </Section>

          <Section title="Application information">
            <DescriptionList
              items={[
                { label: "Membership type", value: app.membership_type?.replace(/_/g, " ") },
                { label: "Submitted", value: app.submitted_at ? formatDate(app.submitted_at, true) : null },
                { label: "Reviewed", value: app.reviewed_at ? formatDate(app.reviewed_at, true) : null },
                { label: "Motivation", value: app.motivation && <span className="whitespace-pre-line">{app.motivation}</span> },
                { label: "Experience", value: app.experience && <span className="whitespace-pre-line">{app.experience}</span> },
                { label: "How they heard about FSP", value: app.referral_source },
                ...(app.decision_reason ? [{ label: "Decision reason", value: app.decision_reason }] : []),
              ]}
            />
          </Section>

          <Section title="Documents" description="Latest upload per document type.">
            <DocumentReviewList documents={detail.documents} isOwn={isOwn} memberName={name} onReviewed={review.reload} />
          </Section>

          <Section title="Previous activity">
            {activity.error && !activity.data ? (
              <ErrorState error={activity.error} onRetry={activity.reload} />
            ) : !activity.data ? (
              <LoadingState variant="list" label="Loading activity" />
            ) : activity.data.length === 0 ? (
              <EmptyPanel compact icon={<History className="h-6 w-6" />} title="No activity recorded yet" />
            ) : (
              <AuditTimeline entries={activity.data} />
            )}
          </Section>
        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <Section title="Decision">
              <DecisionPanel status={app.status} memberName={name} blockedReason={blockedReason} onDecide={onDecide} />
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
