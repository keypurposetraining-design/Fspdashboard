import React from "react";
import { initials } from "@/lib/profile";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
} as const;

/** Initials avatar used in admin tables and headers. */
export function MemberAvatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy-soft)] font-semibold text-[var(--brand-navy)]",
        SIZES[size],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}

/** Avatar + name + secondary line (email), for table cells. */
export function MemberCell({ name, email }: { name: string; email?: string | null }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <MemberAvatar name={name} size="sm" />
      <span className="min-w-0 text-left">
        <span className="block truncate font-medium text-[var(--foreground)]">{name}</span>
        {email && <span className="block truncate text-xs text-[var(--muted)]">{email}</span>}
      </span>
    </span>
  );
}
