import React from "react";
import { Pill } from "@/components/ui/StatusBadge";
import { ROLE_LABEL, type Tone } from "@/lib/status";
import type { AppUserRow } from "@/lib/data/types";
import { isActive } from "@/components/super-admin/accessData";
import { initials } from "@/lib/profile";

const ROLE_TONE: Record<string, Tone> = {
  super_admin: "danger",
  admin: "warning",
  trainer: "info",
  member: "neutral",
};

export function RolePill({ role, size = "sm" }: { role: string; size?: "sm" | "md" }) {
  return (
    <Pill tone={ROLE_TONE[role] ?? "neutral"} size={size}>
      {ROLE_LABEL[role] ?? role}
    </Pill>
  );
}

export function AccountStatusPill({ user, size = "sm" }: { user: Pick<AppUserRow, "is_active">; size?: "sm" | "md" }) {
  return isActive(user) ? (
    <Pill tone="success" icon="check" size={size}>
      Active
    </Pill>
  ) : (
    <Pill tone="danger" icon="pause" size={size}>
      Disabled
    </Pill>
  );
}

/** Name + email cell with an initials avatar. */
export function UserCell({ user, isYou }: { user: Pick<AppUserRow, "name" | "email">; isYou?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-navy-soft)] text-xs font-semibold text-[var(--brand-navy)]"
      >
        {initials(user.name || user.email)}
      </span>
      <div className="min-w-0 text-left">
        <p className="truncate font-medium text-[var(--foreground)]">
          {user.name?.trim() || "No name"}
          {isYou && <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">(you)</span>}
        </p>
        <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
      </div>
    </div>
  );
}
