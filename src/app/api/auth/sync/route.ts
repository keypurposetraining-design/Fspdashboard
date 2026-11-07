import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Call the security definer sync function
    const { data: syncData, error: syncError } = await supabase.rpc("sync_current_user");

    if (syncError) {
      console.warn("sync_current_user RPC notice:", syncError.message);
    }

    // Return the current user profile from public.users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (userError || !userData) {
      // Profile not synced yet. Never derive the role from user_metadata
      // (user-writable); report the least-privileged role.
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0],
          role: "member"
        },
        syncResult: syncData
      });
    }

    return NextResponse.json({
      success: true,
      user: userData,
      syncResult: syncData
    });
  } catch (err: unknown) {
    console.error("Auth sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
