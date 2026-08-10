// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy protects any route under /admin.
 * - Unauthenticated users are redirected to /login.
 * - Users with role 'admin' or 'super_admin' are allowed.
 * - All other authenticated users are redirected to /admin/unauthorized.
 */
export async function proxy(request: NextRequest) {
  // Create a mutable response for potential cookie updates.
  const response = NextResponse.next();

  // Exclude unauthorized route from redirects to prevent loops
  if (request.nextUrl.pathname === "/admin/unauthorized") {
    return response;
  }

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

  if (userError || !user) {
    // Redirect unauthenticated admin attempts to the dedicated admin login
    const loginUrl = new URL("/login/admin", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Securely fetch the user's role from the public.users table.
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toString().toLowerCase();

  if (profileError || !role) {
    // Treat as unauthenticated if we cannot determine role.
    const loginUrl = new URL("/login/admin", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (role === "admin" || role === "super_admin") {
    // Allowed – return the response.
    return response;
  }

  // Authenticated but not authorized.
  const unauthorizedUrl = new URL("/admin/unauthorized", request.url);
  return NextResponse.redirect(unauthorizedUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
