"use client";

import React, { useId, useRef } from "react";
import { Eye, FileText, History, Loader2, RefreshCw, Upload } from "lucide-react";
import type { DocumentType, MemberDocument } from "@/lib/data/types";
import { DOCUMENT_TYPES } from "@/lib/status";
import { Button } from "@/components/ui/Button";
import { Pill, StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/components/ui/Timeline";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp";

/**
 * One document type: its latest upload, review outcome and actions.
 * Files are only ever opened through short-lived signed URLs (onView).
 */
export function DocumentCard({
  type,
  latest,
  previous,
  uploading,
  viewingId,
  onUpload,
  onView,
}: {
  type: DocumentType;
  latest: MemberDocument | null;
  previous: MemberDocument[];
  uploading: boolean;
  viewingId: string | null;
  onUpload: (file: File, replaces: MemberDocument | null) => void;
  onView: (doc: MemberDocument) => void;
}) {
  const meta = DOCUMENT_TYPES[type];
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const rejected = latest?.status === "rejected";

  const pick = () => inputRef.current?.click();
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again after an error
    if (file) onUpload(file, rejected ? latest : null);
  };

  return (
    <article
      aria-labelledby={`${inputId}-title`}
      className={`flex flex-col rounded-2xl border bg-[var(--card-bg)] p-5 shadow-xs ${
        rejected ? "border-[var(--danger-border)]" : "border-[var(--card-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-navy-soft)] text-[var(--brand-navy)]"
            aria-hidden="true"
          >
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 id={`${inputId}-title`} className="text-sm font-semibold text-[var(--foreground)]">
              {meta.label}
            </h3>
            <p className="text-xs text-[var(--muted)]">{meta.hint}</p>
          </div>
        </div>
        <Pill tone={meta.required ? "info" : "neutral"} size="sm">
          {meta.required ? "Required" : "Optional"}
        </Pill>
      </div>

      <div className="mt-4 flex-1 space-y-2 text-sm" aria-live="polite">
        {latest ? (
          <>
            <StatusBadge kind="document" status={latest.status} size="sm" />
            <p className="truncate font-medium text-[var(--foreground)]" title={latest.file_name}>
              {latest.file_name}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-[var(--muted)]">Uploaded</dt>
                <dd className="text-[var(--foreground)]">{formatDate(latest.uploaded_at)}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Reviewed</dt>
                <dd className="text-[var(--foreground)]">
                  {latest.reviewed_at ? formatDate(latest.reviewed_at) : "Not yet"}
                </dd>
              </div>
            </dl>
            {rejected && (
              <p className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-xs text-red-800">
                <span className="font-semibold">Reason: </span>
                {latest.rejection_reason || "No reason was given. Please upload a clearer or correct document."}
              </p>
            )}
          </>
        ) : (
          <p className="text-[var(--muted)]">Not uploaded yet.</p>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label={`Choose a file for ${meta.label}`}
        onChange={onChange}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {(!latest || rejected) && (
          <Button
            size="sm"
            onClick={pick}
            disabled={uploading}
            icon={
              uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : rejected ? (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              )
            }
          >
            {uploading ? "Uploading…" : rejected ? "Re-upload" : "Upload"}
          </Button>
        )}
        {latest && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onView(latest)}
            disabled={viewingId === latest.id}
            icon={<Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          >
            {viewingId === latest.id ? "Opening…" : "View"}
          </Button>
        )}
      </div>

      {previous.length > 0 && (
        <details className="group mt-4 border-t border-[var(--card-border)] pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)]">
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            Previous versions ({previous.length})
          </summary>
          <ul className="mt-2 space-y-2">
            {previous.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate text-[var(--foreground)]" title={d.file_name}>
                    {d.file_name}
                  </p>
                  <p className="text-[var(--muted)]">{formatDate(d.uploaded_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <StatusBadge kind="document" status={d.status} size="sm" />
                  <button
                    type="button"
                    onClick={() => onView(d)}
                    disabled={viewingId === d.id}
                    className="rounded-md px-2 py-1 font-medium text-[var(--brand-navy)] hover:bg-[var(--brand-navy-soft)] disabled:opacity-50"
                    aria-label={`View ${d.file_name}`}
                  >
                    View
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
