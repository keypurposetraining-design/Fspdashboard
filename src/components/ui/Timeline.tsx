import React from "react";
import { Check, Circle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/status";
import { TONE_ICON_CLASSES } from "@/components/ui/StatusBadge";

export type StepState = "done" | "current" | "upcoming" | "attention" | "failed";

export interface TimelineStep {
  label: string;
  description?: React.ReactNode;
  state: StepState;
  meta?: string;
}

const STEP_STYLE: Record<StepState, { circle: string; icon: React.ReactNode; srLabel: string }> = {
  done: {
    circle: "bg-emerald-600 text-white border-emerald-600",
    icon: <Check className="h-3.5 w-3.5" aria-hidden="true" />,
    srLabel: "Completed",
  },
  current: {
    circle: "bg-white text-[var(--brand-navy)] border-[var(--brand-navy)] ring-4 ring-[var(--brand-navy-soft)]",
    icon: <Circle className="h-2.5 w-2.5 fill-current" aria-hidden="true" />,
    srLabel: "In progress",
  },
  upcoming: {
    circle: "bg-white text-slate-400 border-slate-300",
    icon: <Circle className="h-2.5 w-2.5" aria-hidden="true" />,
    srLabel: "Not started",
  },
  attention: {
    circle: "bg-[var(--brand-gold)] text-white border-[var(--brand-gold)]",
    icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />,
    srLabel: "Action required",
  },
  failed: {
    circle: "bg-red-600 text-white border-red-600",
    icon: <X className="h-3.5 w-3.5" aria-hidden="true" />,
    srLabel: "Not approved",
  },
};

/** Vertical progress timeline (e.g. application steps). */
export function StepTimeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const st = STEP_STYLE[s.state];
        const last = i === steps.length - 1;
        return (
          <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5",
                  s.state === "done" ? "bg-emerald-600" : "bg-slate-200"
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                st.circle
              )}
            >
              {st.icon}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  s.state === "upcoming" ? "text-[var(--muted)]" : "text-[var(--foreground)]"
                )}
              >
                {s.label} <span className="sr-only">({st.srLabel})</span>
              </p>
              {s.meta && <p className="text-xs text-[var(--muted)]">{s.meta}</p>}
              {s.description && <div className="mt-1 text-sm text-[var(--muted)]">{s.description}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export interface ActivityEvent {
  id: string;
  title: string;
  detail?: string;
  at: string;
  tone?: Tone;
  icon?: React.ReactNode;
}

/** Compact activity feed (most recent first). */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <ul className="space-y-4">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              TONE_ICON_CLASSES[e.tone ?? "neutral"]
            )}
          >
            {e.icon ?? <Circle className="h-3 w-3" aria-hidden="true" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--foreground)]">{e.title}</p>
            {e.detail && <p className="text-xs text-[var(--muted)] truncate">{e.detail}</p>}
          </div>
          <time className="shrink-0 text-xs text-[var(--muted)]" dateTime={e.at}>
            {formatRelative(e.at)}
          </time>
        </li>
      ))}
    </ul>
  );
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return formatDate(iso);
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
