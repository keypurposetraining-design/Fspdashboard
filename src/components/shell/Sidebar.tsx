"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, X } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { ROLE_LABEL } from "@/lib/status";
import { groupsForRole, isActive, SETTINGS_LINK, type NavGroup, type NavLink } from "@/components/shell/nav";
import { useShell } from "@/components/shell/AppShell";

/** Desktop: fixed 16rem column. Mobile/tablet: slide-in drawer (max 20rem, 85% width). */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, role } = useAuth();
  const { openLogout } = useShell();
  const pathname = usePathname();
  const groups = groupsForRole(role);

  // Lock page scroll behind the open drawer; close with Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-[20rem] flex-col border-r border-[var(--card-border)] bg-white transition-transform duration-200 lg:w-64 lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b-[3px] border-[var(--brand-yellow)] px-4">
          <Link href="/dashboard" aria-label="FSP home" className="min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--brand-navy)]">
            <Logo variant="sidebar" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--muted-light)] lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((g) => (
            <NavSection key={g.id} group={g} pathname={pathname} />
          ))}
        </nav>

        <div className="shrink-0 border-t border-[var(--card-border)] p-3">
          {role !== 'admin' && role !== 'super_admin' && <NavItem link={SETTINGS_LINK} active={isActive(SETTINGS_LINK, pathname)} />}
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-[var(--muted-light)]/70 p-2.5">
            <MemberAvatar src={user?.avatar_url} name={user?.name ?? user?.email ?? ""} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">{user?.name || "Member"}</p>
              <p className="truncate text-xs text-[var(--muted)]">{user?.email}</p>
              <p className="text-[11px] font-medium text-[var(--brand-navy)]">{ROLE_LABEL[role ?? "member"]}</p>
            </div>
            <button
              type="button"
              onClick={openLogout}
              className="rounded-lg p-2 text-[var(--muted)] hover:bg-white hover:text-red-600"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavSection({ group, pathname }: { group: NavGroup; pathname: string }) {
  const containsActive = group.links.some((l) => isActive(l, pathname));
  const [expanded, setExpanded] = useState(!group.collapsible || containsActive);
  const listId = `nav-${group.id}`;

  return (
    <div>
      {group.label &&
        (group.collapsible ? (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded || containsActive}
            aria-controls={listId}
            className="mb-1 flex w-full items-center justify-between rounded-md px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            {group.label}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", (expanded || containsActive) && "rotate-180")} />
          </button>
        ) : (
          <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {group.label}
          </p>
        ))}
      {(expanded || containsActive) && (
        <ul id={listId} className="space-y-0.5">
          {group.links.map((l) => (
            <li key={l.href}>
              <NavItem link={l} active={isActive(l, pathname)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NavItem({ link, active }: { link: NavLink; active: boolean }) {
  const { unread } = useShell();
  const Icon = link.icon;
  const badge = link.badge === "notifications" && unread > 0 ? unread : null;
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)]",
        active
          ? "bg-[var(--brand-navy)] text-white fsp-rail"
          : "text-slate-600 hover:bg-[var(--muted-light)] hover:text-[var(--foreground)]"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
      <span className="flex-1 truncate">{link.label}</span>
      {badge !== null && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            active ? "bg-white text-[var(--brand-navy)]" : "bg-[var(--brand-gold)] text-[var(--brand-navy)]"
          )}
          aria-label={`${badge} unread`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
