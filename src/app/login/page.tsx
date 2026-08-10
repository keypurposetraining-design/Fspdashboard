"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import Link from 'next/link';

const LoginPage = () => {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect after login based on role
  useEffect(() => {
    console.log('LOGIN PAGE REDIRECT CHECK', { user, role: user?.role, authLoading });
      if (user && !authLoading) {
        console.log('REDIRECT TO ADMIN', { role: user.role });
        switch (user.role) {
          case 'super_admin':
          case 'admin':
            // Slight delay to ensure auth cookie is persisted before navigation
            setTimeout(() => router.replace('/admin/dashboard'), 500);
            break;
          case 'trainer':
            setTimeout(() => router.replace('/trainer/dashboard'), 500);
            break;
          case 'member':
            setTimeout(() => router.replace('/dashboard'), 500);
            break;
          default:
            setTimeout(() => router.replace('/'), 500);
            break;
        }
      } else {
        console.log('REDIRECT NOT TRIGGERED', { user, role: user?.role, authLoading });
      }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // AuthProvider will update user and trigger redirect via useEffect
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() ?? '';
      if (msg.includes('invalid')) setError('Invalid email or password.');
      else if (msg.includes('not confirmed')) setError('Account inactive.');
      else setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">Member Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@domain.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
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
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || authLoading}>
              {loading || authLoading ? 'Signing in…' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/login/admin" className="text-sm text-blue-600 hover:underline">
            Go to Admin Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
