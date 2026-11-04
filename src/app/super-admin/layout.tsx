import { AppShell } from "@/components/shell/AppShell";

// Super-admin area. proxy.ts only lets super_admin sessions reach these routes;
// set_user_role() and the settings RLS policies enforce it again in the database.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell requireRole="super_admin">{children}</AppShell>;
}
