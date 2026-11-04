"use client";

import React, { useState } from "react";
import { KeyRound, LogOut, Pencil, UserRound } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useShell } from "@/components/shell/AppShell";
import { createClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/useAsync";
import { getMyProfile } from "@/lib/data/member";
import { DataError } from "@/lib/data/errors";
import { ROLE_LABEL } from "@/lib/status";
import { DescriptionList, PageHeader, Section } from "@/components/ui/PageHeader";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { Pill } from "@/components/ui/StatusBadge";
import { TextField } from "@/components/ui/Form";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LinkButton } from "@/components/member/LinkButton";

interface SignInInfo {
  providers: string[];
  /** Email/password sign-in is linked, so a password can be changed here. */
  hasPassword: boolean;
  usesGoogle: boolean;
}

async function loadSettings() {
  const { data, error } = await createClient().auth.getUser();
  if (error || !data.user) throw new DataError("permission", "Your session has expired. Please sign in again.");
  const u = data.user;
  const fromIdentities = (u.identities ?? []).map((i) => i.provider);
  const fromMeta = Array.isArray(u.app_metadata?.providers) ? (u.app_metadata.providers as string[]) : [];
  const primary = typeof u.app_metadata?.provider === "string" ? [u.app_metadata.provider as string] : [];
  const providers = Array.from(new Set([...fromIdentities, ...fromMeta, ...primary]));
  const signIn: SignInInfo = {
    providers,
    hasPassword: providers.includes("email"),
    usesGoogle: providers.includes("google"),
  };
  const profile = await getMyProfile().catch(() => null);
  return { signIn, memberNumber: profile?.member_number ?? null };
}

function signInLabel(s: SignInInfo) {
  if (s.usesGoogle && s.hasPassword) return "Google and email & password";
  if (s.usesGoogle) return "Google";
  if (s.hasPassword) return "Email & password";
  return "Unknown";
}

/** Auth errors are mapped to plain wording; the raw message is never shown. */
function passwordErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : "";
  if (/different from the old/i.test(msg)) return "Choose a password that's different from your current one.";
  if (/weak|short|characters/i.test(msg)) return "That password is too weak. Use at least 8 characters with a mix of letters and numbers.";
  if (/reauth|recent/i.test(msg)) return "For security, please sign out and sign in again before changing your password.";
  return "We couldn't update your password. Please try again.";
}

export default function SettingsPage() {
  const { user, role } = useAuth();
  const { openLogout } = useShell();
  const { data, error, loading, reload } = useAsync(loadSettings, [user?.id], Boolean(user));
  const manager = role === "admin" || role === "super_admin";
  const profilePath = manager ? "/admin/account/profile" : "/profile";

  const header = <PageHeader title={manager ? "Account settings" : "Settings"} description="Manage your profile, sign-in security and current session."
    actions={<LinkButton href={`${profilePath}/edit`} icon={<Pencil className="h-4 w-4" />}>Edit profile</LinkButton>} />;

  if (loading && !data) return <>{header}<LoadingState variant="detail" label="Loading settings" /></>;
  if (error || !data)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load your settings" onRetry={reload} />
      </>
    );

  return (
    <>
      {header}
      <div className="max-w-3xl space-y-6 font-sans">
        <Section title="Account details" description="Your email and access role are managed by the platform.">
          <DescriptionList
            items={[
              { label: "Name", value: user?.name || "Not provided" },
              { label: "Email", value: user?.email },
              {
                label: "Role",
                value: (
                  <Pill tone="info" icon="check" size="sm">
                    {ROLE_LABEL[role ?? "member"] ?? "Member"}
                  </Pill>
                ),
              },
              ...(!manager ? [{ label: "Member number", value: data.memberNumber ?? "Not assigned" }] : []),
              { label: "Sign-in method", value: signInLabel(data.signIn) },
            ]}
          />
          <div className="mt-4 border-t border-[var(--card-border)] pt-4">
            <LinkButton href={profilePath} variant="outline" icon={<UserRound className="h-4 w-4" />}>View profile</LinkButton>
          </div>
        </Section>

        <Section title="Security">
          {data.signIn.hasPassword ? (
            <PasswordForm />
          ) : (
            <p className="flex items-start gap-2 text-sm text-[var(--muted)]">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {data.signIn.usesGoogle
                ? "You sign in with Google, so your password is managed by your Google account. Change it in your Google account settings."
                : "Password sign-in isn't set up for this account."}
            </p>
          )}
        </Section>

        <Section title="Session">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--muted)]">Sign out of FSP on this device.</p>
            <Button variant="outline" onClick={openLogout} icon={<LogOut className="h-4 w-4" aria-hidden="true" />}>
              Log out
            </Button>
          </div>
        </Section>
      </div>
    </>
  );
}

function PasswordForm() {
  const { updatePassword } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    const found: typeof errors = {};
    if (password.length < 8) found.password = "Use at least 8 characters.";
    if (confirm !== password) found.confirm = "The passwords don't match.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await updatePassword(password);
      setPassword("");
      setConfirm("");
      toast("Password updated");
    } catch (err) {
      console.error("[settings] updatePassword", err);
      const msg = passwordErrorMessage(err);
      setFormError(msg);
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-[var(--muted)]">Change the password you use to sign in with your email address.</p>
      {formError && (
        <p role="alert" className="rounded-lg bg-[var(--danger-light)] px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          disabled={saving}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint="At least 8 characters."
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          disabled={saving}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
