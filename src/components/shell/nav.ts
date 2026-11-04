import {
  LayoutDashboard,
  User,
  BadgeCheck,
  Bell,
  Settings,
  BookOpen,
  CheckSquare,
  Calendar,
  CreditCard,
  Award,
  Users,
  Library,
  Gauge,
  UserSearch,
  ShieldCheck,
  UserCog,
  SlidersHorizontal,
  ScrollText,
  Lock,
  BellRing,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/components/auth/AuthProvider";

export interface NavLink {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Also highlight for these path prefixes. */
  match?: string[];
  /** Exact match only (for section roots like /admin). */
  exact?: boolean;
  badge?: "notifications";
}

export interface NavGroup {
  id: string;
  label?: string;
  links: NavLink[];
  /** Rendered collapsed by default (secondary tools). */
  collapsible?: boolean;
  roles: NonNullable<Role>[];
}

const ALL: NonNullable<Role>[] = ["member", "trainer"];
const ADMINS: NonNullable<Role>[] = ["admin", "super_admin"];

/**
 * Navigation by trusted role (public.users.role via AuthProvider).
 * Hiding links is a UI convenience only; proxy.ts, RLS and the RPCs enforce access.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "main",
    roles: ALL,
    links: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Profile", href: "/profile", icon: User },
      { label: "Events & Calendar", href: "/events", icon: Calendar },
      { label: "Membership", href: "/membership", icon: BadgeCheck },
      { label: "Notifications", href: "/notifications", icon: Bell, badge: "notifications" },
    ],
  },
  {
    id: "programs",
    label: "Programs",
    roles: ALL,
    collapsible: true,
    links: [
      { label: "Courses", href: "/courses", icon: BookOpen },
      { label: "Tasks & Challenges", href: "/tasks", icon: CheckSquare },
      { label: "Payments", href: "/payments", icon: CreditCard },
      { label: "Certificates", href: "/certificates", icon: Award },
      { label: "Community", href: "/community", icon: Users },
      { label: "Resources", href: "/resources", icon: Library },
    ],
  },
  {
    id: "admin", label: "Management", roles: ADMINS,
    links: [
      { label: "Overview", href: "/admin", icon: Gauge, exact: true, match: ["/admin/dashboard"] },
      { label: "Members", href: "/admin/members", icon: UserSearch },
      { label: "Payment Approvals", href: "/admin/payments", icon: CreditCard },
      { label: "Courses & Dates", href: "/admin/courses", icon: Calendar },
      { label: "Memberships", href: "/admin/memberships", icon: BadgeCheck },
      { label: "Today's Updates", href: "/admin/updates", icon: BellRing },
      { label: "Activity Log", href: "/admin/audit-logs", icon: ScrollText },
      { label: "Account Settings", href: "/admin/account", icon: Settings },
    ],
  },  {
    id: "super-admin",
    label: "Super Admin",
    roles: ["super_admin"],
    links: [
      { label: "Overview", href: "/super-admin", icon: ShieldCheck, exact: true },
      { label: "Admin Management", href: "/super-admin/admins", icon: UserCog },
      { label: "User Management", href: "/super-admin/users", icon: Users },
      { label: "System Settings", href: "/super-admin/settings", icon: SlidersHorizontal },
      { label: "Audit Logs", href: "/super-admin/audit-logs", icon: ScrollText },
      { label: "Security", href: "/super-admin/security", icon: Lock },
    ],
  },
];

export const SETTINGS_LINK: NavLink = { label: "Settings", href: "/settings", icon: Settings };

export function groupsForRole(role: Role): NavGroup[] {
  const r = role ?? "member";
  return NAV_GROUPS.filter((g) => g.roles.includes(r));
}

export function isActive(link: NavLink, pathname: string): boolean {
  const candidates = [link.href, ...(link.match ?? [])];
  return candidates.some((h) =>
    link.exact && h === link.href ? pathname === h : pathname === h || pathname.startsWith(h + "/")
  );
}
