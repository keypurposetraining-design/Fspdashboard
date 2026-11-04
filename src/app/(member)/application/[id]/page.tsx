"use client";

import React, { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { FileSearch, FolderOpen, MessageSquareText, Save, Send } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import {
  getApplication,
  latestByType,
  saveApplication,
  submitApplication,
  validateApplication,
  type ApplicationInput,
} from "@/lib/data/member";
import { toDataError } from "@/lib/data/errors";
import type { MembershipApplication } from "@/lib/data/types";
import { DOCUMENT_TYPES } from "@/lib/status";
import { DescriptionList, PageHeader, Section } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { Pill, StatusBadge } from "@/components/ui/StatusBadge";
import { StepTimeline, formatDate } from "@/components/ui/Timeline";
import { TextAreaField, TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { LinkButton } from "@/components/member/LinkButton";
import { RequiredActionsList } from "@/components/member/RequiredActions";
import {
  ORDERED_DOCUMENT_TYPES,
  applicationStatusDescription,
  buildApplicationSteps,
  currentMembership,
  isEditableApplication,
  loadMemberOverview,
  membershipTypeLabel,
  requiredActions,
} from "@/components/member/workflow";

const BREADCRUMBS = [{ label: "Application", href: "/application" }, { label: "Details" }];

async function loadDetail(id: string) {
  const [overview, application] = await Promise.all([loadMemberOverview(), getApplication(id)]);
  return { ...overview, application };
}

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => loadDetail(id), [id]);

  const header = (
    <PageHeader title="Application details" description="Review and manage your membership application." breadcrumbs={BREADCRUMBS} />
  );

  if (loading && !data) return <>{header}<LoadingState variant="detail" label="Loading application" /></>;
  if (error || !data)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load this application" onRetry={reload} />
      </>
    );

  const app = data.application;
  if (!app)
    return (
      <>
        {header}
        <EmptyPanel
          icon={<FileSearch className="h-6 w-6" />}
          title="Application not found"
          description="This application doesn't exist or isn't yours to view."
          action={{ label: "Back to application", href: "/application" }}
        />
      </>
    );

  const steps = buildApplicationSteps({
    profile: data.profile,
    application: app,
    documents: data.documents,
    membership: currentMembership(data.memberships),
  });
  // The edit section below already covers "continue/resubmit this application".
  const actions = requiredActions(data).filter((a) => a.href !== `/application/${app.id}`);
  const latestDocs = latestByType(data.documents);
  const showDecision =
    !!app.decision_reason && ["changes_requested", "rejected", "approved"].includes(app.status);

  return (
    <>
      {header}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Application information">
            <div className="mb-4" aria-live="polite">
              <StatusBadge kind="application" status={app.status} />
              <p className="mt-2 text-sm text-[var(--muted)]">{applicationStatusDescription(app.status)}</p>
            </div>
            <DescriptionList
              items={[
                { label: "Membership type", value: membershipTypeLabel(app.membership_type) },
                { label: "Started", value: formatDate(app.created_at) },
                { label: "Submitted", value: app.submitted_at ? formatDate(app.submitted_at, true) : "Not submitted yet" },
                { label: "Reviewed", value: app.reviewed_at ? formatDate(app.reviewed_at, true) : "Not reviewed yet" },
              ]}
            />
          </Section>

          {showDecision && (
            <section
              aria-labelledby="decision-title"
              className={`rounded-2xl border p-5 ${
                app.status === "approved"
                  ? "border-[var(--success-border)] bg-[var(--success-light)]"
                  : app.status === "rejected"
                    ? "border-[var(--danger-border)] bg-[var(--danger-light)]"
                    : "border-[var(--warning-border)] bg-[var(--warning-light)]"
              }`}
            >
              <h2 id="decision-title" className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                <MessageSquareText className="h-4 w-4" aria-hidden="true" />
                Comments from the FSP team
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-800">{app.decision_reason}</p>
            </section>
          )}

          {isEditableApplication(app) ? (
            <ApplicationEditor key={`${app.id}-${app.updated_at}`} application={app} onChanged={reload} />
          ) : (
            <Section title="Your answers">
              <DescriptionList
                items={[
                  { label: "Why do you want to join?", value: app.motivation },
                  { label: "Relevant experience", value: app.experience },
                  { label: "How did you hear about FSP?", value: app.referral_source },
                ]}
              />
            </Section>
          )}

          <Section
            title="Documents"
            actions={
              <LinkButton href="/documents" variant="outline" size="sm" icon={<FolderOpen className="h-3.5 w-3.5" />}>
                Manage documents
              </LinkButton>
            }
          >
            <ul className="divide-y divide-[var(--card-border)]">
              {ORDERED_DOCUMENT_TYPES.filter((t) => DOCUMENT_TYPES[t].required || latestDocs.has(t)).map((t) => {
                const d = latestDocs.get(t);
                return (
                  <li key={t} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--foreground)]">{DOCUMENT_TYPES[t].label}</p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {d ? `${d.file_name} · ${formatDate(d.uploaded_at)}` : "Not uploaded yet"}
                      </p>
                    </div>
                    {d ? (
                      <StatusBadge kind="document" status={d.status} size="sm" />
                    ) : (
                      <Pill tone="neutral" icon="dot" size="sm">
                        Missing
                      </Pill>
                    )}
                  </li>
                );
              })}
            </ul>
          </Section>
        </div>

        <div className="space-y-6 lg:self-start">
          <Section title="Progress">
            <StepTimeline steps={steps} />
          </Section>
          <Section title="Required actions">
            <RequiredActionsList actions={actions} />
          </Section>
        </div>
      </div>
    </>
  );
}

function ApplicationEditor({
  application,
  onChanged,
}: {
  application: MembershipApplication;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState<ApplicationInput>({
    motivation: application.motivation ?? "",
    experience: application.experience ?? "",
    referral_source: application.referral_source ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ApplicationInput, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const set = (key: keyof ApplicationInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setValues((s) => ({ ...s, [key]: v }));
    if (errors[key]) setErrors((s) => ({ ...s, [key]: undefined }));
  };

  const validate = () => {
    const found = validateApplication(values);
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const saveDraft = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await saveApplication(application.id, values);
      toast("Draft saved");
      onChanged();
    } catch (e) {
      toast(toDataError(e, "saveApplication").message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Errors thrown here are shown inside the dialog (e.g. "Complete your name and phone number…").
  const submit = async () => {
    try {
      await saveApplication(application.id, values);
      await submitApplication(application.id);
    } catch (e) {
      throw toDataError(e, "submitApplication");
    }
    setConfirmOpen(false);
    toast("Application submitted");
    onChanged();
  };

  const closeConfirm = useCallback(() => setConfirmOpen(false), []);
  const resubmitting = application.status === "changes_requested";

  return (
    <Section
      title={resubmitting ? "Update your application" : "Complete your application"}
      description={
        resubmitting
          ? "Make the requested changes, then resubmit for review."
          : "Save a draft at any time. Submit when you're ready for review."
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) setConfirmOpen(true);
        }}
        className="space-y-4"
      >
        <TextAreaField
          label="Why do you want to join FSP?"
          required
          value={values.motivation}
          onChange={set("motivation")}
          error={errors.motivation}
          hint="At least 20 characters."
          maxLength={4000}
          rows={5}
        />
        <TextAreaField
          label="Relevant experience"
          value={values.experience}
          onChange={set("experience")}
          error={errors.experience}
          maxLength={4000}
          rows={4}
        />
        <TextField
          label="How did you hear about FSP?"
          value={values.referral_source}
          onChange={set("referral_source")}
          error={errors.referral_source}
          maxLength={200}
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={saveDraft}
            disabled={saving || confirmOpen}
            icon={<Save className="h-4 w-4" aria-hidden="true" />}
          >
            {saving ? "Saving…" : "Save draft"}
          </Button>
          <Button type="submit" disabled={saving || confirmOpen} icon={<Send className="h-4 w-4" aria-hidden="true" />}>
            {resubmitting ? "Resubmit application" : "Submit application"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmOpen}
        title={resubmitting ? "Resubmit your application?" : "Submit your application?"}
        description="Your answers will be sent to the FSP team for review. You won't be able to edit them while the application is being reviewed."
        confirmLabel={resubmitting ? "Resubmit" : "Submit application"}
        onConfirm={submit}
        onClose={closeConfirm}
      />
    </Section>
  );
}
