"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BadgeCheck, Bell, BellOff, CheckCheck, FileText, FolderOpen } from "lucide-react";
import { useAsync } from "@/lib/useAsync";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/data/member";
import { toDataError } from "@/lib/data/errors";
import type { AppNotification, NotificationCategory } from "@/lib/data/types";
import type { Tone } from "@/lib/status";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyPanel, ErrorState, LoadingState } from "@/components/ui/States";
import { TabBar, TabPanel, type TabItem } from "@/components/ui/TabBar";
import { TONE_ICON_CLASSES } from "@/components/ui/StatusBadge";
import { formatDate, formatRelative } from "@/components/ui/Timeline";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useShell } from "@/components/shell/AppShell";
import { notificationCategory } from "@/components/member/workflow";

type TabKey = "all" | "unread" | NotificationCategory;

const CATEGORY_TABS: { key: NotificationCategory; label: string }[] = [
  { key: "membership", label: "Membership" },
  { key: "application", label: "Application" },
  { key: "documents", label: "Documents" },
  { key: "system", label: "System" },
];

const EMPTY_TEXT: Record<TabKey, string> = {
  all: "You're all caught up.",
  unread: "No unread notifications. You're all caught up.",
  membership: "No membership notifications yet.",
  application: "No application notifications yet.",
  documents: "No document notifications yet.",
  system: "No system notifications yet.",
};

const CATEGORY_ICON: Record<NotificationCategory, React.ComponentType<{ className?: string }>> = {
  membership: BadgeCheck,
  application: FileText,
  documents: FolderOpen,
  system: Bell,
};

function iconFor(n: AppNotification): { Icon: React.ComponentType<{ className?: string }>; tone: Tone } {
  if (n.type === "alert") return { Icon: AlertTriangle, tone: "danger" };
  if (n.type === "warning") return { Icon: AlertTriangle, tone: "warning" };
  return { Icon: CATEGORY_ICON[notificationCategory(n)] ?? Bell, tone: n.read_at ? "neutral" : "info" };
}

/** Only follow in-app paths from notification payloads. */
const safeLink = (link: string | undefined) => (link && link.startsWith("/") && !link.startsWith("//") ? link : null);

export default function NotificationsPage() {
  const router = useRouter();
  const toast = useToast();
  const { refreshUnread } = useShell();
  const { data, error, loading, reload, setData } = useAsync(() => getMyNotifications(), []);
  const [tab, setTab] = useState<TabKey>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const items = data ?? [];
  const unreadCount = items.filter((n) => !n.read_at).length;

  const markLocal = (ids: string[] | "all") => {
    const now = new Date().toISOString();
    setData((prev) =>
      (prev ?? []).map((n) => (!n.read_at && (ids === "all" || ids.includes(n.id)) ? { ...n, read_at: now } : n))
    );
  };

  const markRead = async (n: AppNotification) => {
    if (n.read_at) return true;
    setBusyId(n.id);
    try {
      await markNotificationRead(n.id);
      markLocal([n.id]);
      refreshUnread();
      return true;
    } catch (e) {
      toast(toDataError(e, "markNotificationRead").message, "error");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const markAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      markLocal("all");
      refreshUnread();
      toast("All notifications marked as read");
    } catch (e) {
      toast(toDataError(e, "markAllNotificationsRead").message, "error");
    } finally {
      setMarkingAll(false);
    }
  };

  const open = async (n: AppNotification) => {
    const link = safeLink(n.payload?.link);
    if (!link) return;
    await markRead(n);
    router.push(link);
  };

  const header = (
    <PageHeader
      title="Notifications"
      description="Updates about your membership, application and documents."
      actions={
        data && unreadCount > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={markAll}
            disabled={markingAll}
            icon={<CheckCheck className="h-4 w-4" aria-hidden="true" />}
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </Button>
        ) : undefined
      }
    />
  );

  if (loading && !data) return <>{header}<LoadingState variant="list" label="Loading notifications" /></>;
  if (error || !data)
    return (
      <>
        {header}
        <ErrorState error={error} title="We couldn't load your notifications" onRetry={reload} />
      </>
    );

  const tabs: TabItem<TabKey>[] = [
    { key: "all", label: "All", count: items.length },
    { key: "unread", label: "Unread", count: unreadCount },
    ...CATEGORY_TABS.map((c) => ({
      key: c.key as TabKey,
      label: c.label,
      count: items.filter((n) => notificationCategory(n) === c.key).length,
    })),
  ];

  const visible = items.filter((n) =>
    tab === "all" ? true : tab === "unread" ? !n.read_at : notificationCategory(n) === tab
  );

  return (
    <>
      {header}
      <TabBar tabs={tabs} active={tab} onChange={setTab} label="Filter notifications" idPrefix="notif" />
      <TabPanel idPrefix="notif" activeKey={tab}>
        {visible.length === 0 ? (
          <EmptyPanel icon={<BellOff className="h-6 w-6" />} title={EMPTY_TEXT[tab]} compact />
        ) : (
          <ul className="space-y-3">
            {visible.map((n) => {
              const { Icon, tone } = iconFor(n);
              const unread = !n.read_at;
              const link = safeLink(n.payload?.link);
              const title = n.payload?.title || "Notification";
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-3 rounded-2xl border p-4 transition-colors",
                    unread
                      ? "border-[var(--info-border)] bg-[var(--info-light)]/50"
                      : "border-[var(--card-border)] bg-[var(--card-bg)]"
                  )}
                >
                  <span
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", TONE_ICON_CLASSES[tone])}
                    aria-hidden="true"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-sm font-semibold text-[var(--foreground)]">
                        {unread && (
                          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--brand-navy)] align-middle" aria-hidden="true" />
                        )}
                        {link ? (
                          <button
                            type="button"
                            onClick={() => open(n)}
                            disabled={busyId === n.id}
                            className="text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-navy)] rounded"
                          >
                            {title}
                          </button>
                        ) : (
                          title
                        )}
                        {unread && <span className="sr-only"> (unread)</span>}
                      </h2>
                      <time
                        className="shrink-0 text-xs text-[var(--muted)]"
                        dateTime={n.created_at}
                        title={formatDate(n.created_at, true)}
                      >
                        {formatRelative(n.created_at)}
                      </time>
                    </div>
                    {n.payload?.message && <p className="mt-1 text-sm text-slate-700">{n.payload.message}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {link && (
                        <Button variant="ghost" size="xs" className="text-xs text-[var(--brand-navy)]" onClick={() => open(n)} disabled={busyId === n.id}>
                          View details
                        </Button>
                      )}
                      {unread && (
                        <Button
                          variant="ghost"
                          size="xs"
                          className="text-xs"
                          onClick={() => markRead(n)}
                          disabled={busyId === n.id}
                          icon={<CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </TabPanel>
    </>
  );
}
