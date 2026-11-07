import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "A JSON activity object is required" }, { status: 400 });
    }
    const { action, details } = body as Record<string, unknown>;
    if (typeof action !== "string" || !action.trim() || action.length > 255 ||
        (details !== undefined && (details === null || typeof details !== "object" || Array.isArray(details)))) {
      return NextResponse.json({ error: "Provide a valid action and details object" }, { status: 400 });
    }
    const metadata = (details ?? {}) as Record<string, unknown>;
    const supabase = await createClient();

    const headers = request.headers;
    const ipAddress = headers.get("x-forwarded-for")?.split(",")[0].trim().slice(0, 45) || "127.0.0.1";
    const userAgent = headers.get("user-agent") || "";

    // For AUTH_LOGIN_FAILED, write log anonymously without auth session context.
    if (action === "AUTH_LOGIN_FAILED") {
      const { error: insertError } = await supabase
        .from("member_activity_logs")
        .insert({
          action: "AUTH_LOGIN_FAILED",
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { email: typeof metadata.email === "string" ? metadata.email.slice(0, 255) : "anonymous" },
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("Error logging anonymous failed login:", insertError.message);
        return NextResponse.json({ error: "Database write failure" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // For authenticated activities: retrieve and verify the active session.
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // Fetch the associated member profile id
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("Error checking member profile:", memberError.message);
      return NextResponse.json({ error: "Database look-up failure" }, { status: 500 });
    }

    const { error: logInsertError } = await supabase
      .from("member_activity_logs")
      .insert({
        user_id: user.id,
        member_id: member?.id || null,
        action: action,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata,
        created_at: new Date().toISOString()
      });

    if (logInsertError) {
      console.error("Error inserting member activity log:", logInsertError.message);
      return NextResponse.json({ error: "Database write failure" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Fatal activity logging failure:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json({ error: "Activity logging failed" }, { status: 500 });
  }
}
