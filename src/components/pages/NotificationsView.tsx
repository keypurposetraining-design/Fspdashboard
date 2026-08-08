import React, { useState } from "react";
import { mockNotifications, NotificationItem } from "@/data/mockData";
import { NotificationCard } from "@/components/ui/NotificationCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Bell, CheckCheck, Trash2, Filter } from "lucide-react";
import { clsx } from "clsx";

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);
  const [filter, setFilter] = useState<"all" | "unread" | "event" | "task" | "community">("all");

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markSingleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              NOTIFICATION CENTER
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Notifications & Updates
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Stay informed on upcoming workshops, graded assignments, community replies, and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={markAllRead}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {(["all", "unread", "event", "task", "community"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={clsx(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all",
                filter === tab
                  ? "bg-[#0F4CFF] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filtered.length} Notifications
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((notif) => (
          <NotificationCard
            key={notif.id}
            notification={notif}
            onMarkRead={markSingleRead}
          />
        ))}
      </div>
    </div>
  );
};
