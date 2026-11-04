import { AppShell } from "@/components/shell/AppShell";

// Admin area. proxy.ts only lets admin/super_admin sessions reach these routes;
// RLS and the review RPCs re-check the role on every data call.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requireRole="admin">{children}</AppShell>;
}
