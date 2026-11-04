import React from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, FileText, FolderOpen, RefreshCw, UserPen } from "lucide-react";
import { cn } from "@/lib/utils";
import { TONE_ICON_CLASSES } from "@/components/ui/StatusBadge";
import { LinkButton } from "@/components/member/LinkButton";
import type { RequiredAction, RequiredActionKind } from "@/components/member/workflow";

const ICON: Record<RequiredActionKind, React.ComponentType<{ className?: string }>> = {
  profile: UserPen,
  start_application: FileText,
  application: FileText,
  documents: FolderOpen,
  renew: RefreshCw,
};

/** List of next steps; shows an "all done" line when there are none. */
export function RequiredActionsList({ actions }: { actions: RequiredAction[] }) {
  if (actions.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-[var(--success-light)] px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
        You&apos;re all set. There&apos;s nothing you need to do right now.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-[var(--card-border)]">
      {actions.map((a) => {
        const Icon = ICON[a.kind];
        return (
          <li key={a.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span
                className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TONE_ICON_CLASSES[a.tone])}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--foreground)]">{a.title}</p>
                <p className="text-sm text-[var(--muted)]">{a.description}</p>
              </div>
            </div>
            <LinkButton href={a.href} variant="outline" size="sm" className="sm:shrink-0">
              {a.label}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </LinkButton>
          </li>
        );
      })}
    </ul>
  );
}

/** Prominent "Action required" box for the single most important next step. */
export function ActionAlert({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-light)] p-4 sm:flex-row sm:items-center sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-gold-ink)]">Action required</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{title}</p>
          <div className="mt-0.5 text-sm text-slate-700">{description}</div>
        </div>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}
