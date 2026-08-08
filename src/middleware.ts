// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware protects any route under /admin.
 * - Unauthenticated users are redirected to /login.
 * - Users with role 'admin' or 'super_admin' are allowed.
 * - All other authenticated users are redirected to /admin/unauthorized.
 */
export async function middleware(request: NextRequest) {
  console.log('MIDDLEWARE START', { url: request.nextUrl.pathname, cookies: request.cookies.getAll() });
  // Create a mutable response for potential cookie updates.
  const response = NextResponse.next();

  // Initialise Supabase server client with proper cookie handling.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Get the current user from cookies (SSR safe).
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('MIDDLEWARE USER', { user, userError });

  if (userError || !user) {
    // No session – redirect to login.
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Securely fetch the user's role from the public.users table.
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  console.log('MIDDLEWARE PROFILE', { profile, profileError });

  const role = profile?.role?.toString().toLowerCase();

  if (profileError || !role) {
    // Treat as unauthenticated if we cannot determine role.
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (role === "admin" || role === "super_admin") {
    // Allowed – return the (potentially cookie‑augmented) response.
    return response;
  }

  // Authenticated but not authorized.
  const unauthorizedUrl = new URL("/admin/unauthorized", request.url);
  return NextResponse.redirect(unauthorizedUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
