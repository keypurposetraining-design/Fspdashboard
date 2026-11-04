"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger";
  /** When set, a reason textarea is shown and required (min length). */
  reason?: { label: string; placeholder?: string; minLength?: number; optional?: boolean };
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
}

/**
 * Accessible confirmation modal. Keeps the dialog open and shows the error if
 * onConfirm throws; disables buttons while the action runs.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  reason,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus only when the dialog opens, not on every parent re-render.
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>("textarea, button[data-autofocus]")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  const min = reason?.minLength ?? 5;
  const reasonInvalid = !!reason && !reason.optional && text.trim().length < min;

  const handleConfirm = async () => {
    if (reasonInvalid) {
      setError(`Please give a reason (at least ${min} characters).`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(text.trim());
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-lg font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--muted-light)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && <div className="mt-2 text-sm text-[var(--muted)]">{description}</div>}

        {reason && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              {reason.label}
              {!reason.optional && <span className="text-red-600"> *</span>}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder={reason.placeholder}
              className="mt-1 w-full rounded-lg border border-[var(--card-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
            />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={handleConfirm} disabled={busy} data-autofocus>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
