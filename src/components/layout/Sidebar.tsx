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
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

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
    badge: "PRO",
    badgeVariant: "primary",
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
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onSelectTab("dashboard")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0F4CFF] to-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            FSP
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">
              Member Hub
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
              Facilitator Support
            </span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                  ? "bg-[#0F4CFF] text-white shadow-md shadow-blue-500/20 font-bold"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
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
                      ? "bg-orange-100 text-[#FF7A00]"
                      : item.badgeVariant === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.badgeVariant === "warning"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-[#0F4CFF]"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Upgrade Banner in Sidebar */}
      <div className="p-3 m-3 bg-gradient-to-br from-blue-50 to-orange-50/50 border border-blue-100 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
          <Zap className="w-4 h-4 text-[#FF7A00]" />
          <span>FSP Guild Mentorship</span>
        </div>
        <p className="text-[11px] text-slate-500 mb-2 leading-tight">
          Unlock 1-on-1 monthly sessions & VIP template library.
        </p>
        <button
          onClick={() => onSelectTab("membership")}
          className="w-full text-center py-1.5 px-3 bg-[#0F4CFF] text-white text-xs font-bold rounded-xl hover:bg-[#0D41DB] transition-all shadow-xs"
        >
          Explore VIP Tier
        </button>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-100">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors group"
        >
          <LogOut className="w-5 h-5 text-rose-500 transition-transform group-hover:-translate-x-0.5" />
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
