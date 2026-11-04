"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, CornerDownLeft, LogOut, Menu, Pencil, Search, Settings, User, UserSearch } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { ROLE_LABEL } from "@/lib/status";
import { groupsForRole, SETTINGS_LINK } from "@/components/shell/nav";
import { useShell } from "@/components/shell/AppShell";
import { getMyNotifications, markAllNotificationsRead } from "@/lib/data/member";
import { formatRelative } from "@/components/ui/Timeline";
import type { AppNotification } from "@/lib/data/types";

/** Closes a popover on outside click or Escape. */
function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b-[3px] border-[var(--brand-yellow)] bg-white/95 px-3 backdrop-blur sm:gap-3 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-[var(--muted-light)] lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link href="/dashboard" className="lg:hidden" aria-label="FSP home">
        <Logo variant="icon" size="sm" />
      </Link>
      <GlobalSearch />
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <UserMenu />
      </div>
    </header>
  );
}

/**
 * Finds pages the user can open (filtered by role). Admins can also jump to a
 * member search. It never queries data the user couldn't otherwise see.
 */
function GlobalSearch() {
  const { role } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const ref = useDismiss(open, () => setOpen(false));
  const isAdmin = role === "admin" || role === "super_admin";

  const results = useMemo(() => {
    const pages = [...groupsForRole(role).flatMap((g) => g.links.map((l) => ({ ...l, group: g.label ?? "Main" }))), { ...SETTINGS_LINK, group: "Account" }];
    const term = q.trim().toLowerCase();
    const matched = term
      ? pages.filter((p) => p.label.toLowerCase().includes(term) || p.group.toLowerCase().includes(term))
      : pages.slice(0, 6);
    const items: { key: string; label: string; hint: string; href: string; icon: React.ComponentType<{ className?: string }> }[] =
      matched.slice(0, 8).map((p) => ({ key: p.href, label: p.label, hint: p.group, href: p.href, icon: p.icon }));
    if (isAdmin && term) {
      items.unshift({
        key: "member-search",
        label: `Search members for “${q.trim()}”`,
        hint: "Admin",
        href: `/admin/members?q=${encodeURIComponent(q.trim())}`,
        icon: UserSearch,
      });
    }
    return items;
  }, [q, role, isAdmin]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={ref} className="relative hidden w-full max-w-md sm:block">
      <label htmlFor="global-search" className="sr-only">
        Search pages{isAdmin ? " and members" : ""}
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id="global-search"
        type="search"
        role="combobox"
        aria-expanded={open}
        aria-controls="global-search-results"
        autoComplete="off"
        value={q}
        placeholder={isAdmin ? "Search pages or members…" : "Search pages…"}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQ(e.target.value);
          setCursor(0);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(c + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(c - 1, 0));
          } else if (e.key === "Enter" && results[cursor]) {
            e.preventDefault();
            go(results[cursor].href);
          }
        }}
        className="h-10 w-full rounded-xl border border-[var(--card-border)] bg-[var(--muted-light)]/60 pl-9 pr-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]"
      />
      {open && results.length > 0 && (
        <ul
          id="global-search-results"
          role="listbox"
          className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-[var(--card-border)] bg-white py-1 shadow-lg"
        >
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <li key={r.key} role="option" aria-selected={i === cursor}>
                <button
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(r.href)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-2 text-left text-sm",
                    i === cursor ? "bg-[var(--muted-light)]" : ""
                  )}
                >
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="flex-1 truncate text-[var(--foreground)]">{r.label}</span>
                  <span className="text-xs text-[var(--muted)]">{r.hint}</span>
                  {i === cursor && <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NotificationBell() {
  const { unread, refreshUnread } = useShell();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [failed, setFailed] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  useEffect(() => {
    if (!open) return;
    let active = true;
    void getMyNotifications(6).then(rows => { if (active) { setItems(rows); setFailed(false); } }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [open,unread]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setFailed(false);
      getMyNotifications(6)
        .then(setItems)
        .catch(() => setFailed(true));
    }
  };

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      setItems((xs) => xs?.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })) ?? null);
      refreshUnread();
    } catch {
      setFailed(true);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative rounded-xl p-2.5 text-slate-600 hover:bg-[var(--muted-light)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed inset-x-3 top-16 z-40 rounded-xl border border-[var(--card-border)] bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-[var(--card-border)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-medium text-[var(--brand-navy)] hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {failed ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">We couldn&apos;t load notifications.</p>
            ) : items === null ? (
              <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">You&apos;re all caught up.</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.payload?.link || "/notifications"}
                      onClick={() => setOpen(false)}
                      className="flex gap-3 border-b border-[var(--card-border)] px-4 py-3 last:border-0 hover:bg-[var(--muted-light)]/60"
                    >
                      <span
                        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-[var(--brand-navy)]")}
                        aria-label={n.read_at ? undefined : "Unread"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                          {n.payload?.title || "Notification"}
                        </span>
                        {n.payload?.message && (
                          <span className="line-clamp-2 block text-xs text-[var(--muted)]">{n.payload.message}</span>
                        )}
                        <span className="mt-0.5 block text-[11px] text-[var(--muted)]">{formatRelative(n.created_at)}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--card-border)] px-4 py-3 text-center text-sm font-medium text-[var(--brand-navy)] hover:bg-[var(--muted-light)]/60"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { user, role } = useAuth();
  const { openLogout } = useShell();
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));

  const items = [
    { href: role === 'admin' || role === 'super_admin' ? "/admin/account/profile" : "/profile", label: "Profile", icon: User },
    { href: role === 'admin' || role === 'super_admin' ? "/admin/account/profile/edit" : "/profile/edit", label: "Edit Profile", icon: Pencil },
    { href: role === 'admin' || role === 'super_admin' ? "/admin/account" : "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-[var(--muted-light)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]"
      >
        <MemberAvatar src={user?.avatar_url} name={user?.name ?? user?.email ?? ""} size={32} />
        <span className="hidden text-left md:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold text-[var(--foreground)]">
            {user?.name || "Member"}
          </span>
          <span className="block text-[11px] text-[var(--muted)]">{ROLE_LABEL[role ?? "member"]}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-[var(--card-border)] bg-white py-1 shadow-lg">
          <div className="border-b border-[var(--card-border)] px-4 py-3">
            <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user?.name || "Member"}</p>
            <p className="truncate text-xs text-[var(--muted)]">{user?.email}</p>
          </div>
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted-light)]"
            >
              <it.icon className="h-4 w-4 text-slate-400" />
              {it.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              openLogout();
            }}
            className="flex w-full items-center gap-3 border-t border-[var(--card-border)] px-4 py-2 text-sm text-red-600 hover:bg-[var(--danger-light)]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
