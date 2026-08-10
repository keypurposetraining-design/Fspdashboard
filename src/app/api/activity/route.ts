import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { action, details } = await request.json();

    const headers = request.headers;
    const ipAddress = headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = headers.get("user-agent") || "";

    // For AUTH_LOGIN_FAILED, write log anonymously without auth session context.
    if (action === "AUTH_LOGIN_FAILED") {
      const { error: insertError } = await supabase
        .from("member_activity_logs")
        .insert({
          action: "AUTH_LOGIN_FAILED",
          ip_address: ipAddress,
          user_agent: userAgent,
          metadata: { email: details?.email || "anonymous" },
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
        metadata: details || {},
        created_at: new Date().toISOString()
      });

    if (logInsertError) {
      console.error("Error inserting member activity log:", logInsertError.message);
      return NextResponse.json({ error: "Database write failure" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Fatal activity logging failure:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
