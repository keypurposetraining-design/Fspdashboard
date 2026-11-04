"use client";

// Password recovery request. Both login pages already linked here, so this
// route existed only as a broken link until now.

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await forgotPassword(email.trim());
      // Always report success: revealing whether an address is registered
      // would let anyone enumerate accounts.
      setSent(true);
    } catch {
      setSent(true);
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
          <CardTitle className="text-2xl font-black tracking-tight">Reset your password</CardTitle>
          <p className="mt-1 text-xs font-medium text-[var(--muted)]">
            We will email you a link to choose a new password.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {sent ? (
            <div
              role="status"
              className="rounded-xl border border-[var(--success-border)] bg-[var(--success-light)] p-4 text-xs font-semibold text-[var(--success)]"
            >
              If an account exists for that address, a reset link is on its way. The link expires
              after a short time, so use it soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-xs font-bold">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  autoComplete="email"
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
                {busy ? "Sending…" : "Send reset link"}
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
