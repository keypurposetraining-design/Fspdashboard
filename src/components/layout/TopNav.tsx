"use client";
import React from "react";
import { mockUser } from "@/data/mockData";
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
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between transition-all">
      {/* Left side: Hamburger for mobile + Search Input */}
      <div className="flex items-center gap-3 lg:gap-6 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search workshops, challenges, events, resources..."
            className="w-full pl-10 pr-12 py-2 text-xs bg-slate-100/70 border border-slate-200/80 rounded-xl focus:outline-none focus:bg-white focus:border-[#0F4CFF] focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder-slate-400 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded-md shadow-2xs">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side: Credits badge, Notifications, Profile Avatar & Badge */}
      <div className="flex items-center gap-3 lg:gap-4 shrink-0">
        {/* Support Credits Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/70 rounded-full text-xs font-semibold text-[#FF7A00]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{mockUser.credits} Credits</span>
        </div>

        {/* Help / Docs icon */}
        <button
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors hidden sm:block"
          title="FSP Help & Support"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications Icon Button */}
        <button
          onClick={() => onNavigate("notifications")}
          className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF7A00] ring-2 ring-white" />
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Member Profile Avatar + Badge */}
        <button
          onClick={() => onNavigate("profile")}
          className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-100/80 transition-all text-left focus:outline-none"
        >
          <div className="relative">
            <img
              src={mockUser.avatar}
              alt={mockUser.name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/20"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
          </div>

          <div className="hidden md:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 leading-none">
                {mockUser.name}
              </span>
              <Badge variant="pro" size="sm">
                {mockUser.tier}
              </Badge>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
              {mockUser.role}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
