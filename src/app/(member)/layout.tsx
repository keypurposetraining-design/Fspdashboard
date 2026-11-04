import { AppShell } from "@/components/shell/AppShell";

// Member area (URLs unchanged: /dashboard, /profile, ...). proxy.ts requires a
// session for every route in this group.
export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
