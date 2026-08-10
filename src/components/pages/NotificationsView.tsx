"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NotificationCard } from "@/components/ui/NotificationCard";
import { Bell, CheckCheck, RefreshCcw } from "lucide-react";
import { clsx } from "clsx";
import { logMemberActivity } from "@/lib/activity-log";

export const NotificationsView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data || []);

      await logMemberActivity("NOTIFICATION_VIEW");
    } catch (err: any) {
      console.error("Error fetching user notifications:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const markAllRead = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .is("read_at", null);

      if (error) throw error;
      await fetchNotifications();
    } catch (err: any) {
      alert("Error marking read: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      await logMemberActivity("NOTIFICATION_READ", { notification_id: id });
      await fetchNotifications();
    } catch (err: any) {
      alert("Error marking read: " + err.message);
    }
  };

  const mappedNotifications = notifications.map(n => ({
    id: n.id,
    title: n.payload?.title || "Notification",
    message: n.payload?.message || "",
    timestamp: new Date(n.created_at).toLocaleString(),
    type: n.type,
    isRead: n.read_at !== null
  }));

  const filtered = mappedNotifications.filter((n) => {
    if (filter === "all") return true;
    return !n.isRead;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              NOTIFICATION CENTER
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Notifications &amp; Updates
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Stay informed on upcoming workshops, graded assignments, community replies, and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchNotifications} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={markAllRead}>
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {(["all", "unread"] as const).map((tab) => (
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
      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">Loading notifications...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500 border border-dashed rounded-3xl bg-white">
          No notifications found in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif as any}
              onMarkRead={markSingleRead}
            />
          ))}
        </div>
      )}
    </div>
  );
};
