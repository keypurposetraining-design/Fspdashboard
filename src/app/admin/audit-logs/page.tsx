"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Shield, Eye, RefreshCcw } from "lucide-react";

export default function AdminAuditLogs() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          table_name,
          record_id,
          performed_at,
          performed_by,
          details,
          users (
            name,
            email
          )
        `)
        .order("performed_at", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (err: any) {
      console.error("Error loading audit logs:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = logs.filter(l => 
      (l.action || "").toLowerCase().includes(q) || 
      (l.table_name || "").toLowerCase().includes(q) ||
      (l.users?.email || "").toLowerCase().includes(q)
    );
    setFilteredLogs(filtered);
  }, [searchQuery, logs]);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Logs Ledger</h1>
          <p className="text-sm text-slate-500 font-medium">Trace all critical administrative edits, membership modifications, and grading records.</p>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by action, table, or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchAuditLogs} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* LEDGER TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Retrieving system ledger...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No system operations logged.</div>
          ) : (
            <Table
              columns={[
                { header: "Operation Action", accessor: "action", render: (row) => (
                  <Badge variant={row.action.includes("deleted") || row.action.includes("revoked") ? "danger" : "neutral"}>
                    {row.action}
                  </Badge>
                ) },
                { header: "Target Table", accessor: "table_name" },
                { header: "Record ID Reference", accessor: "record_id", render: (row) => <span className="font-mono text-xs block truncate max-w-xs">{row.record_id || "—"}</span> },
                { header: "Invoked By", accessor: "user", render: (row) => row.users ? `${row.users.name || ""} (${row.users.email})` : row.performed_by || "System Trigger" },
                { header: "Logged At", accessor: "performed_at", render: (row) => new Date(row.performed_at).toLocaleString() },
                { header: "Details (JSON)", accessor: "details", render: (row) => (
                  <Button variant="outline" size="xs" onClick={() => setSelectedLog(row)} icon={<Eye className="w-3 h-3" />}>
                    Payload
                  </Button>
                ) }
              ]}
              data={filteredLogs}
            />
          )}
        </CardContent>
      </Card>

      {/* JSON VIEW MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setSelectedLog(null)}>
              <span className="text-xl font-bold">×</span>
            </button>
            <CardHeader className="p-0 pb-4 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0F4CFF]" />
                Audit Logs Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Operation Action</span>
                <span className="text-sm font-semibold text-slate-900 mt-0.5 block">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Mutation Details Payload</span>
                <pre className="mt-2 text-xs bg-slate-50 border border-slate-100 p-4 rounded-xl font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap max-h-[220px]">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
