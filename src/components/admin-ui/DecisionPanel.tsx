"use client";

import React, { useState } from "react";
import { Check, MessageSquareWarning, PlayCircle, X, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ApplicationStatus } from "@/lib/data/types";

export type ReviewDecision = "under_review" | "approved" | "rejected" | "changes_requested";

const DIALOGS: Record<
  Exclude<ReviewDecision, "under_review">,
  {
    title: string;
    confirmLabel: string;
    tone: "primary" | "danger";
    description: (name: string) => React.ReactNode;
    reason?: { label: string; placeholder: string; minLength: number };
  }
> = {
  approved: {
    title: "Approve this application?",
    confirmLabel: "Approve application",
    tone: "primary",
    description: (name) => (
      <>
        {name}&apos;s membership will be <strong className="text-[var(--foreground)]">activated</strong> for the
        configured membership term, and they will be notified.
      </>
    ),
  },
  changes_requested: {
    title: "Request changes?",
    confirmLabel: "Request changes",
    tone: "primary",
    description: (name) => <>{name} will be notified and can update and resubmit their application.</>,
    reason: {
      label: "What needs to change?",
      placeholder: "e.g. Please add more detail about your professional experience.",
      minLength: 5,
    },
  },
  rejected: {
    title: "Reject this application?",
    confirmLabel: "Reject application",
    tone: "danger",
    description: (name) => <>{name} will be notified that the application was not approved. This cannot be undone here.</>,
    reason: { label: "Reason for rejection", placeholder: "Explain why the application was not approved.", minLength: 5 },
  },
};

/**
 * Review actions for one application. The review_application RPC enforces
 * permissions, allowed transitions and reason length; `blockedReason` only
 * explains why the UI disables the buttons.
 */
export function DecisionPanel({
  status,
  memberName,
  blockedReason,
  onDecide,
}: {
  status: ApplicationStatus;
  memberName: string;
  blockedReason: string | null;
  onDecide: (decision: ReviewDecision, reason?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState<Exclude<ReviewDecision, "under_review"> | null>(null);
  const [starting, setStarting] = useState(false);
  const disabled = !!blockedReason || starting;
  const dialog = open ? DIALOGS[open] : null;

  const startReview = async () => {
    setStarting(true);
    try {
      await onDecide("under_review");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--muted)]">Current status</span>
        <StatusBadge kind="application" status={status} />
      </div>

      {blockedReason ? (
        <p className="flex gap-2 rounded-lg bg-[var(--muted-light)] px-3 py-2.5 text-sm text-[var(--foreground)]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
          {blockedReason}
        </p>
      ) : (
        status === "submitted" && (
          <p className="text-sm text-[var(--muted)]">
            Start the review to let the member know their application is being looked at, or decide directly.
          </p>
        )
      )}

      <div className="flex flex-col gap-2">
        {status === "submitted" && (
          <Button
            variant="outline"
            fullWidth
            onClick={startReview}
            disabled={disabled}
            icon={<PlayCircle className="h-4 w-4" />}
          >
            {starting ? "Starting…" : "Start review"}
          </Button>
        )}
        <Button fullWidth onClick={() => setOpen("approved")} disabled={disabled} icon={<Check className="h-4 w-4" />}>
          Approve
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => setOpen("changes_requested")}
          disabled={disabled}
          icon={<MessageSquareWarning className="h-4 w-4" />}
        >
          Request changes
        </Button>
        <Button
          variant="outline"
          fullWidth
          onClick={() => setOpen("rejected")}
          disabled={disabled}
          icon={<X className="h-4 w-4" />}
          className="text-red-700"
        >
          Reject
        </Button>
      </div>

      {dialog && open && (
        <ConfirmDialog
          key={open}
          open
          title={dialog.title}
          description={dialog.description(memberName)}
          confirmLabel={dialog.confirmLabel}
          tone={dialog.tone}
          reason={dialog.reason}
          onClose={() => setOpen(null)}
          onConfirm={async (reason) => {
            await onDecide(open, reason || undefined);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}
