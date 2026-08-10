"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  X
} from "lucide-react";
import { logMemberActivity } from "@/lib/activity-log";

export const EventsView: React.FC = () => {
  const { user } = useAuth();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [loading, setLoading] = useState(true);

  const [member, setMember] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);

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

        await logMemberActivity("EVENT_VIEW");
      }
    } catch (err: any) {
      console.error("Error loading events view:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle RSVP Toggle
  const handleRSVP = async (event: any, isRegistered: boolean) => {
    if (!member) return;

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
        // Reserve Seat
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

  const isUserRegistered = (eventId: string) => {
    return registrations.some(r => r.event_id === eventId);
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Events &amp; Calendar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Join live masterclasses, interactive Q&amp;As, and access past event recordings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchInitialData} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">Loading live workshop schedule...</div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-slate-500 border border-dashed rounded-3xl bg-white">
          No live events scheduled at this moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const isRegistered = isUserRegistered(evt.id);
            const eventDate = new Date(evt.start_time);
            const month = eventDate.toLocaleString("default", { month: "short" }).toUpperCase();
            const day = eventDate.getDate().toString().padStart(2, "0");

            return (
              <Card key={evt.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Date Box */}
                    <div className="bg-gradient-to-b from-[#0F4CFF] to-blue-700 text-white rounded-xl p-2.5 w-14 text-center shrink-0 shadow-sm">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-200">
                        {month}
                      </span>
                      <span className="block text-xl font-black leading-none mt-0.5">
                        {day}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="primary" size="sm">
                          Masterclass
                        </Badge>
                        {isRegistered && (
                          <Badge variant="success" size="sm" dot>
                            Confirmed RSVP
                          </Badge>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                        {evt.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {evt.description || "No description provided."}
                  </p>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate max-w-[280px]">{evt.location || "Online Zoom"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {isRegistered ? (
                    <Button variant="soft" size="sm" fullWidth onClick={() => handleRSVP(evt, true)} icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}>
                      Attending (Cancel Seat)
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
    </div>
  );
};
