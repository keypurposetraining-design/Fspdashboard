import React from "react";
import { Check, Clock, AlertTriangle, X, Circle, Pause, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APPLICATION_STATUS,
  DOCUMENT_STATUS,
  MEMBERSHIP_STATUS,
  type StatusIcon,
  type StatusMeta,
  type Tone,
} from "@/lib/status";

export const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-[var(--success-light)] text-emerald-700 border-[var(--success-border)]",
  warning: "bg-[var(--warning-light)] text-[var(--brand-gold-ink)] border-[var(--warning-border)]",
  danger: "bg-[var(--danger-light)] text-red-700 border-[var(--danger-border)]",
  info: "bg-[var(--info-light)] text-[var(--brand-navy)] border-[var(--info-border)]",
  neutral: "bg-[var(--muted-light)] text-slate-600 border-[var(--muted-border)]",
};

export const TONE_ICON_CLASSES: Record<Tone, string> = {
  success: "bg-[var(--success-light)] text-emerald-700",
  warning: "bg-[var(--warning-light)] text-[var(--warning)]",
  danger: "bg-[var(--danger-light)] text-red-700",
  info: "bg-[var(--info-light)] text-[var(--brand-navy)]",
  neutral: "bg-[var(--muted-light)] text-slate-600",
};

const ICONS: Record<StatusIcon, React.ComponentType<{ className?: string }>> = {
  check: Check,
  clock: Clock,
  alert: AlertTriangle,
  x: X,
  dot: Circle,
  pause: Pause,
  edit: Pencil,
};

export function StatusIconGlyph({ icon, className }: { icon: StatusIcon; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden="true" />;
}

interface StatusBadgeProps {
  kind: "membership" | "application" | "document";
  status: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}

export function statusMeta(kind: StatusBadgeProps["kind"], status: string | null | undefined): StatusMeta {
  const table: Record<string, StatusMeta> =
    kind === "membership" ? MEMBERSHIP_STATUS : kind === "application" ? APPLICATION_STATUS : DOCUMENT_STATUS;
  return (
    table[status ?? "none"] ??
    table["none"] ?? { label: status ?? "Unknown", tone: "neutral", icon: "dot", description: "" }
  );
}

/** Status pill: colour + icon + text, never colour alone. */
export function StatusBadge({ kind, status, size = "md", className }: StatusBadgeProps) {
  const meta = statusMeta(kind, status);
  return (
    <Pill tone={meta.tone} icon={meta.icon} size={size} className={className}>
      {meta.label}
    </Pill>
  );
}

export function Pill({
  tone,
  icon,
  size = "md",
  className,
  children,
}: {
  tone: Tone;
  icon?: StatusIcon;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        TONE_CLASSES[tone],
        className
      )}
    >
      {icon && <StatusIconGlyph icon={icon} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {children}
    </span>
  );
}
