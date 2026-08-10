"use client";
// src/app/admin/Sidebar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Users,
  CreditCard,
  Calendar,
  Gift,
  Upload,
  BellRing,
  Settings,
  ShieldCheck,
  HelpCircle,
  BookOpen,
  Flag,
  Mail,
  MessageSquare,
  RefreshCcw,
  CheckCircle2,
  Activity,
  TrendingUp,
  TrendingDown,
  Plus,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: BarChart2 },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Memberships", href: "/admin/memberships", icon: CreditCard },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Tasks & Challenges", href: "/admin/tasks", icon: Flag },
  { label: "Events", href: "/admin/events", icon: Calendar },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Certificates", href: "/admin/certificates", icon: Gift },
  { label: "Resources", href: "/admin/resources", icon: Upload },
  { label: "Community", href: "/admin/community", icon: Users },
  { label: "Notifications", href: "/admin/notifications", icon: BellRing },
  { label: "Reports", href: "/admin/reports", icon: BarChart2 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldCheck },
  { label: "Member Activity Logs", href: "/admin/member-logs", icon: Activity },
  { label: "Support", href: "/admin/support", icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 space-y-4 hidden md:block">
      <h2 className="text-xl font-bold text-primary mb-4">Admin Portal</h2>
      <nav className="space-y-2 text-sm">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center py-1 px-2 rounded ${isActive ? "bg-gray-100" : ""}`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
