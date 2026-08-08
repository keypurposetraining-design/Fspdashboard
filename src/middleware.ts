// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Middleware protects any route under /admin.
 * - Unauthenticated users are redirected to /login.
 * - Users with role 'admin' or 'super_admin' are allowed.
 * - All other authenticated users are redirected to /admin/unauthorized.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { data: { session } } = await supabase.auth.getSession();
  const url = request.nextUrl.clone();
  if (!session) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
  const role = user?.role?.toString().toLowerCase();
  if (error || !role) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (role === 'admin' || role === 'super_admin') {
    return response;
  }
  url.pathname = '/admin/unauthorized';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'],
};
