"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { CreditCard, Download, FileText, RefreshCcw, Send, Check } from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const PaymentsView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [member, setMember] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);

  // Renewal Form
  const [amount, setAmount] = useState("3000");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  async function fetchInitialData() {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch member
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (memberData) {
        setMember(memberData);

        // Fetch payments
        const { data: payData, error: payErr } = await supabase
          .from("payments")
          .select("*")
          .eq("member_id", memberData.id)
          .order("payment_date", { ascending: false });
        if (payErr) throw payErr;
        setPayments(payData || []);

        // Fetch membership
        const { data: memData } = await supabase
          .from("memberships")
          .select("*")
          .eq("member_id", memberData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setMembership(memData);

        await logMemberActivity("PAYMENT_VIEW");
      }
    } catch (err: any) {
      console.error("Error fetching payments history:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleRequestRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    try {
      setSubmitting(true);
      setSuccessMsg("");

      // Insert pending payment record
      const { error } = await supabase
        .from("payments")
        .insert({
          member_id: member.id,
          membership_id: membership?.id || null,
          amount: parseFloat(amount),
          currency: "INR",
          status: "pending",
          payment_date: new Date().toISOString()
        });

      if (error) throw error;
      await logMemberActivity("PAYMENT_RENEWAL_REQUEST", { amount: parseFloat(amount) });
      setSuccessMsg("Renewal receipt submitted! Administrative team will reconcile shortly.");
      await fetchInitialData();
    } catch (err: any) {
      alert("Error submitting renewal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Payments &amp; Subscription
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Submit bank transfer receipts for membership renewal verification, and view previous transactions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Submit Bank Receipt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#0F4CFF]" />
              Submit Renewal Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestRenewal} className="space-y-4">
              <Input
                label="Amount Paid (INR)"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
              <div className="text-xs text-slate-500 font-medium leading-relaxed">
                Bank Transfer Details:<br />
                <strong>Bank Name:</strong> Guild Facilitators Bank of India<br />
                <strong>Account Number:</strong> 9876543210<br />
                <strong>IFSC Code:</strong> GFBI0001928
              </div>

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {successMsg}
                </div>
              )}

              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Receipt Proof"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF7A00]" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-medium">
            <div>
              <span className="text-xs text-slate-400 block">MEMBERSHIP PLAN</span>
              <span className="text-slate-800 block text-lg font-bold">Annual Guild Access</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">CURRENT STATUS</span>
              <span className="mt-1 block">
                <Badge variant={membership?.status === "active" ? "success" : "warning"}>
                  {membership?.status || "Pending Verification"}
                </Badge>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Receipts &amp; Payments History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-6 text-center text-slate-500">Loading ledgers...</div>
          ) : payments.length === 0 ? (
            <div className="py-6 text-center text-slate-500">No payment receipts logged.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                    <th className="p-3.5 rounded-l-xl">Transaction ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5 rounded-r-xl text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-[#0F4CFF] truncate max-w-xs">{pay.id}</td>
                      <td className="p-3.5 text-slate-600">{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td className="p-3.5 font-bold text-slate-900">{pay.amount} {pay.currency}</td>
                      <td className="p-3.5 text-right">
                        <Badge variant={pay.status === "succeeded" ? "success" : pay.status === "pending" ? "warning" : "danger"} size="sm">
                          {pay.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
