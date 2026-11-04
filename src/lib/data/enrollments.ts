import { createClient } from "@/lib/supabase/client";

export interface Offering {
  id: string;
  code: string;
  title: string;
  description: string;
  kind: "course" | "program";
  duration: string;
  format: string | null;
  price: number;
  currency: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  flyer_path: string | null;
  program_time?: string | null;
  program_end_time?: string | null;
  mode?: "online" | "offline" | null;
  registration_open?: boolean;
}

export function offeringDates(item: Offering): string | null {
  if (!item.start_date) return null;
  const format = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return item.end_date && item.end_date !== item.start_date ? `${format(item.start_date)} – ${format(item.end_date)}` : format(item.start_date);
}

export function programTimeLabel(time: string | null | undefined): string | null {
  if (!time) return null;
  return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) + " IST";
}

export async function uploadProgramFlyer(file: File): Promise<string> {
  if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5242880) throw new Error("Choose a JPG, PNG, or WebP flyer up to 5 MB.");
  const db = createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) throw new Error("Please sign in again.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from("program-flyers").upload(path,file,{contentType:file.type,upsert:false});
  if (error) throw error;
  return path;
}

export interface OfferingEnrollment {
  id: string;
  offering_id: string;
  member_id: string;
  amount: number;
  currency: string;
  status: "pending_payment" | "payment_review" | "active";
  payment_reference: string | null;
  receipt_path: string | null;
  review_note: string | null;
  created_at: string;
  offerings: Offering;
  members?: { first_name: string | null; last_name: string | null; user_id: string };
}

export const feeLabel = (amount: number, currency = "INR") =>
  amount === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

/**
 * An offering announced but not yet open for sign-ups, shown as "Upcoming"
 * rather than a price and an enrol button. Driven by the same
 * offerings.registration_open flag that save_program writes and that
 * enroll_in_offering already refuses to enrol against, so the card cannot
 * invite an enrolment the database would reject.
 */
export const isUpcoming = (item: Offering) => item.registration_open === false;

/** Fee line for a catalogue card: price, or a placeholder while it is upcoming. */
export const offeringFeeLabel = (item: Offering) =>
  isUpcoming(item) ? "Fee to be announced" : feeLabel(item.price, item.currency);

export const statusLabel = (status: OfferingEnrollment["status"]) => ({
  pending_payment: "Pending payment", payment_review: "Payment under review", active: "Active",
})[status];

export function enrollmentError(error: unknown): string {
  const value = error as { message?: string; code?: string };
  if (["42P01", "PGRST205", "PGRST202"].includes(value?.code ?? "")) {
    const message = value?.message ?? "";
    if (/complete_daily_task|offering_daily_tasks|offering_task_completions/.test(message)) {
      return "Daily course tasks are not configured yet. Run migration 016_course_daily_tasks.sql in Supabase, then refresh.";
    }
    if (message.includes("publish_member_update")) {
      return "Publishing is not configured for program time yet. Run migration 014_update_time_expiry.sql in Supabase, then refresh and publish again.";
    }
    if (message.includes("save_program")) {
      return "Program saving is not configured yet. Apply migrations 012–014 in Supabase, then try again.";
    }
    if (message.includes("member_updates")) {
      return "Today's Updates is not configured yet. Apply migrations 010–014 in Supabase, then refresh.";
    }
    return "Enrollment is not available yet. Please contact the FSP administrator.";
  }
  return value?.message || "Something went wrong. Please try again.";
}

export async function loadEnrollmentData(admin = false) {
  const db = createClient();
  const results = await Promise.all([
    db.from("offerings").select("*").order("sort_order"),
    db.from("offering_enrollments").select(admin ? "*, offerings(*), members(first_name,last_name,user_id)" : "*, offerings(*)").order("created_at", { ascending: false }),
    db.from("enrollment_payment_settings").select("instructions").eq("id", 1).single(),
  ]);
  for (const result of results) if (result.error) throw result.error;
  return {
    offerings: results[0].data as unknown as Offering[],
    enrollments: results[1].data as unknown as OfferingEnrollment[],
    instructions: (results[2].data as unknown as { instructions: string }).instructions,
  };
}

export async function enrollmentAction(name: "enroll_offering" | "submit_enrollment_payment" | "review_enrollment_payment", args: Record<string, unknown>) {
  const { data, error } = await createClient().rpc(name, args);
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error("The enrollment could not be confirmed. Refresh and try again.");
  return row as OfferingEnrollment;
}
