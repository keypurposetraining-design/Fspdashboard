/**
 * Securely dispatches user activity details to the server-side audit logs.
 */
export async function logMemberActivity(action: string, details: any = {}) {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, details }),
    });
  } catch (err: any) {
    console.error("Client logMemberActivity error:", err.message);
  }
}
