// Maps database/API errors to messages that are safe to show a member.
// Raw database errors are logged to the console for developers, never rendered.

interface PgLikeError {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
}

/** Error codes raised deliberately by our SQL functions with user-facing wording. */
const CURATED_CODES = new Set(["22023", "P0002"]);

const CURATED_PERMISSION_MESSAGES = new Set([
  "Cannot remove the last active super admin",
  "Only a super admin can change roles",
  "You cannot review your own application",
  "You cannot review your own document",
  "You can only submit your own application",
]);

export class DataError extends Error {
  readonly kind: "permission" | "not_found" | "validation" | "unavailable" | "unknown";
  constructor(kind: DataError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

export function toDataError(err: unknown, context: string): DataError {
  if (err instanceof DataError) return err;
  const e = (err ?? {}) as PgLikeError;
  const mapped = classify(e, err);

  // Every error reaching here is returned to a caller that shows the member a
  // message, so a recognised one is already handled: log it at warn level so it
  // stays visible to developers without Next's dev overlay raising it as an
  // app error. Only an unrecognised failure is genuinely worth interrupting for.
  const log = mapped.kind === "unknown" ? console.error : console.warn;
  log(`[data] ${context}`, { code: e.code ?? null, message: e.message ?? String(err), details: e.details ?? null, hint: e.hint ?? null });
  return mapped;
}

function classify(e: PgLikeError, err: unknown): DataError {
  const code = e.code ?? "";
  // A few permission errors raised by our own SQL carry wording that is safe and
  // more useful than the generic message (e.g. set_user_role's last-super-admin guard).
  if (code === "42501" && e.message && CURATED_PERMISSION_MESSAGES.has(e.message)) {
    return new DataError("permission", e.message);
  }
  if (code === "42501" || code === "PGRST301") {
    return new DataError("permission", "You don't have permission to do that.");
  }
  if (CURATED_CODES.has(code) && e.message) {
    return new DataError(code === "P0002" ? "not_found" : "validation", e.message);
  }
  if (code === "PGRST116") {
    return new DataError("not_found", "We couldn't find that record.");
  }
  // Missing table/function/column: the database migration for this feature
  // has not been applied yet.
  if (["42P01", "42883", "42703", "PGRST202", "PGRST204", "PGRST205"].includes(code)) {
    return new DataError(
      "unavailable",
      "This feature isn't available yet. An administrator needs to finish a database update."
    );
  }
  if (code === "23514") {
    return new DataError("validation", "One of the values is too long or not allowed.");
  }
  if (typeof e.message === "string" && /fetch|network/i.test(e.message)) {
    return new DataError("unavailable", "We couldn't reach the server. Check your connection and try again.");
  }
  return new DataError("unknown", "Something went wrong. Please try again.");
}

/** Throws a DataError when a Supabase response carries an error. */
export function unwrap<T>(res: { data: T; error: unknown }, context: string): T {
  if (res.error) throw toDataError(res.error, context);
  return res.data;
}
