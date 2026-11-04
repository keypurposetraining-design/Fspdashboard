"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Info, UserX } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { getDocumentUrl, latestByType, uploadDocument } from "@/lib/data/member";
import { toDataError } from "@/lib/data/errors";
import type { DocumentType, MemberDocument } from "@/lib/data/types";
import { DOCUMENT_TYPES } from "@/lib/status";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { DocumentCard } from "@/components/member/DocumentCard";
import {
  ORDERED_DOCUMENT_TYPES,
  loadMemberOverview,
  openApplication,
  requiredDocumentSummary,
} from "@/components/member/workflow";

export default function DocumentsPage() {
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(loadMemberOverview, []);
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const header = (
    <PageHeader
      title="Documents"
      description="Upload the documents needed for your membership. Accepted formats: PDF, JPG, PNG or WebP, up to 10 MB."
    />
  );

  if (loading && !data) return <>{header}<LoadingState variant="list" label="Loading your documents" /></>;
  if (error || !data)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load your documents" onRetry={reload} />
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

  const openApp = openApplication(data.applications);
  const latest = latestByType(data.documents);
  const summary = requiredDocumentSummary(data.documents);

  const upload = async (type: DocumentType, file: File, replaces: MemberDocument | null) => {
    setUploadingType(type);
    try {
      await uploadDocument({
        memberId: profile.id,
        documentType: type,
        file,
        applicationId: openApp?.id ?? null,
        replacesDocumentId: replaces?.id ?? null,
      });
      toast(`${DOCUMENT_TYPES[type].label} uploaded`);
      reload();
    } catch (e) {
      toast(toDataError(e, "uploadDocument").message, "error");
    } finally {
      setUploadingType(null);
    }
  };

  const view = async (doc: MemberDocument) => {
    setViewingId(doc.id);
    // Open the tab synchronously so popup blockers allow it, then point it at the signed URL.
    const win = window.open("about:blank", "_blank");
    if (win) win.opener = null;
    try {
      const url = await getDocumentUrl(doc.storage_path);
      if (win) win.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      win?.close();
      toast(toDataError(e, "getDocumentUrl").message, "error");
    } finally {
      setViewingId(null);
    }
  };

  return (
    <>
      {header}

      <div className="mb-6 space-y-3">
        {data.documents.length === 0 ? (
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--info-border)] bg-[var(--info-light)] p-4 text-sm">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-navy)]" aria-hidden="true" />
            <div>
              <p className="font-semibold text-[var(--foreground)]">You haven&apos;t uploaded any documents yet</p>
              <p className="mt-0.5 text-slate-700">
                Start with the {summary.total} required documents below: identity proof, address proof and a recent
                photograph. The FSP team reviews each one and you&apos;ll be notified of the outcome.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[var(--muted)]" aria-live="polite">
            <span className="font-semibold text-[var(--foreground)]">
              {summary.approved} of {summary.total}
            </span>{" "}
            required documents approved
            {summary.rejected.length > 0 && ` · ${summary.rejected.length} need re-uploading`}
            {summary.missing.length > 0 && ` · ${summary.missing.length} not uploaded`}
          </p>
        )}
        {openApp && (
          <p className="text-xs text-[var(--muted)]">
            New uploads are attached to your{" "}
            <Link href={`/application/${openApp.id}`} className="font-medium text-[var(--brand-navy)] underline">
              open application
            </Link>
            .
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ORDERED_DOCUMENT_TYPES.map((type) => {
          const current = latest.get(type) ?? null;
          const previous = data.documents.filter((d) => d.document_type === type && d.id !== current?.id);
          return (
            <DocumentCard
              key={type}
              type={type}
              latest={current}
              previous={previous}
              uploading={uploadingType === type}
              viewingId={viewingId}
              onUpload={(file, replaces) => upload(type, file, replaces)}
              onView={view}
            />
          );
        })}
      </div>
    </>
  );
}
