"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Search, Check, RefreshCcw } from "lucide-react";

export default function AdminPayments() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchPayments();
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          amount,
          currency,
          status,
          payment_date,
          membership_id,
          members (
            first_name,
            last_name,
            users (
              email
            )
          )
        `);

      if (error) throw error;
      setPayments(data || []);
      setFilteredPayments(data || []);
    } catch (err: any) {
      console.error("Error fetching payments:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search & Filter
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = payments.filter(p => {
      const memberName = `${p.members?.first_name || ""} ${p.members?.last_name || ""}`.toLowerCase();
      const email = p.members?.users?.email?.toLowerCase() || "";
      const matchesSearch = memberName.includes(q) || email.includes(q);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredPayments(filtered);
  }, [searchQuery, statusFilter, payments]);

  const handleUpdateStatus = async (paymentId: string, newStatus: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("payments")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", paymentId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "payment updated",
        table_name: "payments",
        record_id: paymentId,
        performed_by: currentUser?.id,
        details: { status: newStatus }
      });

      // If approved, also activate membership if linked
      const payRecord = payments.find(p => p.id === paymentId);
      if (newStatus === "succeeded" && payRecord?.membership_id) {
        await supabase
          .from("memberships")
          .update({ status: "active", updated_at: new Date().toISOString() })
          .eq("id", payRecord.membership_id);

        await supabase.from("audit_logs").insert({
          action: "membership approved",
          table_name: "memberships",
          record_id: payRecord.membership_id,
          performed_by: currentUser?.id,
          details: { note: "activated via payment approval" }
        });
      }

      await fetchPayments();
    } catch (err: any) {
      alert("Error updating payment: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payments Reconcile</h1>
        <p className="text-sm text-slate-500 font-medium">Record or approve pending manual bank transfer memberships dues payments.</p>
      </div>

      {/* FILTER & SEARCH */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-2 w-full max-w-lg">
            <Input
              placeholder="Search member name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)} className="w-40 border rounded px-2">
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="succeeded">Succeeded</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={fetchPayments} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* PAYMENTS TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading payments ledger...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No payments records found.</div>
          ) : (
            <Table
              columns={[
                { header: "Member", accessor: "member", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "N/A" },
                { header: "Email Address", accessor: "email", render: (row) => row.members?.users?.email || "—" },
                { header: "Amount Due", accessor: "amount", render: (row) => `${Number(row.amount).toFixed(2)} ${row.currency}` },
                { header: "Payment Date", accessor: "payment_date", render: (row) => new Date(row.payment_date).toLocaleDateString() },
                { header: "Status", accessor: "status", render: (row) => (
                  <Badge variant={row.status === "succeeded" ? "success" : row.status === "pending" ? "warning" : "danger"}>
                    {row.status}
                  </Badge>
                ) },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <div className="flex gap-2">
                    {row.status === "pending" && (
                      <>
                        <Button variant="outline" size="xs" onClick={() => handleUpdateStatus(row.id, "succeeded")} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" icon={<Check className="w-3 h-3" />}>
                          Approve
                        </Button>
                        <Button variant="outline" size="xs" onClick={() => handleUpdateStatus(row.id, "failed")} className="border-rose-200 text-rose-600 hover:bg-rose-50">
                          Fail
                        </Button>
                      </>
                    )}
                    {row.status === "succeeded" && (
                      <Button variant="outline" size="xs" onClick={() => handleUpdateStatus(row.id, "refunded")}>
                        Refund
                      </Button>
                    )}
                  </div>
                ) }
              ]}
              data={filteredPayments}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
