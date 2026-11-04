// Member-workflow derivations shared by the dashboard, application, membership
// and documents pages. Plain functions only (no JSX) so the rules live in one place.

import {
  getMyApplications,
  getMyDocuments,
  getMyMemberships,
  getMyProfile,
  latestByType,
} from "@/lib/data/member";
import type {
  AppNotification,
  DocumentType,
  EffectiveMembershipStatus,
  MemberDocument,
  MemberProfile,
  Membership,
  MembershipApplication,
  NotificationCategory,
} from "@/lib/data/types";
import {
  APPLICATION_STATUS,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  effectiveMembershipStatus,
  type Tone,
} from "@/lib/status";
import { profileCompletion } from "@/lib/profile";
import type { ActivityEvent, TimelineStep } from "@/components/ui/Timeline";
import { formatDate } from "@/components/ui/Timeline";

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export interface MemberOverview {
  profile: MemberProfile | null;
  /** Newest first. */
  memberships: Membership[];
  /** Newest first. */
  applications: MembershipApplication[];
  /** Newest first. */
  documents: MemberDocument[];
}

/** Everything the member pages need about the signed-in member (RLS: own rows only). */
export async function loadMemberOverview(includeDocuments = true): Promise<MemberOverview> {
  const profile = await getMyProfile();
  if (!profile) return { profile: null, memberships: [], applications: [], documents: [] };
  const [memberships, applications, documents] = await Promise.all([
    getMyMemberships(profile.id),
    getMyApplications(profile.id),
    includeDocuments ? getMyDocuments(profile.id) : Promise.resolve([]),
  ]);
  return { profile, memberships, applications, documents };
}

// ---------------------------------------------------------------------------
// Membership
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function currentMembership(memberships: Membership[]): Membership | null {
  return memberships[0] ?? null;
}

export function membershipStatusOf(m: Membership | null | undefined): EffectiveMembershipStatus {
  return effectiveMembershipStatus(m?.status, m?.end_date);
}

export interface MembershipTerm {
  status: EffectiveMembershipStatus;
  /** Whole days until end_date (negative once past); null without an end date. */
  daysRemaining: number | null;
  /** Share of the term already elapsed; only when both dates exist. */
  percentElapsed: number | null;
  /** Human renewal line, e.g. "Expires in 42 days". */
  renewalText: string;
}

export function membershipTerm(m: Membership | null | undefined): MembershipTerm {
  const status = membershipStatusOf(m);
  if (!m) return { status, daysRemaining: null, percentElapsed: null, renewalText: "No membership yet" };

  const start = m.start_date ? new Date(m.start_date) : null;
  const end = m.end_date ? new Date(m.end_date) : null;
  const daysRemaining = end ? Math.round((new Date(end).setHours(0, 0, 0, 0) - startOfToday().getTime()) / DAY) : null;

  let percentElapsed: number | null = null;
  if (start && end && end.getTime() > start.getTime()) {
    const p = ((Date.now() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
    percentElapsed = Math.max(0, Math.min(100, p));
  }

  let renewalText: string;
  if (status === "expired") renewalText = `Expired on ${formatDate(m.end_date)}`;
  else if (status === "active" && daysRemaining !== null)
    renewalText =
      daysRemaining === 0 ? "Expires today" : `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`;
  else if (status === "active") renewalText = "No expiry date";
  else if (status === "pending") renewalText = "Starts once approved";
  else if (status === "suspended") renewalText = "Suspended — contact the FSP team";
  else if (status === "cancelled") renewalText = "Cancelled";
  else renewalText = "No membership yet";

  return { status, daysRemaining, percentElapsed, renewalText };
}

/** Readable membership type ("standard" → "Standard"). */
export function membershipTypeLabel(type: string | null | undefined): string {
  if (!type) return "Standard";
  return type
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

const OPEN_STATUSES = new Set(["draft", "submitted", "under_review", "changes_requested"]);

/** The member's application still in progress, if any (newest first). */
export function openApplication(apps: MembershipApplication[]): MembershipApplication | null {
  return apps.find((a) => OPEN_STATUSES.has(a.status)) ?? null;
}

export function latestApplication(apps: MembershipApplication[]): MembershipApplication | null {
  return apps[0] ?? null;
}

export const isEditableApplication = (a: MembershipApplication | null | undefined) =>
  a?.status === "draft" || a?.status === "changes_requested";

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export interface RequiredDocumentSummary {
  total: number;
  approved: number;
  uploaded: number;
  missing: DocumentType[];
  rejected: DocumentType[];
  /** Every required type has a latest document that isn't rejected. */
  allSubmitted: boolean;
}

export function requiredDocumentSummary(docs: MemberDocument[]): RequiredDocumentSummary {
  const latest = latestByType(docs);
  const missing: DocumentType[] = [];
  const rejected: DocumentType[] = [];
  let approved = 0;
  for (const type of REQUIRED_DOCUMENT_TYPES) {
    const d = latest.get(type);
    if (!d) missing.push(type);
    else if (d.status === "rejected") rejected.push(type);
    else if (d.status === "approved") approved++;
  }
  const total = REQUIRED_DOCUMENT_TYPES.length;
  return {
    total,
    approved,
    uploaded: total - missing.length,
    missing,
    rejected,
    allSubmitted: missing.length === 0 && rejected.length === 0,
  };
}

const docLabels = (types: DocumentType[]) => types.map((t) => DOCUMENT_TYPES[t].label).join(", ");

/** Document types in display order: required first, then optional. */
export const ORDERED_DOCUMENT_TYPES: DocumentType[] = [
  ...REQUIRED_DOCUMENT_TYPES,
  ...(Object.keys(DOCUMENT_TYPES) as DocumentType[]).filter((t) => !DOCUMENT_TYPES[t].required),
];

// ---------------------------------------------------------------------------
// Application steps (dashboard, /application, /application/[id])
// ---------------------------------------------------------------------------

export function buildApplicationSteps(opts: {
  profile: MemberProfile | null;
  application: MembershipApplication | null;
  documents: MemberDocument[];
  membership: Membership | null;
}): TimelineStep[] {
  const { profile, application: app, documents, membership } = opts;
  const completion = profileCompletion(profile);
  const docs = requiredDocumentSummary(documents);
  const status = app?.status ?? "none";
  const memStatus = membershipStatusOf(membership);
  const submittedOnce = ["submitted", "under_review", "approved", "rejected", "changes_requested"].includes(status);

  const profileStep: TimelineStep =
    completion.percent >= 100
      ? { label: "Profile completed", state: "done" }
      : {
          label: "Profile completed",
          state: "current",
          meta: `${completion.percent}% complete`,
          description: completion.hint,
        };

  let submitStep: TimelineStep;
  if (status === "changes_requested")
    submitStep = {
      label: "Application submitted",
      state: "attention",
      meta: app?.submitted_at ? `Submitted ${formatDate(app.submitted_at)}` : undefined,
      description: "Changes were requested. Update your application and resubmit.",
    };
  else if (submittedOnce)
    submitStep = { label: "Application submitted", state: "done", meta: formatDate(app?.submitted_at) };
  else if (status === "draft")
    submitStep = { label: "Application submitted", state: "current", description: "Your draft is ready to finish." };
  else submitStep = { label: "Application submitted", state: "upcoming" };

  let docsStep: TimelineStep;
  if (docs.allSubmitted) docsStep = { label: "Documents submitted", state: "done", meta: `${docs.approved} of ${docs.total} approved` };
  else if (docs.rejected.length > 0)
    docsStep = {
      label: "Documents submitted",
      state: "attention",
      description: `Re-upload: ${docLabels(docs.rejected)}.`,
    };
  else
    docsStep = {
      label: "Documents submitted",
      state: app ? "current" : "upcoming",
      meta: `${docs.uploaded} of ${docs.total} uploaded`,
      description: app ? `Still needed: ${docLabels(docs.missing)}.` : undefined,
    };

  let reviewStep: TimelineStep;
  if (status === "submitted") reviewStep = { label: "Admin review", state: "current", description: "Waiting for an administrator." };
  else if (status === "under_review")
    reviewStep = { label: "Admin review", state: "current", description: "An administrator is reviewing your application." };
  else if (status === "approved" || status === "rejected" || status === "changes_requested")
    reviewStep = {
      label: "Admin review",
      state: "done",
      meta: app?.reviewed_at ? `Reviewed ${formatDate(app.reviewed_at)}` : undefined,
      description: status === "changes_requested" ? "Changes requested." : undefined,
    };
  else reviewStep = { label: "Admin review", state: "upcoming" };

  let approvalStep: TimelineStep;
  if (status === "approved") approvalStep = { label: "Approval", state: "done", meta: formatDate(app?.reviewed_at) };
  else if (status === "rejected")
    approvalStep = { label: "Approval", state: "failed", description: "Your application was not approved." };
  else approvalStep = { label: "Approval", state: "upcoming" };

  let activeStep: TimelineStep;
  if (memStatus === "active")
    activeStep = { label: "Membership active", state: "done", meta: `Since ${formatDate(membership?.start_date)}` };
  else if (memStatus === "expired")
    activeStep = { label: "Membership active", state: "attention", description: `Expired on ${formatDate(membership?.end_date)}.` };
  else if (memStatus === "suspended")
    activeStep = { label: "Membership active", state: "attention", description: "Your membership is suspended." };
  else if (status === "approved")
    activeStep = { label: "Membership active", state: "current", description: "Your membership is being activated." };
  else activeStep = { label: "Membership active", state: "upcoming" };

  return [profileStep, submitStep, docsStep, reviewStep, approvalStep, activeStep];
}

// ---------------------------------------------------------------------------
// Required actions
// ---------------------------------------------------------------------------

export type RequiredActionKind = "profile" | "start_application" | "application" | "documents" | "renew";

export interface RequiredAction {
  id: string;
  kind: RequiredActionKind;
  title: string;
  description: string;
  label: string;
  href: string;
  tone: Tone;
}

/** Ordered list of things the member should do next, derived from their records. */
export function requiredActions(o: MemberOverview): RequiredAction[] {
  const actions: RequiredAction[] = [];
  const membership = currentMembership(o.memberships);
  const memStatus = membershipStatusOf(membership);
  const completion = profileCompletion(o.profile);
  const open = openApplication(o.applications);
  const latest = latestApplication(o.applications);
  const docs = requiredDocumentSummary(o.documents);
  const isMember = memStatus === "active";

  if (completion.percent < 100)
    actions.push({
      id: "profile",
      kind: "profile",
      title: "Complete your profile",
      description: `${completion.percent}% complete. ${completion.hint}`,
      label: "Complete profile",
      href: "/profile/edit",
      tone: "warning",
    });

  if (open?.status === "draft")
    actions.push({
      id: "app-draft",
      kind: "application",
      title: "Finish and submit your application",
      description: "Your application is saved as a draft and hasn't been sent for review.",
      label: "Continue application",
      href: `/application/${open.id}`,
      tone: "info",
    });
  else if (open?.status === "changes_requested")
    actions.push({
      id: "app-changes",
      kind: "application",
      title: "Update and resubmit your application",
      description: "The FSP team asked for changes to your application.",
      label: "Resubmit application",
      href: `/application/${open.id}`,
      tone: "warning",
    });
  else if (!open && !isMember && memStatus !== "expired" && latest?.status !== "approved") {
    actions.push(
      latest?.status === "rejected"
        ? {
            id: "app-rejected",
            kind: "application",
            title: "Review the decision on your application",
            description: "Your last application was not approved. See the comments from the FSP team.",
            label: "View application",
            href: `/application/${latest.id}`,
            tone: "danger",
          }
        : {
            id: "app-start",
            kind: "start_application",
            title: "Start your membership application",
            description: "Apply to become an FSP member. You can save a draft and finish later.",
            label: "Start application",
            href: "/application",
            tone: "info",
          }
    );
  }

  if (docs.rejected.length > 0)
    actions.push({
      id: "docs-rejected",
      kind: "documents",
      title: "Re-upload rejected documents",
      description: docLabels(docs.rejected),
      label: "Re-upload",
      href: "/documents",
      tone: "danger",
    });
  if (docs.missing.length > 0 && !isMember)
    actions.push({
      id: "docs-missing",
      kind: "documents",
      title: "Upload required documents",
      description: docLabels(docs.missing),
      label: "Upload documents",
      href: "/documents",
      tone: "warning",
    });

  if (memStatus === "expired")
    actions.push({
      id: "renew",
      kind: "renew",
      title: "Renew your membership",
      description: `Your membership expired on ${formatDate(membership?.end_date)}.`,
      label: "Renew membership",
      href: "/payments",
      tone: "danger",
    });

  return actions;
}

// ---------------------------------------------------------------------------
// Recent activity (composed from the member's own records)
// ---------------------------------------------------------------------------

export type ActivityKind = "application" | "document" | "membership" | "profile";
export type MemberActivity = ActivityEvent & { kind: ActivityKind };

const REVIEW_TITLE: Partial<Record<string, { title: string; tone: Tone }>> = {
  approved: { title: "Application approved", tone: "success" },
  rejected: { title: "Application not approved", tone: "danger" },
  changes_requested: { title: "Changes requested on your application", tone: "warning" },
  under_review: { title: "Application moved to review", tone: "info" },
};

export function buildMemberActivity(o: MemberOverview, limit = 8): MemberActivity[] {
  const events: MemberActivity[] = [];
  const now = Date.now();

  for (const a of o.applications) {
    events.push({ id: `app-c-${a.id}`, kind: "application", title: "Application started", at: a.created_at, tone: "neutral" });
    if (a.submitted_at)
      events.push({ id: `app-s-${a.id}`, kind: "application", title: "Application submitted", at: a.submitted_at, tone: "info" });
    const review = REVIEW_TITLE[a.status];
    if (a.reviewed_at && review)
      events.push({
        id: `app-r-${a.id}`,
        kind: "application",
        title: review.title,
        detail: a.decision_reason ?? undefined,
        at: a.reviewed_at,
        tone: review.tone,
      });
  }

  for (const d of o.documents) {
    const label = DOCUMENT_TYPES[d.document_type]?.label ?? "Document";
    events.push({ id: `doc-u-${d.id}`, kind: "document", title: `Uploaded ${label.toLowerCase()}`, detail: d.file_name, at: d.uploaded_at, tone: "neutral" });
    if (d.reviewed_at && d.status !== "pending")
      events.push({
        id: `doc-r-${d.id}`,
        kind: "document",
        title: `${label} ${d.status === "approved" ? "approved" : "rejected"}`,
        detail: d.status === "rejected" ? d.rejection_reason ?? undefined : undefined,
        at: d.reviewed_at,
        tone: d.status === "approved" ? "success" : "danger",
      });
  }

  for (const m of o.memberships) {
    if (m.start_date && new Date(m.start_date).getTime() <= now && m.status !== "pending")
      events.push({ id: `mem-${m.id}`, kind: "membership", title: "Membership started", detail: membershipTypeLabel(m.membership_type), at: m.start_date, tone: "success" });
  }

  const p = o.profile;
  // Ignore the updated_at written when the row was created.
  if (p && new Date(p.updated_at).getTime() - new Date(p.created_at).getTime() > 60_000)
    events.push({ id: "profile", kind: "profile", title: "Profile updated", at: p.updated_at, tone: "neutral" });

  return events
    .filter((e) => !Number.isNaN(new Date(e.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationCategory = (n: AppNotification): NotificationCategory => n.payload?.category ?? "system";

export const applicationStatusDescription = (status: string | null | undefined) =>
  APPLICATION_STATUS[(status ?? "none") as keyof typeof APPLICATION_STATUS]?.description ?? "";
