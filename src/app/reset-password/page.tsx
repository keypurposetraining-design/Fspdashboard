"use client";

// Target of the emailed recovery link. Supabase puts the user in a temporary
// recovery session when the link is opened, which is what lets updateUser()
// set a new password here. forgotPassword() in AuthProvider points its
// redirectTo at this route.

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

/** Mirrors Supabase's default minimum; the server rejects anything shorter. */
const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const router = useRouter();

  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // The recovery session arrives asynchronously as Supabase parses the link,
  // so wait for it rather than assuming it is present on first render.
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session?.user) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setReady(Boolean(session?.user));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => router.replace("/dashboard"), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(
        /expired|invalid/i.test(message)
          ? "That reset link has expired. Request a new one."
          : "The password could not be updated. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
      <Card className="w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-xl">
        <CardHeader className="pb-2 text-center">
          <div className="mb-4 flex justify-center">
            <Logo variant="full" size="xl" alt="FSP" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Choose a new password</CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          {done ? (
            <div
              role="status"
              className="rounded-xl border border-[var(--success-border)] bg-[var(--success-light)] p-4 text-xs font-semibold text-[var(--success)]"
            >
              Password updated. Taking you to your dashboard…
            </div>
          ) : ready === false ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-xs font-semibold text-rose-800"
            >
              This page needs a valid recovery link. Request a new one from{" "}
              <Link href="/forgot-password" className="underline">
                Forgot password
              </Link>
              .
            </div>
          ) : ready === null ? (
            <p className="text-sm font-medium text-[var(--muted)]">Checking your link…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-bold">
                  New password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="confirm" className="block text-xs font-bold">
                  Confirm new password
                </label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full"
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-800"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="mt-2 w-full" disabled={busy}>
                {busy ? "Updating…" : "Update password"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="mt-4 flex justify-center border-t pt-4">
          <Link
            href="/login"
            className="text-xs font-bold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            ← Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
