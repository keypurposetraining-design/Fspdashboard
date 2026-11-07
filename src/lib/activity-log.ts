/**
 * Securely dispatches user activity details to the server-side audit logs.
 */
export async function logMemberActivity(action: string, details: Record<string, unknown> = {}) {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action, details }),
    });
  } catch (err: unknown) {
    console.error("Client logMemberActivity error:", err instanceof Error ? err.message : "Unknown error");
  }
}
