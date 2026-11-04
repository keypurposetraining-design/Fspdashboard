// Small formatting helpers shared by the admin pages.

import { fullName } from "@/lib/profile";
import { getDocumentUrlForReview } from "@/lib/data/admin";
import { toDataError } from "@/lib/data/errors";

export function memberName(
  p: { first_name?: string | null; last_name?: string | null } | null | undefined,
  fallback?: string | null
) {
  return fullName(p) || fallback || "Unnamed member";
}

/** Whole days elapsed since `iso` (0 for today or future). */
export function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function waitingLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = daysSince(iso);
  if (d === 0) return "Submitted today";
  return `Waiting ${d} day${d === 1 ? "" : "s"}`;
}

export function formatBytes(n: number | null | undefined): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Opens a short-lived signed URL for a member document in a new tab. The tab
 * is opened synchronously (inside the click) so popup blockers allow it, then
 * pointed at the URL once it has been generated.
 */
export async function openDocument(storagePath: string): Promise<void> {
  const win = window.open("", "_blank");
  try {
    const url = await getDocumentUrlForReview(storagePath);
    if (win) {
      win.opener = null;
      win.location.href = url;
    } else {
      window.location.href = url;
    }
  } catch (e) {
    win?.close();
    throw toDataError(e, "openDocument");
  }
}

/**
 * First day of the month `monthsAgo` months before the current one, at UTC
 * noon. getMonthlySeries formats dates with toISOString() (UTC), so a local
 * midnight date would shift to the previous day in timezones ahead of UTC.
 */
export function monthStartUtc(monthsAgo: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() - monthsAgo, 1, 12));
}

/** Today's calendar date at UTC noon (see monthStartUtc). */
export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
}

/** `YYYY-MM-DD` for date inputs, from a UTC-noon date. */
export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
