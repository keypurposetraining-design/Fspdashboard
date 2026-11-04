import type { Offering } from "@/lib/data/enrollments";

export const APP_TIMEZONE = "Asia/Kolkata";
export const indiaDate = (now: number = Date.now()) => new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
export function scheduledPrograms(offerings: Offering[], date: string, includePast = false) {
  const sorted = offerings.filter(item => (item.is_active || includePast) && item.start_date).sort((a,b) => `${a.start_date} ${a.program_time ?? "00:00"}`.localeCompare(`${b.start_date} ${b.program_time ?? "00:00"}`));
  return { today: sorted.filter(item => item.start_date === date), upcoming: sorted.filter(item => item.start_date! > date), past: includePast ? sorted.filter(item => item.start_date! < date).reverse() : [] };
}
export const registrationOpen = (item: Offering, date: string) => item.is_active && item.registration_open !== false && (!item.start_date || item.start_date >= date);
export function modeLabel(item: Offering): string {
  return item.mode === "online" ? "ONLINE" : item.mode === "offline" ? "OFFLINE" : "Mode to be confirmed";
}
