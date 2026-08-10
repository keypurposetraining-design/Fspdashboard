"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Search, Plus, Edit, Trash2, Calendar, Users, X, RefreshCcw } from "lucide-react";

export default function AdminEvents() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<any[]>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setCurrentUser(data.user);
      }
    });
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          location,
          event_registrations (
            id
          )
        `)
        .order("start_time", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      setFilteredEvents(data || []);
    } catch (err: any) {
      console.error("Error fetching events:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Search
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    const filtered = events.filter(e => 
      (e.title || "").toLowerCase().includes(q) || 
      (e.location || "").toLowerCase().includes(q)
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const handleCreateOrUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (selectedEvent) {
        // Edit
        const { error } = await supabase
          .from("events")
          .update({
            title,
            description,
            start_time: new Date(startTime).toISOString(),
            end_time: endTime ? new Date(endTime).toISOString() : null,
            location,
            updated_at: new Date().toISOString()
          })
          .eq("id", selectedEvent.id);

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "event updated",
          table_name: "events",
          record_id: selectedEvent.id,
          performed_by: currentUser?.id,
          details: { title }
        });
      } else {
        // Create
        const eventId = crypto.randomUUID();
        const { error } = await supabase
          .from("events")
          .insert({
            id: eventId,
            title,
            description,
            start_time: new Date(startTime).toISOString(),
            end_time: endTime ? new Date(endTime).toISOString() : null,
            location,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        await supabase.from("audit_logs").insert({
          action: "event created",
          table_name: "events",
          record_id: eventId,
          performed_by: currentUser?.id,
          details: { title }
        });
      }

      setIsEventModalOpen(false);
      await fetchEvents();
    } catch (err: any) {
      alert("Error saving event: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditEvent = (evt: any) => {
    setSelectedEvent(evt);
    setTitle(evt.title || "");
    setDescription(evt.description || "");
    
    // Format dates to YYYY-MM-DDThh:mm format for input type="datetime-local"
    const startIso = evt.start_time ? new Date(evt.start_time).toISOString() : "";
    setStartTime(startIso.substring(0, 16));
    
    const endIso = evt.end_time ? new Date(evt.end_time).toISOString() : "";
    setEndTime(evt.end_time ? endIso.substring(0, 16) : "");
    
    setLocation(evt.location || "");
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to cancel and delete this event?")) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      await supabase.from("audit_logs").insert({
        action: "event deleted",
        table_name: "events",
        record_id: eventId,
        performed_by: currentUser?.id,
        details: { eventId }
      });

      await fetchEvents();
    } catch (err: any) {
      alert("Error deleting event: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRegistrations = async (eventId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          status,
          registered_at,
          members (
            first_name,
            last_name,
            users (
              email
            )
          )
        `)
        .eq("event_id", eventId);

      if (error) throw error;
      setRegistrations(data || []);
      setIsRegistrationsModalOpen(true);
    } catch (err: any) {
      alert("Error loading registrations: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Events Management</h1>
          <p className="text-sm text-slate-500 font-medium">Schedule live workshops, group dynamics practice, or capstone evaluation events.</p>
        </div>
        <Button size="sm" onClick={() => { setSelectedEvent(null); setTitle(""); setDescription(""); setStartTime(""); setEndTime(""); setLocation(""); setIsEventModalOpen(true); }} icon={<Plus className="w-4 h-4" />}>
          Schedule Event
        </Button>
      </div>

      {/* SEARCH BAR */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search event title or location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
        </CardContent>
      </Card>

      {/* EVENTS TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-500 font-medium">Loading scheduled events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">No events found.</div>
          ) : (
            <Table
              columns={[
                { header: "Event Title", accessor: "title" },
                { header: "Location", accessor: "location" },
                { header: "Start Time", accessor: "start_time", render: (row) => new Date(row.start_time).toLocaleString() },
                { header: "Registrations", accessor: "registrations_count", render: (row) => row.event_registrations?.length || 0 },
                { header: "Actions", accessor: "actions", render: (row) => (
                  <div className="flex gap-2">
                    <Button variant="outline" size="xs" onClick={() => handleOpenRegistrations(row.id)} icon={<Users className="w-3 h-3" />}>
                      Registrations
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => handleOpenEditEvent(row)} icon={<Edit className="w-3 h-3" />}>
                      Edit
                    </Button>
                    <Button variant="outline" size="xs" onClick={() => handleDeleteEvent(row.id)} className="border-rose-200 text-rose-600 hover:bg-rose-50" icon={<Trash2 className="w-3 h-3" />}>
                      Cancel
                    </Button>
                  </div>
                ) }
              ]}
              data={filteredEvents}
            />
          )}
        </CardContent>
      </Card>

      {/* EVENT CREATE/EDIT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsEventModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleCreateOrUpdateEvent}>
              <CardHeader className="p-0 pb-4 border-b">
                <CardTitle className="text-xl font-bold">{selectedEvent ? "Edit Scheduled Event" : "Schedule Live Event"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <Input
                  label="Event Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Masterclass on Interactive Dialogue"
                  required
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 block">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Provide details, session syllabus or zoom details..."
                    className="flex min-h-[85px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
                  />
                </div>
                <Input
                  label="Start Date & Time"
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
                <Input
                  label="End Date & Time (Optional)"
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
                <Input
                  label="Location (Zoom Link / Room)"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Zoom Room A / Meeting Hall 2"
                  required
                />
              </CardContent>
              <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsEventModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {selectedEvent ? "Save Changes" : "Schedule"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* REGISTRATIONS MODAL */}
      {isRegistrationsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl bg-white p-6 shadow-xl relative animate-in zoom-in duration-150">
            <button className="absolute right-4 top-4 text-slate-400 hover:text-slate-600" onClick={() => setIsRegistrationsModalOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <CardHeader className="p-0 pb-4 border-b">
              <CardTitle className="text-xl font-bold">Event Registered Members</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 max-h-[400px] overflow-y-auto">
              {registrations.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No member registrations for this event yet.</p>
              ) : (
                <Table
                  columns={[
                    { header: "Attendee", accessor: "name", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "N/A" },
                    { header: "Email Address", accessor: "email", render: (row) => row.members?.users?.email || "—" },
                    { header: "Registered At", accessor: "registered_at", render: (row) => new Date(row.registered_at).toLocaleDateString() },
                    { header: "Status", accessor: "status", render: (row) => <Badge variant={row.status === "registered" ? "success" : "danger"}>{row.status}</Badge> }
                  ]}
                  data={registrations}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
