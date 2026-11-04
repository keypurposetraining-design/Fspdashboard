"use client";
import React from "react";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { Search, Bell, Menu, Sparkles, HelpCircle } from "lucide-react";

export interface TopNavProps {
  onToggleMobileSidebar: () => void;
  activeTab: string;
  onNavigate: (tabId: string) => void;
  unreadNotificationsCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMobileSidebar,
  onNavigate,
  unreadNotificationsCount = 2,
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[var(--card-bg)]/90 backdrop-blur-md border-b-[3px] border-[var(--brand-yellow)] px-4 lg:px-8 flex items-center justify-between transition-all glass-panel">
      {/* Left side: Hamburger for mobile + Search Input */}
      <div className="flex items-center gap-3 lg:gap-6 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--muted-light)] hover:text-[var(--foreground)] transition-colors focus:outline-none"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--muted)]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search workshops, challenges, events, resources..."
            className="w-full pl-10 pr-12 py-2 text-xs bg-[var(--muted-light)]/70 border border-[var(--card-border)] rounded-xl focus:outline-none focus:bg-white focus:border-[var(--brand-navy)] focus:ring-2 focus:ring-[var(--brand-navy)]/20 text-[var(--foreground)] placeholder-[var(--muted)] transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)] bg-white border border-[var(--card-border)] rounded-md shadow-2xs">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side: Credits badge, Notifications, Profile Avatar & Badge */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        {/* Support Credits Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[var(--brand-gold-light)] to-[var(--warning-light)] border border-[var(--brand-gold)]/30 rounded-full text-xs font-semibold text-[var(--brand-gold-ink)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Credits</span>
        </div>

        {/* Help / Docs icon */}
        <button
          className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted-light)] transition-colors hidden sm:block"
          title="FSP Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={() => onNavigate("notifications")}
          className="relative p-2 rounded-xl text-[var(--muted)] hover:bg-[var(--muted-light)] hover:text-[var(--foreground)] transition-colors focus:outline-none"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--brand-gold)] ring-2 ring-white" />
          )}
        </button>

        <div className="h-6 w-px bg-[var(--card-border)] mx-1 hidden sm:block" />

        {/* Member Profile Avatar + Badge */}
        <button
          onClick={() => onNavigate("profile")}
          className="flex items-center gap-3 p-1 rounded-xl hover:bg-[var(--muted-light)]/80 transition-all text-left focus:outline-none"
        >
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-[var(--brand-navy-light)] text-[var(--brand-navy)] font-bold text-sm flex items-center justify-center ring-2 ring-[var(--brand-navy)]/20">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[var(--foreground)] leading-none">
                {user?.name || user?.email || "User"}
              </span>
              <Badge variant="pro" size="sm">
                {user?.role?.toUpperCase() || "MEMBER"}
              </Badge>
            </div>
            <span className="text-[10px] text-[var(--muted)] font-medium block mt-0.5">
              {user?.email}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
