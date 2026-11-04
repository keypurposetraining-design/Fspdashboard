import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginDestination } from "@/lib/auth-redirect";

/**
 * OAuth (Google) return URL. Exchanges the PKCE code for a session on the
 * server so the session cookie exists before proxy.ts checks protected routes.
 * `next` is restricted to same-origin paths to prevent open redirects.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Record OAuth sign-in on the server; page reloads and token refreshes
      // must not create additional successful-login events.
      const { data: { user } } = await supabase.auth.getUser();
      let role: string | null = null;
      if (user) {
        const { data: profile } = await supabase.from("users").select("role, is_active").eq("id", user.id).maybeSingle();
        if (profile?.is_active === false) return NextResponse.redirect(new URL('/login?error=disabled', url.origin));
        role = profile?.role ?? null;
        const { data: member } = await supabase.from("members").select("id")
          .eq("user_id", user.id).order("created_at").limit(1).maybeSingle();
        const { error: logError } = await supabase.from("member_activity_logs").insert({
          user_id: user.id, member_id: member?.id ?? null, action: "AUTH_LOGIN",
          metadata: { provider: user.app_metadata.provider ?? "oauth" },
          user_agent: request.headers.get("user-agent") ?? "",
        });
        if (logError) console.error("OAuth login activity could not be recorded:", logError.message);
      }
      return NextResponse.redirect(new URL(loginDestination(role, nextParam), url.origin));
    }
    console.error("OAuth code exchange failed:", error.message);
  }

  const login = new URL("/login", url.origin);
  login.searchParams.set("error", "oauth");
  return NextResponse.redirect(login);
}
