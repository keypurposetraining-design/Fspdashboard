"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';

function AdminLoginForm() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse custom redirect param or default to admin dashboard
  const redirectUrl = searchParams.get('redirect') || '/admin/dashboard';

  // Role verification on mount or status update
  useEffect(() => {
    if (user && !authLoading) {
      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'super_admin') {
        setTimeout(() => router.replace(redirectUrl), 500);
      } else {
        setTimeout(() => router.replace('/admin/unauthorized'), 500);
      }
    }
  }, [user, authLoading, router, redirectUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      // Surface generic authentication failure messages to prevent user enumeration
      if (msg.includes('invalid') || msg.includes('not found') || msg.includes('no user')) {
        setError('Invalid email or password.');
      } else if (msg.includes('not confirmed')) {
        setError('Administrative account inactive.');
      } else if (msg.includes('profile')) {
        setError('This account is not linked to a portal profile. Please contact support.');
      } else {
        setError('A network error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white px-4">
      <Card className="w-full max-w-md p-6 shadow-xl border border-slate-200 bg-white rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3">
            <ShieldAlert className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">
            Admin Portal
          </CardTitle>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Access secure Facilitator Support Program operations
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-bold text-slate-700 block">
                Admin Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@domain.com"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-xs font-bold text-slate-700 block">
                Secure Access Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <Link href="/forgot-password" className="font-semibold text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-xs font-semibold" role="alert">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-2" disabled={loading || authLoading}>
              {loading || authLoading ? 'Signing in...' : 'Sign In To Portal'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t mt-4 pt-4">
          <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            ← Switch to Member Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading Portal...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
