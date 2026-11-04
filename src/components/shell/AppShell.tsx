"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Sidebar } from "@/components/shell/Sidebar";
import { Header } from "@/components/shell/Header";
import { LogoutModal } from "@/components/layout/LogoutModal";
import { Skeleton } from "@/components/ui/States";
import { EmptyPanel } from "@/components/ui/States";
import { getUnreadCount } from "@/lib/data/member";

interface ShellContextValue {
  unread: number;
  refreshUnread: () => void;
  openLogout: () => void;
}

const ShellContext = createContext<ShellContextValue>({
  unread: 0,
  refreshUnread: () => {},
  openLogout: () => {},
});

export const useShell = () => useContext(ShellContext);

/**
 * Authenticated layout shared by member, admin and super-admin areas.
 * `requireRole` renders an access-denied state for users without the role;
 * this is presentation only — proxy.ts, RLS and the RPCs enforce access.
 */
export function AppShell({
  children,
  requireRole,
}: {
  children: React.ReactNode;
  requireRole?: "admin" | "super_admin";
}) {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const userId = user?.id;

  const refreshUnread = useCallback(() => {
    if (!userId || document.visibilityState === 'hidden') return;
    getUnreadCount(userId)
      .then(setUnread)
      .catch(() => setUnread(0));
  }, [userId]);

  // Refresh the unread badge on sign-in and on navigation.
  useEffect(() => {
    if (userId) refreshUnread();
  }, [userId, pathname, refreshUnread]);
  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(refreshUnread,30000);
    window.addEventListener("focus",refreshUnread);
    return () => { clearInterval(timer); window.removeEventListener("focus",refreshUnread); };
  }, [userId,refreshUnread]);

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  const allowed =
    !requireRole ||
    (requireRole === "admin" && (role === "admin" || role === "super_admin")) ||
    (requireRole === "super_admin" && role === "super_admin");

  return (
    <ShellContext.Provider value={{ unread, refreshUnread, openLogout: () => setLogoutOpen(true) }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <div className="min-h-screen bg-[var(--background)]">
        <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <div className="flex min-h-screen flex-col lg:pl-64">
          <Header onOpenMenu={() => setDrawerOpen(true)} />
          <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {loading || !user ? (
              <div className="space-y-4" role="status" aria-label="Loading">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-80" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              </div>
            ) : allowed ? (
              children
            ) : (
              <EmptyPanel
                icon={<ShieldAlert className="h-6 w-6" />}
                title="You don't have access to this page"
                description="This area is limited to administrators. If you think this is a mistake, contact the FSP team."
                action={{ label: "Back to dashboard", href: "/dashboard" }}
              />
            )}
          </main>
        </div>
      </div>
      <LogoutModal
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false);
          try {
            await logout();
          } finally {
            router.replace("/login");
          }
        }}
      />
    </ShellContext.Provider>
  );
}
