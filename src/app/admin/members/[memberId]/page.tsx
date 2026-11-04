"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ClipboardCheck, ExternalLink, FileText, Pencil, UserX, BadgeCheck, History } from "lucide-react";
import { Breadcrumbs, DescriptionList, Section } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyPanel } from "@/components/ui/States";
import { StatusBadge, Pill } from "@/components/ui/StatusBadge";
import { TabBar, TabPanel, type TabItem } from "@/components/ui/TabBar";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { formatDate } from "@/components/ui/Timeline";
import { TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { MemberHeader } from "@/components/admin-ui/MemberHeader";
import { DocumentReviewList } from "@/components/admin-ui/DocumentReview";
import { AuditTimeline } from "@/components/admin-ui/AuditTimeline";
import { memberName } from "@/components/admin-ui/format";
import { useQueryParams } from "@/components/admin-ui/useQueryParams";
import { useAsync } from "@/lib/useAsync";
import { getMemberActivity, getMemberDetail, type MemberDetail } from "@/lib/data/admin";
import { DataError, toDataError } from "@/lib/data/errors";
import { createClient } from "@/lib/supabase/client";
import { PROFILE_FIELDS, profileCompletion, validateProfile, type ProfileErrors } from "@/lib/profile";
import { DOCUMENT_TYPES, REQUIRED_DOCUMENT_TYPES, ROLE_LABEL, effectiveMembershipStatus } from "@/lib/status";
import type { DocumentType, EditableProfileFields, MemberDocument } from "@/lib/data/types";

type TabKey = "overview" | "profile" | "application" | "membership" | "documents" | "activity";
const TAB_KEYS: TabKey[] = ["overview", "profile", "application", "membership", "documents", "activity"];

/** Fields an admin may edit here; user_id, member_number and the avatar are never sent. */
const ADMIN_EDITABLE = [
  "first_name",
  "last_name",
  "phone",
  "address",
  "city",
  "state",
  "postal_code",
  "country",
  "occupation",
  "organization",
] as const satisfies readonly (keyof EditableProfileFields)[];
type EditableKey = (typeof ADMIN_EDITABLE)[number];

function latestPerType(docs: MemberDocument[]) {
  const map = new Map<DocumentType, MemberDocument>();
  [...docs]
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
    .forEach((d) => {
      if (!map.has(d.document_type)) map.set(d.document_type, d);
    });
  return map;
}

function MemberDetailView() {
  const { memberId } = useParams<{ memberId: string }>();
  const { user } = useAuth();
  const { params, update } = useQueryParams();
  const tabParam = params.get("tab") as TabKey | null;
  const tab: TabKey = tabParam && TAB_KEYS.includes(tabParam) ? tabParam : "overview";
  const [editing, setEditing] = useState(false);

  const detail = useAsync(() => getMemberDetail(memberId), [memberId]);
  const d = detail.data;
  const activity = useAsync(() => (d ? getMemberActivity(d) : Promise.resolve([])), [d], !!d);

  if (detail.error && !d) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Members", href: "/admin/members" }, { label: "Member" }]} />
        <ErrorState error={detail.error} onRetry={detail.reload} />
      </>
    );
  }
  if (d === undefined) return <LoadingState variant="detail" label="Loading member" />;
  if (d === null) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Members", href: "/admin/members" }, { label: "Not found" }]} />
        <EmptyPanel
          icon={<UserX className="h-6 w-6" />}
          title="Member not found"
          description="This member may have been removed, or the link is incorrect."
          action={{ label: "Back to members", href: "/admin/members" }}
        />
      </>
    );
  }

  const { profile, memberships, applications, documents } = d;
  const name = memberName(profile, profile.users?.name || profile.users?.email);
  const latestMs = memberships[0];
  const msStatus = effectiveMembershipStatus(latestMs?.status, latestMs?.end_date);
  const latestApp = applications[0];
  const isOwn = !!user && profile.user_id === user.id;
  const pendingDocs = documents.filter((x) => x.status === "pending").length;

  const tabs: TabItem<TabKey>[] = [
    { key: "overview", label: "Overview" },
    { key: "profile", label: "Profile" },
    { key: "application", label: "Application", count: applications.length || undefined },
    { key: "membership", label: "Membership" },
    { key: "documents", label: "Documents", count: pendingDocs || undefined },
    { key: "activity", label: "Activity" },
  ];
  const goTab = (k: TabKey) => update({ tab: k === "overview" ? null : k });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Members", href: "/admin/members" }, { label: name }]} />
      <MemberHeader
        name={name}
        email={profile.users?.email}
        memberNumber={profile.member_number}
        role={profile.users?.role}
        inactive={profile.users?.is_active === false}
        membershipStatus={msStatus}
        applicationStatus={latestApp?.status ?? "none"}
        actions={
          latestApp && (latestApp.status === "submitted" || latestApp.status === "under_review") ? (
            <Link
              href={`/admin/applications/${latestApp.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-navy)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-navy-hover)]"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Review application
            </Link>
          ) : undefined
        }
      />
      {isOwn && (
        <p className="rounded-lg bg-[var(--info-light)] px-3 py-2 text-sm text-[var(--brand-navy)]">
          This is your own member record. Another administrator must review your application and documents.
        </p>
      )}

      <div>
        <TabBar tabs={tabs} active={tab} onChange={goTab} label="Member sections" idPrefix="member" />
        <TabPanel idPrefix="member" activeKey={tab}>
          {tab === "overview" && (
            <OverviewTab
              detail={d}
              msStatus={msStatus}
              onEdit={() => {
                setEditing(true);
                goTab("profile");
              }}
              goTab={goTab}
            />
          )}
          {tab === "profile" && (
            <ProfileTab detail={d} editing={editing} setEditing={setEditing} onSaved={detail.reload} />
          )}
          {tab === "application" && <ApplicationsTab detail={d} />}
          {tab === "membership" && <MembershipTab detail={d} />}
          {tab === "documents" && (
            <Section title="Documents" description="Latest upload per document type. Older uploads are listed underneath.">
              <DocumentReviewList documents={documents} isOwn={isOwn} memberName={name} onReviewed={detail.reload} />
            </Section>
          )}
          {tab === "activity" && (
            <Section title="Activity" description="Changes to this member's profile, applications, documents and membership.">
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
          )}
        </TabPanel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function OverviewTab({
  detail,
  msStatus,
  onEdit,
  goTab,
}: {
  detail: MemberDetail;
  msStatus: string;
  onEdit: () => void;
  goTab: (k: TabKey) => void;
}) {
  const { profile, memberships, applications, documents } = detail;
  const completion = profileCompletion(profile);
  const latestMs = memberships[0];
  const latestApp = applications[0];
  const latest = latestPerType(documents);
  const docCounts = { approved: 0, pending: 0, rejected: 0 };
  latest.forEach((doc) => docCounts[doc.status]++);
  const missingRequired = REQUIRED_DOCUMENT_TYPES.filter((t) => !latest.has(t));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Section title="Key facts" className="lg:col-span-2">
        <DescriptionList
          items={[
            { label: "Member ID", value: profile.member_number },
            { label: "Email", value: profile.users?.email },
            { label: "Phone", value: profile.phone },
            { label: "Role", value: profile.users?.role ? ROLE_LABEL[profile.users.role] ?? profile.users.role : null },
            { label: "Membership", value: <StatusBadge kind="membership" status={msStatus} size="sm" /> },
            { label: "Membership ends", value: latestMs?.end_date ? formatDate(latestMs.end_date) : null },
            { label: "Registered", value: formatDate(profile.created_at) },
            { label: "Last updated", value: formatDate(profile.updated_at, true) },
          ]}
        />
      </Section>

      <Section title="Profile completion">
        <div className="flex items-center gap-4">
          <ProgressRing value={completion.percent} label="Profile completion" />
          <div className="min-w-0 text-sm">
            <p className="font-medium text-[var(--foreground)]">
              {completion.completed} of {completion.total} required fields
            </p>
            {completion.missing.length > 0 ? (
              <p className="mt-1 text-[var(--muted)]">Missing: {completion.missing.map((m) => m.label).join(", ")}</p>
            ) : (
              <p className="mt-1 text-[var(--muted)]">All required fields are filled in.</p>
            )}
          </div>
        </div>
      </Section>

      <Section
        title="Latest application"
        actions={
          latestApp ? (
            <Link href={`/admin/applications/${latestApp.id}`} className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
              Open
            </Link>
          ) : undefined
        }
      >
        {latestApp ? (
          <div className="space-y-2 text-sm">
            <StatusBadge kind="application" status={latestApp.status} />
            <p className="text-[var(--muted)]">
              Submitted {formatDate(latestApp.submitted_at)}
              {latestApp.reviewed_at && ` · Reviewed ${formatDate(latestApp.reviewed_at)}`}
            </p>
            {latestApp.decision_reason && <p className="text-[var(--foreground)]">“{latestApp.decision_reason}”</p>}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]">This member hasn&apos;t started an application.</p>
        )}
      </Section>

      <Section
        title="Documents"
        actions={
          <button type="button" onClick={() => goTab("documents")} className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
            Open
          </button>
        }
      >
        {latest.size === 0 ? (
          <p className="text-sm text-[var(--muted)]">No documents uploaded yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {docCounts.approved > 0 && <Pill tone="success" icon="check" size="sm">{docCounts.approved} approved</Pill>}
            {docCounts.pending > 0 && <Pill tone="warning" icon="clock" size="sm">{docCounts.pending} pending review</Pill>}
            {docCounts.rejected > 0 && <Pill tone="danger" icon="alert" size="sm">{docCounts.rejected} rejected</Pill>}
          </div>
        )}
        {missingRequired.length > 0 && (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Not uploaded: {missingRequired.map((t) => DOCUMENT_TYPES[t].label).join(", ")}
          </p>
        )}
      </Section>

      <Section title="Quick actions">
        <div className="flex flex-col gap-2">
          {latestApp && (latestApp.status === "submitted" || latestApp.status === "under_review") && (
            <Link
              href={`/admin/applications/${latestApp.id}`}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--muted-light)]"
            >
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Review application
            </Link>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--muted-light)]"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit profile
          </button>
          <button
            type="button"
            onClick={() => goTab("documents")}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--muted-light)]"
          >
            <FileText className="h-4 w-4" aria-hidden="true" /> Review documents
          </button>
          <Link
            href="/admin/memberships"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--muted-light)]"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Manage memberships
          </Link>
        </div>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function ProfileTab({
  detail,
  editing,
  setEditing,
  onSaved,
}: {
  detail: MemberDetail;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onSaved: () => void;
}) {
  const { profile } = detail;
  const toast = useToast();
  const initial = () =>
    Object.fromEntries(ADMIN_EDITABLE.map((k) => [k, profile[k] ?? ""])) as Record<EditableKey, string>;
  const [form, setForm] = useState<Record<EditableKey, string>>(initial);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startEdit = () => {
    setForm(initial());
    setErrors({});
    setSaveError(null);
    setEditing(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { values, errors: errs } = validateProfile(form);
    setErrors(errs);
    setSaveError(null);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const res = await createClient().from("members").update(values).eq("id", profile.id).select("id");
      if (res.error) throw toDataError(res.error, "adminUpdateProfile");
      // RLS silently filters rows the caller may not update.
      if (!res.data || res.data.length === 0) throw new DataError("permission", "You don't have permission to do that.");
      toast("Profile updated.");
      setEditing(false);
      onSaved();
    } catch (err) {
      setSaveError(toDataError(err, "adminUpdateProfile").message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <Section
        title="Profile"
        actions={
          <Button variant="outline" size="sm" onClick={startEdit} icon={<Pencil className="h-3.5 w-3.5" />}>
            Edit
          </Button>
        }
      >
        <DescriptionList
          items={[
            { label: "Member ID", value: profile.member_number },
            { label: "Email", value: profile.users?.email },
            ...ADMIN_EDITABLE.map((k) => ({ label: PROFILE_FIELDS[k].label, value: profile[k] })),
          ]}
        />
      </Section>
    );
  }

  return (
    <Section title="Edit profile" description="Member ID, email and account role can't be changed here.">
      <form onSubmit={save} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {ADMIN_EDITABLE.map((k) => (
            <TextField
              key={k}
              label={PROFILE_FIELDS[k].label}
              required={k === "first_name" || k === "last_name"}
              value={form[k]}
              maxLength={PROFILE_FIELDS[k].max}
              error={errors[k]}
              className={k === "address" ? "sm:col-span-2" : undefined}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
            />
          ))}
        </div>
        {saveError && (
          <p role="alert" className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
            {saveError}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Section>
  );
}

// ---------------------------------------------------------------------------

function ApplicationsTab({ detail }: { detail: MemberDetail }) {
  if (detail.applications.length === 0) {
    return (
      <EmptyPanel
        compact
        icon={<FileText className="h-6 w-6" />}
        title="No applications"
        description="This member hasn't started a membership application."
      />
    );
  }
  return (
    <ul className="space-y-4">
      {detail.applications.map((a) => (
        <li key={a.id}>
          <Section
            title={`${a.membership_type ? a.membership_type.replace(/_/g, " ") : "Membership"} application`}
            actions={
              a.status !== "draft" ? (
                <Link
                  href={`/admin/applications/${a.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-navy)] hover:underline"
                >
                  {a.status === "submitted" || a.status === "under_review" ? "Review" : "Open"}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : undefined
            }
          >
            <DescriptionList
              items={[
                { label: "Status", value: <StatusBadge kind="application" status={a.status} size="sm" /> },
                { label: "Started", value: formatDate(a.created_at) },
                { label: "Submitted", value: a.submitted_at ? formatDate(a.submitted_at, true) : null },
                { label: "Reviewed", value: a.reviewed_at ? formatDate(a.reviewed_at, true) : null },
                ...(a.decision_reason ? [{ label: "Decision reason", value: a.decision_reason }] : []),
              ]}
            />
          </Section>
        </li>
      ))}
    </ul>
  );
}

function MembershipTab({ detail }: { detail: MemberDetail }) {
  return (
    <Section
      title="Membership history"
      actions={
        <Link href="/admin/memberships" className="text-sm font-medium text-[var(--brand-navy)] hover:underline">
          Manage memberships
        </Link>
      }
    >
      {detail.memberships.length === 0 ? (
        <EmptyPanel
          compact
          icon={<BadgeCheck className="h-6 w-6" />}
          title="No membership yet"
          description="A membership is created when an application is approved."
        />
      ) : (
        <ul className="divide-y divide-[var(--card-border)]">
          {detail.memberships.map((m, i) => (
            <li key={m.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="font-medium capitalize text-[var(--foreground)]">
                  {(m.membership_type ?? "Membership").replace(/_/g, " ")}
                  {i === 0 && <span className="ml-2 text-xs font-normal normal-case text-[var(--muted)]">(current)</span>}
                </p>
                <p className="text-[var(--muted)]">
                  {formatDate(m.start_date)} – {m.end_date ? formatDate(m.end_date) : "No end date"}
                </p>
              </div>
              <StatusBadge kind="membership" status={effectiveMembershipStatus(m.status, m.end_date)} size="sm" />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export default function AdminMemberDetailPage() {
  return (
    <Suspense fallback={<LoadingState variant="detail" label="Loading member" />}>
      <MemberDetailView />
    </Suspense>
  );
}
