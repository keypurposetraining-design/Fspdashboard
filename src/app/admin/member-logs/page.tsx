"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RefreshCcw, Search, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminMemberLogs() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [count, setCount] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [activityType, setActivityType] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // desc = Newest First, asc = Oldest First

  // Pagination States
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, activityType, sortOrder]);

  async function fetchLogs() {
    try {
      setLoading(true);
      const startRange = (page - 1) * pageSize;
      const endRange = startRange + pageSize - 1;

      // Base query
      let query = supabase
        .from("member_activity_logs")
        .select(`
          id,
          action,
          ip_address,
          user_agent,
          metadata,
          created_at,
          members (
            first_name,
            last_name,
            users (
              email
            )
          )
        `, { count: "exact" });

      // Apply Activity Type filter
      if (activityType) {
        query = query.eq("action", activityType);
      }

      // Apply Search Filter (Since database joins cannot be easily searched client-side, we do simple filter or query)
      // Note: Supabase doesn't easily support querying across relation tables with standard search.
      // We will perform local filtering on the search term, or load names if search is empty.
      // To keep it robust, we'll fetch the logs, apply sorting, and handle search.
      
      // Sort Order
      query = query.order("created_at", { ascending: sortOrder === "asc" });

      // Range Pagination
      query = query.range(startRange, endRange);

      const { data, count: totalCount, error } = await query;
      if (error) throw error;

      setLogs(data || []);
      setCount(totalCount || 0);
    } catch (err: any) {
      console.error("Error loading activity logs:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Filtered client side search to allow search by first_name/last_name/email
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const firstName = log.members?.first_name || "";
    const lastName = log.members?.last_name || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const email = log.members?.users?.email || "";
    const action = log.action || "";
    
    return fullName.includes(term) || email.includes(term) || action.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(count / pageSize) || 1;

  const activityOptions = [
    "AUTH_LOGIN",
    "AUTH_LOGOUT",
    "AUTH_LOGIN_FAILED",
    "PROFILE_VIEW",
    "PROFILE_UPDATE",
    "MEMBERSHIP_VIEW",
    "COURSE_VIEW",
    "COURSE_ENROLL",
    "TASK_VIEW",
    "TASK_SUBMISSION",
    "TASK_RESUBMISSION",
    "EVENT_VIEW",
    "EVENT_REGISTER",
    "EVENT_CANCEL",
    "PAYMENT_VIEW",
    "PAYMENT_RENEWAL_REQUEST",
    "CERTIFICATE_VIEW",
    "CERTIFICATE_DOWNLOAD",
    "RESOURCE_VIEW",
    "RESOURCE_DOWNLOAD",
    "NOTIFICATION_VIEW",
    "NOTIFICATION_READ",
    "COMMUNITY_POST"
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Member Activity History Logs
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Reconcile, audit, and inspect user activity metrics from the member portal.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh logs
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search member, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-xl w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Select value={activityType} onChange={e => { setActivityType(e.target.value); setPage(1); }} className="w-full text-xs">
            <option value="">All Activity Types</option>
            {activityOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </Select>

          <Select value={sortOrder} onChange={e => { setSortOrder(e.target.value); setPage(1); }} className="w-full text-xs">
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </Select>

          <div className="flex items-center text-xs font-bold text-slate-500 justify-end">
            Total records: {count}
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading history logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No activity records match filters.</div>
          ) : (
            <Table
              columns={[
                {
                  header: "Member Name",
                  accessor: "name",
                  render: (log: any) => log.members ? `${log.members.first_name || ""} ${log.members.last_name || ""}` : "Anonymous User"
                },
                {
                  header: "Email",
                  accessor: "email",
                  render: (log: any) => log.members?.users?.email || "—"
                },
                {
                  header: "Activity",
                  accessor: "action",
                  render: (log: any) => (
                    <Badge variant={log.action.includes("FAILED") ? "danger" : log.action.includes("AUTH") ? "success" : "primary"}>
                      {log.action}
                    </Badge>
                  )
                },
                {
                  header: "IP Address",
                  accessor: "ip_address",
                  render: (log: any) => <span className="font-mono text-[10px] text-slate-500">{log.ip_address || "—"}</span>
                },
                {
                  header: "Date/Time",
                  accessor: "created_at",
                  render: (log: any) => new Date(log.created_at).toLocaleString()
                },
                {
                  header: "Actions",
                  accessor: "actions",
                  render: (log: any) => (
                    <Button variant="ghost" size="xs" onClick={() => setSelectedLog(log)} icon={<Eye className="w-3.5 h-3.5" />}>
                      Inspect
                    </Button>
                  )
                }
              ]}
              data={filteredLogs}
            />
          )}
        </CardContent>
      </Card>

      {/* Pagination Footer */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-semibold">
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} icon={<ChevronLeft className="w-4 h-4" />}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} icon={<ChevronRight className="w-4 h-4" />}>
            Next
          </Button>
        </div>
      </div>

      {/* INSPECT LOG DETAIL DIALOG */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative rounded-3xl">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setSelectedLog(null)}>
              <X className="w-5 h-5" />
            </button>
            <CardHeader className="p-0 pb-4 border-b">
              <CardTitle className="text-lg font-bold">Activity Detail Inspector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500 font-bold block">Member Name</span>
                  <span className="text-slate-900 font-semibold">{selectedLog.members ? `${selectedLog.members.first_name || ""} ${selectedLog.members.last_name || ""}` : "Anonymous"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Email Address</span>
                  <span className="text-slate-900 font-semibold">{selectedLog.members?.users?.email || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Activity Action</span>
                  <span className="text-slate-900 font-semibold">
                    <Badge>{selectedLog.action}</Badge>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Registered Timestamp</span>
                  <span className="text-slate-900 font-semibold">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Client IP Address</span>
                  <span className="text-slate-900 font-semibold font-mono">{selectedLog.ip_address || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-bold block">User Agent Header</span>
                  <span className="text-slate-700 block truncate" title={selectedLog.user_agent}>{selectedLog.user_agent || "—"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-bold block mb-1">Payload Metadata</span>
                  <pre className="p-3 bg-slate-50 border rounded-xl font-mono text-[10px] overflow-auto max-h-[150px]">
                    {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end pt-4 border-t mt-4">
              <Button size="sm" onClick={() => setSelectedLog(null)}>
                Close Inspector
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
