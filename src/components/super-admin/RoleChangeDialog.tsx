"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SelectField } from "@/components/ui/Form";
import { setUserRole } from "@/lib/data/superAdmin";
import { ROLE_LABEL } from "@/lib/status";
import type { AppRole, AppUserRow } from "@/lib/data/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { displayName, isActive } from "@/components/super-admin/accessData";
import { RolePill, AccountStatusPill } from "@/components/super-admin/UserPills";

export type RoleDialogMode =
  /** Pick a new role; status unchanged. */
  | "role"
  /** Flip is_active; role unchanged. */
  | "access"
  /** Pick role and status together. */
  | "both";

const ALL_ROLES: AppRole[] = ["member", "trainer", "admin", "super_admin"];

interface RoleChangeDialogProps {
  target: AppUserRow | null;
  mode: RoleDialogMode;
  /** Roles offered in the select (defaults to all four). */
  roleOptions?: AppRole[];
  /** Pre-selected role (e.g. "admin" when promoting). */
  initialRole?: AppRole;
  onClose: () => void;
  /** Called after a successful change with a short success message. */
  onDone: (message: string) => void;
}

/**
 * Role / access change confirmation. The only write path is setUserRole()
 * (the audited set_user_role RPC); the role sent is exactly what the super
 * admin picked here. Warnings are presentation only — the database enforces.
 */
export function RoleChangeDialog(props: RoleChangeDialogProps) {
  if (!props.target) return null;
  // Remount per target/mode so the selects start from the target's current values.
  return <DialogBody key={`${props.target.id}-${props.mode}-${props.initialRole ?? ""}`} {...props} target={props.target} />;
}

function DialogBody({
  target,
  mode,
  roleOptions = ALL_ROLES,
  initialRole,
  onClose,
  onDone,
}: RoleChangeDialogProps & { target: AppUserRow }) {
  const { user } = useAuth();
  const currentActive = isActive(target);
  const [role, setRole] = useState<AppRole>(initialRole ?? target.role);
  const [active, setActive] = useState<boolean>(mode === "access" ? !currentActive : currentActive);

  const isSelf = user?.id === target.id;
  const name = displayName(target);
  const roleChanged = role !== target.role;
  const activeChanged = active !== currentActive;
  const losesSuperAdmin = target.role === "super_admin" && currentActive && (role !== "super_admin" || !active);

  const title =
    mode === "access"
      ? `${active ? "Enable" : "Disable"} ${name}?`
      : mode === "role" && initialRole
        ? `Promote ${name}`
        : `Change role${mode === "both" ? " / access" : ""} for ${name}`;

  const confirmLabel =
    mode === "access" ? (active ? "Enable account" : "Disable account") : "Save change";

  const handleConfirm = async (reason: string) => {
    if (!roleChanged && !activeChanged) {
      throw new Error("Choose a different role or status first.");
    }
    await setUserRole({
      userId: target.id,
      role,
      // Only send is_active when it is actually changing.
      isActive: activeChanged ? active : null,
      reason,
    });
    const parts: string[] = [];
    if (roleChanged) parts.push(`is now ${ROLE_LABEL[role]}`);
    if (activeChanged) parts.push(active ? "was enabled" : "was disabled");
    onDone(`${name} ${parts.join(" and ")}.`);
  };

  const description = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-[var(--muted-light)] px-3 py-2">
        <span className="min-w-0 truncate text-sm font-medium text-[var(--foreground)]">{target.email}</span>
        <RolePill role={target.role} />
        <AccountStatusPill user={target} />
      </div>

      {mode === "access" && (
        <p>
          {active
            ? "This account will be able to sign in and use the dashboard again with its current role."
            : "This account will immediately lose access to the dashboard. Its data is kept and it can be enabled again later."}
        </p>
      )}

      {(mode === "role" || mode === "both") && (
        <SelectField label="New role" value={role} onChange={(e) => setRole(e.target.value as AppRole)} required>
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
              {r === target.role ? " (current)" : ""}
            </option>
          ))}
        </SelectField>
      )}

      {mode === "both" && (
        <SelectField
          label="Account status"
          value={active ? "active" : "disabled"}
          onChange={(e) => setActive(e.target.value === "active")}
        >
          <option value="active">Active{currentActive ? " (current)" : ""}</option>
          <option value="disabled">Disabled{!currentActive ? " (current)" : ""}</option>
        </SelectField>
      )}

      {role === "super_admin" && roleChanged && (
        <Warning>
          Super admins can change every role, disable accounts and edit all system settings. Only grant this to people
          who need it.
        </Warning>
      )}

      {isSelf && losesSuperAdmin && (
        <Warning strong>
          You are changing your own account. Once saved you will lose access to the Super Admin area immediately. The
          database will refuse if you are the last active super admin.
        </Warning>
      )}

      {!isSelf && losesSuperAdmin && (
        <Warning>This removes super admin access. The database refuses if this is the last active super admin.</Warning>
      )}

      <p className="text-xs">The change and your reason are recorded in the audit log.</p>
    </div>
  );

  return (
    <ConfirmDialog
      open
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      tone={(mode === "access" && !active) || losesSuperAdmin ? "danger" : "primary"}
      reason={{ label: "Reason for this change", placeholder: "Why is this change needed?", minLength: 5 }}
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
}

function Warning({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <div
      role="note"
      className={`flex gap-2 rounded-lg border px-3 py-2 text-sm ${
        strong
          ? "border-[var(--danger-border)] bg-[var(--danger-light)] text-red-800"
          : "border-[var(--warning-border)] bg-[var(--warning-light)] text-[var(--brand-gold-ink)]"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
