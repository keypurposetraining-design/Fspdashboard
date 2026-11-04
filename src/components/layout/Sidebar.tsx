import React from "react";
import {
  LayoutDashboard,
  UserCheck,
  CheckSquare,
  Calendar,
  CreditCard,
  Award,
  Users,
  Bell,
  User,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { Logo } from "@/components/ui/Logo";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: "primary" | "secondary" | "success" | "warning";
}

export interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogoutClick: () => void;
}

export const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "membership",
    label: "My Membership",
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    id: "tasks",
    label: "Tasks & Challenges",
    icon: <CheckSquare className="w-5 h-5" />,
    badge: "3 Active",
    badgeVariant: "secondary",
  },
  {
    id: "events",
    label: "Events & Calendar",
    icon: <Calendar className="w-5 h-5" />,
    badge: "Live",
    badgeVariant: "warning",
  },
  {
    id: "payments",
    label: "Payments",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: <Award className="w-5 h-5" />,
    badge: "4",
    badgeVariant: "success",
  },
  {
    id: "community",
    label: "Community",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell className="w-5 h-5" />,
    badge: "2",
    badgeVariant: "secondary",
  },
  {
    id: "profile",
    label: "My Profile",
    icon: <User className="w-5 h-5" />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onLogoutClick,
}) => {
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--card-bg)] border-r border-[var(--card-border)] w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b-[3px] border-[var(--brand-yellow)]">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab("dashboard")}>
          <Logo variant="compact" size="lg" alt="FSP Member Hub" showBrandText={false} />
          <div>
            <h1 className="text-base font-extrabold text-[var(--foreground)] leading-tight tracking-tight fsp-dot">
              Member Hub
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-navy)] block">
              Facilitator Support
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--muted-light)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group",
                isActive
                  ? "bg-[var(--brand-navy)] text-white shadow-md shadow-[var(--brand-navy)]/20 font-bold fsp-rail"
                  : "text-[var(--muted)] hover:bg-[var(--muted-light)]/80 hover:text-[var(--foreground)]"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={clsx(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    isActive
                      ? "bg-white/20 text-white"
                      : item.badgeVariant === "secondary"
                      ? "bg-[var(--brand-gold-light)] text-[var(--brand-gold-ink)]"
                      : item.badgeVariant === "success"
                      ? "bg-[var(--success-light)] text-[var(--success)]"
                      : item.badgeVariant === "warning"
                      ? "bg-[var(--warning-light)] text-[var(--warning)]"
                      : "bg-[var(--brand-navy-light)] text-[var(--brand-navy)]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[var(--card-border)]">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-light)] transition-colors group"
        >
          <LogOut className="w-5 h-5 text-[var(--danger)] transition-transform group-hover:-translate-x-0.5" />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 max-w-xs w-full animate-in slide-in-from-left duration-200 z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
