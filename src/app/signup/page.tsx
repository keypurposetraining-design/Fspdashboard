"use client";

// Self-service sign-up. The new account always lands as a platform 'member'
// via _sync_user() (002_user_sync.sql); no role is sent from the browser.
// Membership approval and dates are managed separately by platform admins.

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth/AuthProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardFooter } from "@/components/ui/Card";

const MIN_PASSWORD = 8;

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { needsEmailConfirmation } = await signUp(email.trim().toLowerCase(), password, name.trim());
      if (needsEmailConfirmation) {
        setCheckEmail(true);
      } else {
        window.location.replace("/dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("already") || message.includes("registered")) {
        // Do not confirm that the address exists; point at recovery instead.
        setCheckEmail(true);
      } else if (message.includes("rate") || message.includes("too many")) {
        setError("Too many attempts. Please wait a few minutes before trying again.");
      } else if (message.includes("password")) {
        setError("That password was rejected. Try a longer, less common one.");
      } else if (message.includes("email")) {
        setError("Enter a valid email address.");
      } else {
        setError("We could not create the account. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <Card hoverEffect={false} className="w-full max-w-md rounded-3xl border border-[var(--card-border)] border-t-[3px] border-t-[var(--brand-yellow)] bg-[var(--card-bg)] p-6 sm:p-8 shadow-xl">
        <header className="mb-6 flex flex-col items-center gap-4 text-center">
          <div className="overflow-hidden rounded-2xl bg-[var(--brand-navy)] px-2 shadow-sm">
            <Image src="/fsp-logo.png" alt="FSP" width={156} height={104} preload unoptimized className="h-auto w-[156px] object-contain"
              style={{ clipPath: "inset(0 0 38% 0)", transform: "translateY(8%)" }} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">Create your account</h1>
        </header>

        <CardContent>
          {checkEmail ? (
            <div
              role="status"
              className="rounded-xl border border-[var(--info-border)] bg-[var(--info-light)] p-4 text-xs font-semibold text-[var(--info)]"
            >
              If registration is available for this address, check your inbox and spam folder for a confirmation link. Open it in this browser to finish signing in. If you already had an
              account, use{" "}
              <Link href="/forgot-password" className="underline">
                Forgot password
              </Link>{" "}
              instead.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" aria-busy={busy}>
              <div className="space-y-1">
                <label htmlFor="name" className="block text-xs font-bold">
                  Full name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  maxLength={255}
                  className="w-full"
                />
              </div>
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
              <div className="space-y-1">
                <label htmlFor="password" className="block text-xs font-bold">
                  Password
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
                <p className="text-[10px] font-medium text-[var(--muted)]">
                  At least {MIN_PASSWORD} characters.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="confirm-password" className="block text-xs font-bold">Confirm password</label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD}
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
                {busy ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="mt-4 flex justify-center border-t pt-4">
          <Link
            href="/login"
            className="text-xs font-bold text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Already have an account? Sign in
          </Link>
        </CardFooter>
        <nav aria-label="About and policies" className="mt-4 flex justify-center gap-4 text-xs text-[var(--muted)]">
          <Link href="/about">About FSP</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
        </nav>
      </Card>
    </div>
  );
}
