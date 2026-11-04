// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { roleHome } from "@/lib/auth-redirect";

/**
 * Server-side route protection (the UI hides links, but this is the gate):
 * - /login, /login/admin, /auth/callback: public.
 * - /super-admin/*: super_admin only.
 * - /admin/*: admin or super_admin (except /admin/unauthorized).
 * - everything else in the app: any signed-in, active account.
 * The role is read from public.users (never from user metadata). Data access
 * is enforced again by RLS and the SECURITY DEFINER RPCs.
 */
const PUBLIC_PATHS = [
  "/login",
  "/login/admin",
  "/auth/callback",
  "/signup",
  "/forgot-password",
  // Reached from the emailed recovery link, before a full session exists.
  "/reset-password",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  let response = NextResponse.next({ request });
  const redirect = (url: URL) => {
    const result = NextResponse.redirect(url);
    response.cookies.getAll().forEach(cookie => result.cookies.set(cookie));
    return result;
  };

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const isSuperAdminPath = pathname === "/super-admin" || pathname.startsWith("/super-admin/");

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname + search);
    return redirect(loginUrl);
  }

  // select("*") keeps this working before migration 001 adds is_active.
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", "disabled");
    return redirect(url);
  }

  const role = profile?.role?.toString().toLowerCase() ?? "";

  // Organizations has been retired. Old bookmarks return to the account's home.
  if (pathname === '/organizations' || pathname.startsWith('/organizations/')) {
    return redirect(new URL(roleHome(role), request.url));
  }

  if (pathname === "/admin/unauthorized") return response;

  // Administrative accounts use management routes, never personal enrollment.
  if ((role === 'admin' || role === 'super_admin') && !isAdminPath && !isSuperAdminPath) {
    const target = pathname.startsWith('/profile') ? '/admin/account' + pathname
      : pathname === '/settings' ? '/admin/account' : roleHome(role);
    return redirect(new URL(target, request.url));
  }
  const adminSections = ['/admin/members', '/admin/payments', '/admin/courses', '/admin/memberships', '/admin/updates', '/admin/audit-logs', '/admin/account'];
  if (role === 'admin' && isAdminPath && pathname !== '/admin' && pathname !== '/admin/dashboard'
      && (!adminSections.some(section => pathname === section || pathname.startsWith(section + '/')) || pathname === '/admin/members/new')) {
    return redirect(new URL('/admin', request.url));
  }

  if (isSuperAdminPath && role !== "super_admin") {
    return redirect(new URL(role === "admin" ? "/admin" : "/admin/unauthorized", request.url));
  }

  if (isAdminPath && role !== "admin" && role !== "super_admin") {
    return redirect(new URL("/admin/unauthorized", request.url));
  }

  // Member routes: any signed-in user. A missing profile row is healed on the
  // client by sync_current_user(); the UI then shows least-privileged views.
  return response;
}

export const config = {
  // Everything except Next internals, API routes and static files.
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt)$).*)"],
};
