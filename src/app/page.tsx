"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { LogoutModal } from "@/components/layout/LogoutModal";

// Import all 10 Page Views
import { DashboardView } from "@/components/pages/DashboardView";
import { MembershipView } from "@/components/pages/MembershipView";
import { TasksView } from "@/components/pages/TasksView";
import { EventsView } from "@/components/pages/EventsView";
import { PaymentsView } from "@/components/pages/PaymentsView";
import { CertificatesView } from "@/components/pages/CertificatesView";
import { CommunityView } from "@/components/pages/CommunityView";
import { NotificationsView } from "@/components/pages/NotificationsView";
import { ProfileView } from "@/components/pages/ProfileView";
import { SettingsView } from "@/components/pages/SettingsView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  const handleSelectTab = (tabId: string) => {
    if (tabId === "logout") {
      setIsLogoutModalOpen(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const renderCurrentView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView onNavigate={handleSelectTab} />;
      case "membership":
        return <MembershipView />;
      case "tasks":
        return <TasksView />;
      case "events":
        return <EventsView />;
      case "payments":
        return <PaymentsView />;
      case "certificates":
        return <CertificatesView />;
      case "community":
        return <CommunityView />;
      case "notifications":
        return <NotificationsView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView onNavigate={handleSelectTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Left Sidebar Navigation (Desktop & Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={isOpenMobile}
        onCloseMobile={() => setIsOpenMobile(false)}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      {/* Main Content Workspace Wrapper */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 transition-all duration-200">
        {/* Top Navigation Bar */}
        <TopNav
          activeTab={activeTab}
          onNavigate={handleSelectTab}
          onToggleMobileSidebar={() => setIsOpenMobile(true)}
          unreadNotificationsCount={2}
        />

        {/* Dynamic Page View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderCurrentView()}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          setActiveTab("dashboard");
        }}
      />
    </div>
  );
}
