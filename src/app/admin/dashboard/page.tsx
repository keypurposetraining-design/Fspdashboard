import { redirect } from "next/navigation";

// The admin overview moved to /admin; keep old links working.
export default function AdminDashboardRedirect() {
  redirect("/admin");
}
