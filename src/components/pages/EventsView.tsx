"use client";

import React, { useState, useEffect } from "react";
import { toDataError } from "@/lib/data/errors";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import {
  Calendar as CalendarIcon,
  Video,
  PlayCircle,
  Users,
  Search,
  CheckCircle2,
  RefreshCcw,
  Clock,
  MapPin,
  IndianRupee,
  CreditCard,
  X
} from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const EventsView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [member, setMember] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Paid RSVP modal state
  const [payEvent, setPayEvent] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [submittingPay, setSubmittingPay] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  async function fetchInitialData() {
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
        setMember(memberData);

        // Fetch events
        const { data: eventsData, error: eventsErr } = await supabase
          .from("events")
          .select("*")
          .order("start_time", { ascending: true });
        if (eventsErr) throw eventsErr;
        setEvents(eventsData || []);

        // Fetch registrations
        const { data: regsData, error: regsErr } = await supabase
          .from("event_registrations")
          .select("*")
          .eq("member_id", memberData.id)
          .eq("status", "registered");
        if (regsErr) throw regsErr;
        setRegistrations(regsData || []);

        // Fetch payments linked to events (for paid RSVP status)
        const { data: payData, error: payErr } = await supabase
          .from("payments")
          .select("*")
          .eq("member_id", memberData.id)
          .not("event_id", "is", null);
        if (payErr) throw payErr;
        setPayments(payData || []);

        await logMemberActivity("EVENT_VIEW");
      }
    } catch (err: any) {
      setLoadError(toDataError(err, "events").message);
    } finally {
      setLoading(false);
    }
  }

  // Handle RSVP Toggle
  const handleRSVP = async (event: any, isRegistered: boolean) => {
    if (!member) return;

    // Paid events open the payment flow instead of a direct RSVP
    if (!isRegistered && Number(event.fee || 0) > 0) {
      setPayEvent(event);
      setPayAmount(String(event.fee));
      return;
    }

    try {
      setLoading(true);
      if (isRegistered) {
        // Cancel RSVP
        const existing = registrations.find(r => r.event_id === event.id);
        if (existing) {
          const { error } = await supabase
            .from("event_registrations")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", existing.id);

          if (error) throw error;
          await logMemberActivity("EVENT_CANCEL", { event_id: event.id });
        }
      } else {
        // Reserve Seat (free event)
        const { error } = await supabase
          .from("event_registrations")
          .insert({
            event_id: event.id,
            member_id: member.id,
            status: "registered",
            registered_at: new Date().toISOString()
          });

        if (error) throw error;
        await logMemberActivity("EVENT_REGISTER", { event_id: event.id });
      }

      await fetchInitialData();
    } catch (err: any) {
      alert("Error processing RSVP: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit payment proof + reserve seat for a paid event
  const handlePayAndReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !payEvent) return;

    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    try {
      setSubmittingPay(true);

      // Record the event payment (admin reconciles this later)
      const { error: payError } = await supabase
        .from("payments")
        .insert({
          member_id: member.id,
          event_id: payEvent.id,
          amount,
          currency: "INR",
          status: "pending",
          payment_date: new Date().toISOString()
        });

      if (payError) throw payError;

      // Reserve the seat
      const { error: regError } = await supabase
        .from("event_registrations")
        .insert({
          event_id: payEvent.id,
          member_id: member.id,
          status: "registered",
          registered_at: new Date().toISOString()
        });

      if (regError) throw regError;

      await logMemberActivity("EVENT_REGISTER", { event_id: payEvent.id, amount });
      setPayEvent(null);
      setPayAmount("");
      await fetchInitialData();
      alert("Payment receipt submitted and your seat is reserved! Administrative team will verify your payment shortly.");
    } catch (err: any) {
      alert("Error reserving seat: " + err.message);
    } finally {
      setSubmittingPay(false);
    }
  };

  const isUserRegistered = (eventId: string) => {
    return registrations.some(r => r.event_id === eventId);
  };

  // Payment status for a member's event registration
  const getPaymentStatus = (eventId: string) => {
    const pay = payments.find(p => p.event_id === eventId);
    return pay?.status || null;
  };

  const formatFee = (fee: any) => {
    const num = Number(fee || 0);
    return num > 0 ? `₹${num.toFixed(2)}` : "Free";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              LIVE SESSIONS &amp; WORKSHOPS
            </Badge>
          </div>
          <h1 className="fsp-dot text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight">
            Events &amp; Calendar
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Join live masterclasses, interactive Q&amp;As, and access past event recordings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {loadError && <div role="alert" className="mb-4 rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-light)] p-4 text-sm font-medium">{loadError}</div>}
      {loading ? (
        <div className="py-12 text-center text-[var(--muted)] font-medium">Loading live workshop schedule...</div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-[var(--muted)] border border-dashed rounded-3xl bg-[var(--card-bg)]">
          No live events scheduled at this moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const isRegistered = isUserRegistered(evt.id);
            const payStatus = getPaymentStatus(evt.id);
            const eventDate = new Date(evt.start_time);
            const month = eventDate.toLocaleString("default", { month: "short" }).toUpperCase();
            const day = eventDate.getDate().toString().padStart(2, "0");
            const isUpcoming = eventDate >= new Date();
            const isCatalystConnect = evt.title === "FSP Catalyst Connect";

            return (
              <Card key={evt.id} className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-[var(--brand-navy-light)] hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                {evt.image_url && (
                  <div className="relative mb-4 rounded-xl overflow-hidden aspect-[16/9]">
                    <img
                      src={evt.image_url}
                      alt={evt.title}
                      className="w-full h-full object-cover"
                    />
                    {isCatalystConnect && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="warning" size="sm" className="bg-[var(--brand-gold)] text-[var(--brand-navy)]">
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Date Box */}
                    <div className="bg-gradient-to-b from-[var(--brand-navy)] to-[var(--brand-navy-hover)] text-white rounded-xl p-2.5 w-14 text-center shrink-0 shadow-sm">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--brand-navy-light)]">
                        {month}
                      </span>
                      <span className="block text-xl font-black leading-none mt-0.5">
                        {day}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="primary" size="sm">
                          {isUpcoming ? "Upcoming" : "Past"}
                        </Badge>
                        {isRegistered && (
                          <Badge variant="success" size="sm" dot>
                            Confirmed RSVP
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[var(--foreground)] leading-snug line-clamp-2">
                        {evt.title}
                      </h4>
                      {isCatalystConnect && (
                        <p className="text-xs text-[var(--brand-gold-ink)] font-semibold uppercase tracking-wider mt-1">
                          FSP CC
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[var(--muted)] line-clamp-2 mb-4">
                    {evt.description || "No description provided."}
                  </p>

                  <div className="space-y-2 border-t border-[var(--card-border)] pt-3 text-xs text-[var(--muted)] mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span className="truncate max-w-[280px]">{evt.location || "Online Zoom"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-3.5 h-3.5 text-[var(--muted)]" />
                      <span className={Number(evt.fee || 0) > 0 ? "font-bold text-[var(--foreground)]" : "text-[var(--muted)]"}>
                        {formatFee(evt.fee)}
                        {Number(evt.fee || 0) > 0 && <span className="font-medium text-[var(--muted)]"> registration fee</span>}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--card-border)]">
                  {isRegistered ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                      <Button variant="soft" size="sm" fullWidth onClick={() => handleRSVP(evt, true)} icon={<CheckCircle2 className="w-4 h-4 text-[var(--success)]" />}>
                        Attending (Cancel Seat)
                      </Button>
                      {payStatus === "succeeded" ? (
                        <Badge variant="success" size="sm">Paid</Badge>
                      ) : payStatus ? (
                        <Badge variant="warning" size="sm">Payment Pending</Badge>
                      ) : null}
                    </div>
                  ) : Number(evt.fee || 0) > 0 ? (
                    <Button variant="primary" size="sm" fullWidth onClick={() => handleRSVP(evt, false)} icon={<CreditCard className="w-4 h-4" />}>
                      Pay {formatFee(evt.fee)} &amp; Reserve
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" fullWidth onClick={() => handleRSVP(evt, false)} icon={<CalendarIcon className="w-4 h-4" />}>
                      Reserve My Seat
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* PAID RSVP PAYMENT MODAL */}
      {payEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <Card className="w-full max-w-md bg-[var(--card-bg)] p-6 shadow-xl relative rounded-3xl border border-[var(--card-border)]">
            <button className="absolute right-4 top-4 text-[var(--muted)] hover:text-[var(--foreground)]" onClick={() => setPayEvent(null)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handlePayAndReserve}>
              <CardHeader className="p-0 pb-4 border-b border-[var(--card-border)]">
                <CardTitle className="text-lg font-bold text-[var(--foreground)]">Pay &amp; Reserve Seat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                  Registering for <strong className="text-[var(--foreground)]">{payEvent.title}</strong>. Submit your bank
                  transfer receipt proof to confirm your seat.
                </p>
                <Input
                  label="Amount Paid (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                />
                <div className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                  Bank Transfer Details:<br />
                  <strong>Bank Name:</strong> Guild Facilitators Bank of India<br />
                  <strong>Account Number:</strong> 9876543210<br />
                  <strong>IFSC Code:</strong> GFBI0001928
                </div>
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t border-[var(--card-border)] mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setPayEvent(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submittingPay}>
                  {submittingPay ? "Submitting..." : "Submit Payment & Reserve"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
