"use client";

import React, { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/components/ui/Timeline";
import { useToast } from "@/components/ui/Toast";
import { reviewDocument } from "@/lib/data/admin";
import { toDataError } from "@/lib/data/errors";
import { DOCUMENT_TYPES } from "@/lib/status";
import type { DocumentType, MemberDocument } from "@/lib/data/types";
import { formatBytes, openDocument } from "@/components/admin-ui/format";

type Decision = "approved" | "rejected";

/**
 * View / approve / reject behaviour for member documents. Returns handlers and
 * the confirm dialog element to render once. The review_document RPC enforces
 * the rules; the self-review check here only explains why buttons are disabled.
 */
export function useDocumentReview({ onReviewed }: { onReviewed: () => void }) {
  const toast = useToast();
  const [pending, setPending] = useState<{ doc: MemberDocument; decision: Decision; memberName?: string } | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const view = async (doc: MemberDocument) => {
    setViewingId(doc.id);
    try {
      await openDocument(doc.storage_path);
    } catch (e) {
      toast(toDataError(e, "viewDocument").message, "error");
    } finally {
      setViewingId(null);
    }
  };

  const typeLabel = pending ? DOCUMENT_TYPES[pending.doc.document_type]?.label ?? "Document" : "";

  const dialog = (
    <ConfirmDialog
      key={pending ? `${pending.doc.id}-${pending.decision}` : "closed"}
      open={!!pending}
      title={pending?.decision === "approved" ? `Approve ${typeLabel.toLowerCase()}?` : `Reject ${typeLabel.toLowerCase()}?`}
      description={
        pending?.decision === "approved" ? (
          <>
            <span className="font-medium text-[var(--foreground)]">{pending.doc.file_name}</span>
            {pending.memberName ? ` from ${pending.memberName}` : ""} will be marked as approved and the member notified.
          </>
        ) : (
          <>
            The member will be notified and asked to upload a replacement. Explain what is wrong so they can fix it.
          </>
        )
      }
      confirmLabel={pending?.decision === "approved" ? "Approve document" : "Reject document"}
      tone={pending?.decision === "rejected" ? "danger" : "primary"}
      reason={
        pending?.decision === "rejected"
          ? { label: "Reason for rejection", placeholder: "e.g. The image is blurred and the name is not readable.", minLength: 5 }
          : undefined
      }
      onClose={() => setPending(null)}
      onConfirm={async (reason) => {
        if (!pending) return;
        await reviewDocument(pending.doc.id, pending.decision, reason);
        toast(pending.decision === "approved" ? "Document approved." : "Document rejected. The member has been notified.");
        setPending(null);
        onReviewed();
      }}
    />
  );

  return {
    view,
    viewingId,
    approve: (doc: MemberDocument, memberName?: string) => setPending({ doc, decision: "approved", memberName }),
    reject: (doc: MemberDocument, memberName?: string) => setPending({ doc, decision: "rejected", memberName }),
    dialog,
  };
}

export type DocumentReviewApi = ReturnType<typeof useDocumentReview>;

/** View + approve/reject buttons for one document. */
export function DocumentActions({
  doc,
  review,
  isOwn,
  memberName,
}: {
  doc: MemberDocument;
  review: DocumentReviewApi;
  /** The document belongs to the signed-in admin: reviewing it is not allowed. */
  isOwn: boolean;
  memberName?: string;
}) {
  const canDecide = doc.status === "pending";
  const ownTitle = "You can't review your own document.";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => review.view(doc)}
        disabled={review.viewingId === doc.id}
        icon={<Eye className="h-3.5 w-3.5" />}
        aria-label={`View ${doc.file_name}`}
      >
        {review.viewingId === doc.id ? "Opening…" : "View"}
      </Button>
      {canDecide && (
        <>
          <Button
            variant="soft"
            size="sm"
            onClick={() => review.approve(doc, memberName)}
            disabled={isOwn}
            title={isOwn ? ownTitle : undefined}
            icon={<Check className="h-3.5 w-3.5" />}
          >
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => review.reject(doc, memberName)}
            disabled={isOwn}
            title={isOwn ? ownTitle : undefined}
            icon={<X className="h-3.5 w-3.5" />}
            className="text-red-700"
          >
            Reject
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Documents grouped by type: the latest upload per type with its status and
 * actions, older uploads collapsed underneath, and missing required types.
 */
export function DocumentReviewList({
  documents,
  isOwn,
  memberName,
  onReviewed,
  showMissing = true,
}: {
  documents: MemberDocument[];
  isOwn: boolean;
  memberName?: string;
  onReviewed: () => void;
  showMissing?: boolean;
}) {
  const review = useDocumentReview({ onReviewed });

  const byType = new Map<DocumentType, MemberDocument[]>();
  [...documents]
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at))
    .forEach((d) => byType.set(d.document_type, [...(byType.get(d.document_type) ?? []), d]));

  const types = (Object.keys(DOCUMENT_TYPES) as DocumentType[]).filter(
    (t) => byType.has(t) || (showMissing && DOCUMENT_TYPES[t].required)
  );

  if (types.length === 0) {
    return <p className="text-sm text-[var(--muted)]">No documents have been uploaded yet.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-[var(--card-border)]">
        {types.map((t) => {
          const [latest, ...history] = byType.get(t) ?? [];
          const meta = DOCUMENT_TYPES[t];
          return (
            <li key={t} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {meta.label}
                    {meta.required && <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">(required)</span>}
                  </p>
                  {latest ? (
                    <>
                      <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                        {latest.file_name}
                        {latest.size_bytes ? ` · ${formatBytes(latest.size_bytes)}` : ""} · Uploaded{" "}
                        {formatDate(latest.uploaded_at)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge kind="document" status={latest.status} size="sm" />
                      </div>
                      {latest.status === "rejected" && latest.rejection_reason && (
                        <p className="mt-2 text-sm text-red-700">Reason: {latest.rejection_reason}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-0.5 text-sm text-[var(--muted)]">Not uploaded yet</p>
                  )}
                </div>
                {latest && <DocumentActions doc={latest} review={review} isOwn={isOwn} memberName={memberName} />}
              </div>
              {history.length > 0 && (
                <details className="mt-3 rounded-lg bg-[var(--muted-light)]/60 px-3 py-2">
                  <summary className="cursor-pointer text-xs font-medium text-[var(--muted)]">
                    {history.length} earlier upload{history.length === 1 ? "" : "s"}
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {history.map((h) => (
                      <li key={h.id} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span className="min-w-0">
                          <span className="block truncate text-[var(--foreground)]">{h.file_name}</span>
                          <span className="text-xs text-[var(--muted)]">
                            Uploaded {formatDate(h.uploaded_at)}
                            {h.rejection_reason ? ` · ${h.rejection_reason}` : ""}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <StatusBadge kind="document" status={h.status} size="sm" />
                          <DocumentActions doc={h} review={review} isOwn={isOwn} memberName={memberName} />
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
      {review.dialog}
    </>
  );
}
