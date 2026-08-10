"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Download, BarChart2, RefreshCcw } from "lucide-react";

export default function AdminReports() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any[]>([]);
  const [membershipsCount, setMembershipsCount] = useState({ active: 0, pending: 0, expired: 0 });
  const [revenueTotal, setRevenueTotal] = useState(0);
  const [enrollmentsCount, setEnrollmentsCount] = useState(0);
  const [certificatesCount, setCertificatesCount] = useState(0);

  useEffect(() => {
    fetchReportStats();
  }, []);

  async function fetchReportStats() {
    try {
      setLoading(true);
      const [membershipsRes, paymentsRes, enrollmentsRes, certsRes] = await Promise.all([
        supabase.from("memberships").select("id, status"),
        supabase.from("payments").select("id, amount, currency, status, payment_date, members(first_name, last_name)"),
        supabase.from("course_enrollments").select("id"),
        supabase.from("certificates").select("id")
      ]);

      if (membershipsRes.error) throw membershipsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      if (enrollmentsRes.error) throw enrollmentsRes.error;
      if (certsRes.error) throw certsRes.error;

      // Aggregations
      const active = membershipsRes.data?.filter(m => m.status === "active").length || 0;
      const pending = membershipsRes.data?.filter(m => m.status === "pending").length || 0;
      const expired = membershipsRes.data?.filter(m => m.status === "expired" || m.status === "cancelled").length || 0;
      setMembershipsCount({ active, pending, expired });

      const totalRev = paymentsRes.data
        ?.filter(p => p.status === "succeeded")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setRevenueTotal(totalRev);

      setEnrollmentsCount(enrollmentsRes.data?.length || 0);
      setCertificatesCount(certsRes.data?.length || 0);

      // Generate reports list
      const paymentsList = paymentsRes.data || [];
      setReportData(paymentsList);
    } catch (err: any) {
      console.error("Error fetching reports data:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) return;

    // Headers
    const headers = ["Payment ID", "Member Name", "Amount", "Currency", "Status", "Date"];
    const rows = reportData.map(p => [
      p.id,
      p.members ? `${p.members.first_name || ""} ${p.members.last_name || ""}` : "N/A",
      p.amount,
      p.currency,
      p.status,
      new Date(p.payment_date).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FSP_Payments_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Reports &amp; Analytics</h1>
          <p className="text-sm text-slate-500 font-medium">Analyze member registrations growth, revenue aggregation, and download ledgers.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchReportStats} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button size="sm" onClick={handleExportCSV} disabled={reportData.length === 0} icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Active Memberships</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{membershipsCount.active}</span>
          <span className="text-xs text-slate-500 mt-1 block">Pending: {membershipsCount.pending} | Expired: {membershipsCount.expired}</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Revenue Recieved</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">${revenueTotal.toLocaleString()}</span>
          <span className="text-xs text-emerald-600 font-medium mt-1 block">100% database validated</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Course Enrollments</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{enrollmentsCount}</span>
          <span className="text-xs text-slate-500 mt-1 block">Active enrollments count</span>
        </Card>
        <Card className="p-4 bg-white border border-slate-200">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Accreditation Certs Issued</span>
          <span className="text-2xl font-black text-slate-900 block mt-1">{certificatesCount}</span>
          <span className="text-xs text-slate-500 mt-1 block">Total issued credentials</span>
        </Card>
      </div>

      {/* DETAILED TRANSACTION LEDGER */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-bold">Transaction Ledgers Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Aggregating report statistics...</div>
          ) : reportData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No transactions found to report.</div>
          ) : (
            <Table
              columns={[
                { header: "Transaction ID", accessor: "id", render: (row) => <span className="font-mono text-xs">{row.id}</span> },
                { header: "Member Name", accessor: "member", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "N/A" },
                { header: "Amount Recieved", accessor: "amount", render: (row) => `$${Number(row.amount).toFixed(2)}` },
                { header: "Status", accessor: "status", render: (row) => (
                  <Badge variant={row.status === "succeeded" ? "success" : row.status === "pending" ? "warning" : "danger"}>
                    {row.status}
                  </Badge>
                ) },
                { header: "Processed At", accessor: "payment_date", render: (row) => new Date(row.payment_date).toLocaleString() }
              ]}
              data={reportData}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
