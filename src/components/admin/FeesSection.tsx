"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { RefreshCcw, Save, IndianRupee } from "lucide-react";

export function FeesSection() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [renewalAmount, setRenewalAmount] = useState("3000");
  const [renewalCurrency, setRenewalCurrency] = useState("INR");

  const [events, setEvents] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [saveMsg, setSaveMsg] = useState("");

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
      const [settingsRes, eventsRes] = await Promise.all([
        supabase.from("app_settings").select("key, value").eq("key", "renewal_fee").maybeSingle(),
        supabase
          .from("events")
          .select(`
            id,
            title,
            fee,
            event_registrations (
              id
            )
          `)
          .order("start_time", { ascending: true })
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const renewal = settingsRes.data?.value;
      if (renewal) {
        setRenewalAmount(String(renewal.amount ?? "3000"));
        setRenewalCurrency(String(renewal.currency ?? "INR"));
      }

      setEvents(eventsRes.data || []);
    } catch (err: any) {
      console.error("Error loading fee settings:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveRenewalFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSaveMsg("");

      const amount = parseFloat(renewalAmount);
      if (isNaN(amount) || amount < 0) {
        alert("Please enter a valid renewal fee amount.");
        return;
      }

      const { error } = await supabase
        .from("app_settings")
        .upsert({
          key: "renewal_fee",
          value: { amount, currency: renewalCurrency },
          updated_at: new Date().toISOString(),
          updated_by: currentUser?.id || null
        });

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "renewal fee updated",
        table_name: "app_settings",
        record_id: null,
        performed_by: currentUser?.id,
        details: { key: "renewal_fee", amount, currency: renewalCurrency }
      });

      setSaveMsg("Membership renewal fee updated successfully!");
      await fetchInitialData();
    } catch (err: any) {
      alert("Error saving renewal fee: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEventFee = async (eventId: string, feeValue: string) => {
    try {
      const fee = feeValue === "" ? 0 : parseFloat(feeValue);
      if (isNaN(fee) || fee < 0) {
        alert("Please enter a valid fee amount.");
        return;
      }

      const { error } = await supabase
        .from("events")
        .update({ fee, updated_at: new Date().toISOString() })
        .eq("id", eventId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "event fee updated",
        table_name: "events",
        record_id: eventId,
        performed_by: currentUser?.id,
        details: { fee }
      });

      await fetchInitialData();
    } catch (err: any) {
      alert("Error saving event fee: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="fsp-dot text-2xl font-black text-slate-900 tracking-tight">Fees & Pricing</h1>
        <p className="text-sm text-slate-500 font-medium">Configure membership renewal dues and per-event registration fees shown on the member site.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MEMBERSHIP RENEWAL FEE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-[var(--brand-navy)]" />
              Membership Renewal Fee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveRenewalFee} className="space-y-4">
              <Input
                label="Renewal Amount"
                type="number"
                min="0"
                step="0.01"
                value={renewalAmount}
                onChange={e => setRenewalAmount(e.target.value)}
                placeholder="e.g. 3000"
                required
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 block">Currency</label>
                <Select value={renewalCurrency} onChange={e => setRenewalCurrency(e.target.value)} className="w-full border rounded p-2">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Select>
              </div>
              {saveMsg && (
                <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  {saveMsg}
                </p>
              )}
              <Button type="submit" size="sm" disabled={saving || loading} icon={<Save className="w-4 h-4" />}>
                {saving ? "Saving..." : "Save Renewal Fee"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* EVENT FEES OVERVIEW */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">Event Fees</CardTitle>
              <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-10 text-center text-slate-500 font-medium">Loading event fees...</div>
              ) : events.length === 0 ? (
                <div className="py-10 text-center text-slate-500 font-medium">No events configured yet.</div>
              ) : (
                <Table
                  columns={[
                    { header: "Event Title", accessor: "title" },
                    { header: "Registrations", accessor: "registrations_count", render: (row) => row.event_registrations?.length || 0 },
                    { header: "Current Fee", accessor: "fee", render: (row) => (
                      row.fee ? <Badge variant="primary">₹{Number(row.fee).toFixed(2)}</Badge> : <Badge variant="secondary">Free</Badge>
                    ) },
                    { header: "Update Fee (₹)", accessor: "fee_editor", render: (row) => (
                      <EventFeeEditor key={row.id} event={row} onSave={(value) => handleSaveEventFee(row.id, value)} />
                    ) }
                  ]}
                  data={events}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EventFeeEditor({ event, onSave }: { event: any; onSave: (value: string) => void }) {
  const [value, setValue] = useState(event.fee != null ? String(event.fee) : "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="w-28"
      />
      <Button variant="soft" size="xs" onClick={handleSave} disabled={saving} icon={<Save className="w-3 h-3" />}>
        Save
      </Button>
    </div>
  );
}

export default FeesSection;
