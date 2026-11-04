"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Plus, Bell, Send, X, RefreshCcw } from "lucide-react";

export default function AdminNotifications() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("all");
  const [notifType, setNotifType] = useState<any>("info");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [notifsRes, usersRes] = await Promise.all([
        supabase.from("notifications").select("id, type, payload, created_at, users!notifications_user_id_fkey(email)").order("created_at", { ascending: false }).limit(50),
        supabase.from("users").select("id, name, email")
      ]);

      if (notifsRes.error) throw notifsRes.error;
      if (usersRes.error) throw usersRes.error;

      setNotifications(notifsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err: any) {
      console.error("Error loading notifications:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { title, message };

      if (targetUserId === "all") {
        // Send to all users
        const inserts = users.map(u => ({
          user_id: u.id,
          type: notifType,
          payload,
          created_at: new Date().toISOString(),
          created_by: currentUser?.id
        }));

        const { error } = await supabase
          .from("notifications")
          .insert(inserts);

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "notification sent",
          table_name: "notifications",
          record_id: null,
          performed_by: currentUser?.id,
          details: { recipient: "all", title }
        });
      } else {
        // Send to one user
        const { error } = await supabase
          .from("notifications")
          .insert({
            user_id: targetUserId,
            type: notifType,
            payload,
            created_at: new Date().toISOString(),
            created_by: currentUser?.id
          });

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "notification sent",
          table_name: "notifications",
          record_id: null,
          performed_by: currentUser?.id,
          details: { recipient: targetUserId, title }
        });
      }

      setIsSendModalOpen(false);
      setTitle("");
      setMessage("");
      setTargetUserId("all");
      await fetchInitialData();
    } catch (err: any) {
      alert("Error broadcasting notification: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">System Broadcasts</h1>
          <p className="text-sm text-slate-500 font-medium">Broadcast alerts, warning, or information triggers to selected or all FSP members.</p>
        </div>
        <Button size="sm" onClick={() => setIsSendModalOpen(true)} icon={<Send className="w-4 h-4" />}>
          Send Broadcast
        </Button>
      </div>

      {/* RECENT BROADCASTS */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center pb-2">
          <CardTitle className="text-lg font-bold">Recent Sent Notifications</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500">Loading broadcasts...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500">No broadcasts sent yet.</div>
          ) : (
            <Table
              columns={[
                { header: "Type", accessor: "type", render: (row) => (
                  <Badge variant={row.type === "alert" ? "danger" : row.type === "warning" ? "warning" : "primary"}>
                    {row.type}
                  </Badge>
                ) },
                { header: "Recipient", accessor: "user", render: (row) => row.users?.email || "All Users" },
                { header: "Title", accessor: "title", render: (row) => row.payload?.title || "—" },
                { header: "Message", accessor: "message", render: (row) => row.payload?.message || "—" },
                { header: "Sent At", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleString() }
              ]}
              data={notifications}
            />
          )}
        </CardContent>
      </Card>

      {/* SEND MODAL */}
      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsSendModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleSendNotification}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">Broadcast Notification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Recipient Destination</label>
                  <Select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className="w-full border rounded p-2" required>
                    <option value="all">Broadcast to All Users</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Notification Type</label>
                  <Select value={notifType} onChange={e => setNotifType(e.target.value)} className="w-full border rounded p-2" required>
                    <option value="info">Information (Info)</option>
                    <option value="warning">Warning (Warning)</option>
                    <option value="alert">Critical (Alert)</option>
                    <option value="message">Direct Message (Message)</option>
                  </Select>
                </div>
                <Input
                  label="Notification Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Schedule Update"
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Message Body</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Enter short description or body text..."
                    className="flex min-h-[90px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsSendModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? "Sending..." : "Send Broadcast"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
