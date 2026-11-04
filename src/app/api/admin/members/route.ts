import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Roles each caller role may assign when creating an account. super_admin is
// never assignable here; promotion goes through the audited set_user_role() RPC.
const ASSIGNABLE_ROLES: Record<string, readonly string[]> = {
  super_admin: ["member", "trainer", "admin"],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export async function POST(request: Request) {
  try {
    // 1. Authenticate and read the caller's trusted role from public.users.
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    const callerRole = profile?.role?.toString().toLowerCase() ?? "";
    if (profileError || profile?.is_active !== true || !(callerRole in ASSIGNABLE_ROLES)) {
      return NextResponse.json({ error: "Forbidden: Super Admin access required to create accounts" }, { status: 403 });
    }

    // 2. Validate input.
    const body = await request.json().catch(() => ({}));
    const firstName = clean(body.firstName, 100);
    const lastName = clean(body.lastName, 100);
    const email = clean(body.email, 255).toLowerCase();
    const phone = clean(body.phone, 20);
    const address = clean(body.address, 500);
    const password = typeof body.password === "string" ? body.password : "";
    const requestedRole = clean(body.role, 20).toLowerCase() || "member";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "All required fields must be filled." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!ASSIGNABLE_ROLES[callerRole].includes(requestedRole)) {
      return NextResponse.json(
        { error: `Your role cannot create accounts with role "${requestedRole}".` },
        { status: 403 }
      );
    }

    const adminSupabase = createAdminClient();
    const fullName = `${firstName} ${lastName}`;

    // 3. Create the auth user. No role in metadata: the DB trigger ignores it
    //    anyway and creates public.users (role 'member') + public.members.
    const { data: authData, error: authCreateError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, given_name: firstName, family_name: lastName },
    });

    if (authCreateError || !authData.user) {
      console.error("Auth user creation error:", authCreateError);
      return NextResponse.json({ error: authCreateError?.message || "Failed to create auth user" }, { status: 400 });
    }

    const authUserId = authData.user.id;

    const rollback = async () => {
      try { await adminSupabase.from("memberships").delete().in(
        "member_id",
        ((await adminSupabase.from("members").select("id").eq("user_id", authUserId)).data ?? []).map((m) => m.id)
      ); } catch {}
      try { await adminSupabase.from("members").delete().eq("user_id", authUserId); } catch {}
      try { await adminSupabase.from("users").delete().eq("id", authUserId); } catch {}
      try { await adminSupabase.auth.admin.deleteUser(authUserId); } catch {}
    };

    try {
      // 4. public.users: upsert (the trigger normally created it already).
      //    The service role bypasses the role guard; the role was whitelisted above.
      const { error: userError } = await adminSupabase
        .from("users")
        .upsert(
          { id: authUserId, email, name: fullName, role: requestedRole, created_by: user.id, updated_at: new Date().toISOString() },
          { onConflict: "id" }
        );
      if (userError) {
        console.error("public.users upsert error:", userError);
        await rollback();
        return NextResponse.json({ error: userError.message }, { status: 400 });
      }

      // 5. public.members: update the trigger-created row, or insert if missing.
      const { data: existingMember } = await adminSupabase
        .from("members")
        .select("id")
        .eq("user_id", authUserId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      const memberFields = {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        address: address || null,
        created_by: user.id,
      };
      const memberResult = existingMember
        ? await adminSupabase.from("members").update(memberFields).eq("id", existingMember.id).select("id").single()
        : await adminSupabase.from("members").insert({ user_id: authUserId, ...memberFields }).select("id").single();

      if (memberResult.error || !memberResult.data) {
        console.error("public.members write error:", memberResult.error);
        await rollback();
        return NextResponse.json({ error: memberResult.error?.message || "Failed to create member" }, { status: 400 });
      }
      const memberId = memberResult.data.id;

      // 6. Pending membership; it becomes active only on admin approval.
      const { error: membershipError } = await adminSupabase.from("memberships").insert({
        member_id: memberId,
        start_date: new Date().toISOString().split("T")[0],
        status: "pending",
        created_by: user.id,
      });
      if (membershipError) {
        console.warn("Failed to create default membership:", membershipError.message);
      }

      // 7. Audit (never includes the password).
      const { error: auditError } = await adminSupabase.from("audit_logs").insert({
        action: "MEMBER_CREATED",
        table_name: "members",
        record_id: memberId,
        performed_by: user.id,
        details: {
          new_value: { first_name: firstName, last_name: lastName, email, phone: phone || null, address: address || null, role: requestedRole },
          actor_role: callerRole,
        },
      });
      if (auditError) {
        console.error("Audit log insert error:", auditError);
      }

      return NextResponse.json({ success: true, memberId, message: "Member created successfully!" });
    } catch (err) {
      await rollback();
      console.error("Error creating member:", err);
      return NextResponse.json({ error: "Failed to create member. Please try again." }, { status: 500 });
    }
  } catch (err) {
    console.error("Fatal error in create member:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
