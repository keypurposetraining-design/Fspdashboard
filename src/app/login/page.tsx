"use client";

import React, { useState, useEffect } from 'react';
import { loginDestination } from '@/lib/auth-redirect';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';
import Image from 'next/image';

const LoginPage = () => {
  const { user, login, loginWithGoogle, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Show errors passed back from /auth/callback or proxy.ts.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('error');
    const messages: Record<string, string> = {
      oauth: 'Google sign-in could not be completed. Please try again.',
      disabled: 'This account has been disabled. Contact the FSP team for help.',
    };
    if (code && messages[code]) setTimeout(() => setError(messages[code]), 0);
  }, []);

  // The trusted database role decides the landing page for every sign-in method.
  useEffect(() => {
    if (user && !authLoading) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'disabled') return;
      // Request a fresh protected page after cookies have been persisted.
      window.location.replace(loginDestination(user.role, params.get('redirect') ?? ''));
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('invalid')) setError('Invalid email or password.');
      else if (msg.includes('not confirmed')) setError('Confirm your email using the link in your inbox, then sign in.');
      else setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
      <Card className="w-full max-w-md relative overflow-hidden p-6 shadow-xl border border-[var(--card-border)] border-t-[4px] border-t-[var(--brand-yellow)] bg-[var(--card-bg)] rounded-3xl">
        <CardHeader className="flex-col text-center">
          <div className="mx-auto mb-4 w-fit overflow-hidden rounded-2xl bg-[var(--brand-navy)] px-2 shadow-sm">
            <Image src="/fsp-logo.png" alt="FSP" width={156} height={104} preload unoptimized
              className="h-auto w-[156px] object-contain"
              style={{ clipPath: "inset(0 0 38% 0)", transform: "translateY(8%)" }} />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-[var(--foreground)] fsp-dot">Sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 py-2.5 font-semibold text-sm border-[var(--card-border)] hover:bg-[var(--card-border)]/20 transition-all rounded-xl shadow-xs"
            onClick={handleGoogleLogin}
            disabled={loading || authLoading || googleLoading}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--card-border)]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[var(--card-bg)] px-3 text-[var(--muted)] font-medium">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@domain.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="********"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--card-border)] text-[var(--brand-navy)] focus:ring-[var(--brand-navy)]"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-[var(--foreground)]">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-[var(--brand-navy)] hover:underline">
                Forgot password?
              </Link>
            </div>
            {error && (
              <p className="text-sm text-rose-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || authLoading || googleLoading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t mt-4 pt-4">
          <Link href="/signup" className="text-sm text-[var(--brand-navy)] hover:underline">
            New here? Create an account
          </Link>
        </CardFooter>
        <nav aria-label="About and policies" className="mt-4 flex justify-center gap-4 text-xs text-[var(--muted)]">
          <Link href="/about">About FSP</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>
        </nav>
      </Card>
    </div>
  );
};

export default LoginPage;
