"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { logMemberActivity } from "@/lib/activity-log";
import { useAuth } from "@/lib/auth";
import { toDataError } from "@/lib/data/errors";
import type { Membership } from "@/lib/data/types";
import { PaymentRow, PersonRow, errorMessage } from "@/lib/legacy-rows";
import { createClient } from "@/lib/supabase/client";
import { Check, CreditCard, FileText, RefreshCcw } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

export const PaymentsView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [member, setMember] = useState<PersonRow | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);

  // Renewal Form
  const [amount, setAmount] = useState("3000");
  const [renewalFee, setRenewalFee] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Load the configured renewal fee (admin-editable via app_settings)
  useEffect(() => {
    let cancelled = false;
    async function loadRenewalFee() {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "renewal_fee")
        .maybeSingle();
      if (cancelled || !data?.value) return;
      const fee = Number(data.value.amount);
      if (!isNaN(fee)) {
        setRenewalFee(fee);
        setAmount(String(fee));
      }
    }
    loadRenewalFee();
    return () => { cancelled = true; };
  }, [supabase]);

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true); setLoadError(null);
      // Fetch member
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (memberData) {
        setMember((memberData) as unknown as PersonRow | null);

        // Fetch payments
        const { data: payData, error: payErr } = await supabase
          .from("payments")
          .select("*")
          .eq("member_id", memberData.id)
          .order("payment_date", { ascending: false });
        if (payErr) throw payErr;
        setPayments((payData || []) as unknown as PaymentRow[]);

        // Fetch membership
        const { data: memData } = await supabase
          .from("memberships")
          .select("*")
          .eq("member_id", memberData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setMembership((memData) as unknown as Membership | null);

        await logMemberActivity("PAYMENT_VIEW");
      }
    } catch (err: unknown) {
      setLoadError(toDataError(err, "payments").message);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      fetchInitialData();
    });
    return () => { cancelled = true; };
  }, [fetchInitialData]);

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
    } catch (err: unknown) {
      alert("Error submitting renewal: " + errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="fsp-dot text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Payments &amp; Subscription
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
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
              <CreditCard className="w-5 h-5 text-[var(--brand-navy)]" />
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
              {renewalFee != null && (
                <p className="text-xs text-[var(--muted)] font-medium">
                  Annual renewal fee: <strong className="text-[var(--foreground)]">₹{renewalFee.toFixed(2)}</strong>
                </p>
              )}
              <div className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                Bank Transfer Details:<br />
                <strong>Bank Name:</strong> Guild Facilitators Bank of India<br />
                <strong>Account Number:</strong> 9876543210<br />
                <strong>IFSC Code:</strong> GFBI0001928
              </div>

              {successMsg && (
                <div className="p-3 bg-[var(--success-light)] border border-[var(--success-border)] rounded-xl text-[var(--success)] text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-[var(--success)]" />
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
              <FileText className="w-5 h-5 text-[var(--brand-gold)]" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm font-medium">
            <div>
              <span className="text-xs text-[var(--muted)] block">MEMBERSHIP PLAN</span>
              <span className="text-[var(--foreground)] block text-lg font-bold">Annual Guild Access</span>
            </div>
            <div>
              <span className="text-xs text-[var(--muted)] block">CURRENT STATUS</span>
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
      {loadError && <div role="alert" className="mb-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-4 text-sm font-medium">{loadError}</div>}
          {loading ? (
            <div className="py-6 text-center text-[var(--muted)]">Loading ledgers...</div>
          ) : payments.length === 0 ? (
            <div className="py-6 text-center text-[var(--muted)]">No payment receipts logged.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--card-border)] text-[var(--muted)] font-bold uppercase tracking-wider bg-[var(--muted-light)]/80">
                    <th className="p-3.5 rounded-l-xl">Transaction ID</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5 rounded-r-xl text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--card-border)] font-medium">
                  {payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-[var(--muted-light)]/80 transition-colors">
                      <td className="p-3.5 font-mono text-[var(--brand-navy)] truncate max-w-xs">{pay.id}</td>
                      <td className="p-3.5 text-[var(--muted)]">{new Date(pay.payment_date).toLocaleDateString()}</td>
                      <td className="p-3.5 font-bold text-[var(--foreground)]">{pay.amount} {pay.currency}</td>
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
