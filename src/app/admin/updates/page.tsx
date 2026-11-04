import { TodaysUpdates } from "@/components/member/TodaysUpdates";
export default function AdminUpdatesPage() {
  return <div><h1 className="fsp-dot text-3xl font-black">Member Updates</h1><p className="mt-2 text-sm text-[var(--muted)]">Publish program details and flyers to all member dashboards.</p><TodaysUpdates admin /></div>;
}
