import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, Filter, Plus, Upload, Download, Calendar as CalendarIcon, Clock, Zap, MessageSquare, Phone, CheckCircle, Edit, Eye, Copy, Award, Bell, Share2, FileText } from "lucide-react";
import { mockDashboardEvents, mockLeaderboard, mockAchievementBadges, mockRecentActivities, mockQuickActions } from "@/data/mockData";

// Dummy data specific to Event Management
const mockEvents = [
  {
    id: "ev-1",
    title: "FSP Catalyst Connect",
    date: "16 Aug",
    time: "7:00 PM",
    platform: "Zoom",
    trainer: "Karunai Prakash",
    registered: 124,
    status: "Upcoming",
    zoomLink: "https://zoom.us/j/123456789",
    meetingId: "123-456-789",
    passcode: "abc123",
  },
  {
    id: "ev-2",
    title: "Advanced Facilitation Workshop",
    date: "22 Aug",
    time: "10:00 AM",
    platform: "Google Meet",
    trainer: "Anand Sharma",
    registered: 98,
    status: "Upcoming",
    zoomLink: "https://meet.google.com/xyz-abc-def",
    meetingId: "",
    passcode: "",
  },
];

const mockRegistrations = [
  { eventId: "ev-1", capacity: 200, registered: 124, checkedIn: 110, waitingList: 5, status: "Open" },
  { eventId: "ev-2", capacity: 150, registered: 98, checkedIn: 90, waitingList: 2, status: "Open" },
];

const mockAttendance = [
  { eventId: "ev-1", present: 110, absent: 14, late: 5 },
  { eventId: "ev-2", present: 90, absent: 8, late: 0 },
];

const mockEventResources = [
  { eventId: "ev-1", type: "Presentation", name: "Catalyst Deck.pdf" },
  { eventId: "ev-1", type: "Recording", name: "Catalyst Recording.mp4" },
];

export default function EventManagementPage() {
  const [events] = useState(mockEvents);
  const [registrations] = useState(mockRegistrations);
  const [attendance] = useState(mockAttendance);

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">Event Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create, schedule, manage and monitor all FSP events, workshops, masterclasses and community programs.
        </p>
      </section>

      {/* Top Action Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search Event" className="max-w-sm" />
          <Button variant="outline" size="sm" asChild>
            <span className="flex items-center"><Search className="w-4 h-4 mr-1" />Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" asChild>
            <span className="flex items-center"><Filter className="w-4 h-4 mr-1" />Filter</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" asChild>
            <span className="flex items-center"><Plus className="w-4 h-4 mr-1" />Create Event</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Upload className="w-4 h-4 mr-1" />Import Events</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Download className="w-4 h-4 mr-1" />Export Report</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" />Calendar View</span>
          </Button>
        </div>
      </section>

      {/* Section 1 – Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value="128" />
        <StatCard title="Upcoming" value="18" />
        <StatCard title="Completed" value="104" />
        <StatCard title="Cancelled" value="6" />
        <StatCard title="Registrations" value="2,486" />
        <StatCard title="Attendance Rate" value="91%" />
        <StatCard title="Certificates Issued" value="642" />
        <StatCard title="Pending Approvals" value="12" />
      </section>

      {/* Section 2 – Upcoming Events */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(ev => (
            <Card key={ev.id} className="p-4 flex flex-col">
              <h3 className="font-medium text-lg mb-1">{ev.title}</h3>
              <p className="text-sm text-muted-foreground"><strong>Date:</strong> {ev.date}</p>
              <p className="text-sm text-muted-foreground"><strong>Time:</strong> {ev.time}</p>
              <p className="text-sm text-muted-foreground"><strong>Platform:</strong> {ev.platform}</p>
              <p className="text-sm text-muted-foreground"><strong>Trainer:</strong> {ev.trainer}</p>
              <p className="text-sm text-muted-foreground"><strong>Registered:</strong> {ev.registered} Members</p>
              <div className="mt-3 flex space-x-2">
                <Button variant="outline" size="sm" asChild><span>View</span></Button>
                <Button variant="outline" size="sm" asChild><span>Edit</span></Button>
                <Button variant="outline" size="sm" asChild><span>Manage</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 – Calendar */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Calendar</h2>
        <div className="h-96 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Calendar Component (Month/Week/Day) Placeholder</span>
        </div>
      </section>

      {/* Section 4 – Registration Dashboard */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Registration Dashboard</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Event</th>
                <th className="p-3">Capacity</th>
                <th className="p-3">Registered</th>
                <th className="p-3">Checked In</th>
                <th className="p-3">Waiting List</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg.eventId} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">{events.find(e => e.id === reg.eventId)?.title || reg.eventId}</td>
                  <td className="p-3">{reg.capacity}</td>
                  <td className="p-3">{reg.registered}</td>
                  <td className="p-3">{reg.checkedIn}</td>
                  <td className="p-3">{reg.waitingList}</td>
                  <td className="p-3"><Badge>{reg.status}</Badge></td>
                  <td className="p-3 flex space-x-1">
                    <Button variant="ghost" size="sm" asChild><span>Manage</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Export</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Close Registration</span></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 – Attendance Management */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Attendance Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attendance.map(att => (
            <Card key={att.eventId} className="p-4">
              <h3 className="font-medium mb-2">{events.find(e => e.id === att.eventId)?.title}</h3>
              <p className="text-sm text-muted-foreground"><strong>Present:</strong> {att.present}</p>
              <p className="text-sm text-muted-foreground"><strong>Absent:</strong> {att.absent}</p>
              <p className="text-sm text-muted-foreground"><strong>Late:</strong> {att.late}</p>
              <div className="mt-2 flex space-x-2">
                <Button variant="outline" size="sm" asChild><span>Export Attendance</span></Button>
                <Button variant="outline" size="sm" asChild><span>Generate QR Code</span></Button>
                <Button variant="outline" size="sm" asChild><span>Manual Check‑in</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Zoom & Venue */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Zoom &amp; Venue</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(ev => (
            <Card key={ev.id} className="p-4 flex flex-col">
              <h3 className="font-medium mb-1">{ev.title}</h3>
              <p className="text-sm text-muted-foreground"><strong>Zoom Link:</strong> {ev.zoomLink}</p>
              {ev.meetingId && <p className="text-sm text-muted-foreground"><strong>Meeting ID:</strong> {ev.meetingId}</p>}
              {ev.passcode && <p className="text-sm text-muted-foreground"><strong>Passcode:</strong> {ev.passcode}</p>}
              <div className="mt-2 flex space-x-2">
                <Button variant="outline" size="sm" asChild><span>Copy</span></Button>
                <Button variant="outline" size="sm" asChild><span>Edit</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 – Reminder Center */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reminder Center</h2>
        <div className="flex flex-col items-center space-y-2">
          {[
            "7 Days Before",
            "3 Days Before",
            "1 Day Before",
            "1 Hour Before",
            "15 Minutes Before",
            "Event Started",
          ].map((label, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>{label}</span>
            </div>
          ))}
          <div className="flex space-x-4 mt-4">
            <Badge variant="outline">Dashboard</Badge>
            <Badge variant="outline">WhatsApp</Badge>
            <Badge variant="outline">Email</Badge>
          </div>
        </div>
      </section>

      {/* Section 8 – Resources */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockEventResources.map(res => (
            <Card key={res.eventId + res.name} className="p-4 flex flex-col items-center">
              <div className="text-2xl mb-2 text-primary">{res.type}</div>
              <p className="font-medium">{res.name}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 9 – Feedback Dashboard */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Feedback Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Average Rating", value: "4.6/5" },
            { label: "NPS", value: "+45" },
            { label: "Attendance %", value: "91%" },
            { label: "Feedback Submitted", value: "1,842" },
          ].map((item, i) => (
            <Card key={i} className="p-4 flex flex-col items-center">
              <p className="font-medium text-lg">{item.label}</p>
              <p className="text-2xl font-bold text-primary">{item.value}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 10 – Event Analytics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Event Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Monthly Events",
            "Attendance Trend",
            "Popular Events",
            "Trainer Performance",
          ].map((label, i) => (
            <Card key={i} className="h-64 flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">{label} (Chart Placeholder)</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 11 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Create Event", icon: "Plus" },
            { label: "Duplicate Event", icon: "Copy" },
            { label: "Upload Recording", icon: "Upload" },
            { label: "Issue Certificates", icon: "Award" },
            { label: "Send Reminder", icon: "Bell" },
            { label: "Download Attendance", icon: "Download" },
          ].map((act, i) => (
            <Card key={i} className="p-4 flex flex-col items-center hover:shadow-lg transition-shadow">
              <Button variant="ghost" size="lg" asChild>
                <span className="flex flex-col items-center"><span className="text-3xl mb-2 text-primary">{act.icon}</span>{act.label}</span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 12 – AI Event Assistant */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">AI Event Assistant</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { label: "Generate Event Agenda", icon: "Zap" },
            { label: "Generate Invitation", icon: "Mail" },
            { label: "Generate WhatsApp Reminder", icon: "Phone" },
            { label: "Generate Follow-up Email", icon: "Mail" },
            { label: "Generate Feedback Form", icon: "FileText" },
            { label: "Generate Participation Certificate", icon: "Award" },
            { label: "Generate Social Media Post", icon: "Share2" },
          ].map((opt, i) => (
            <Card key={i} className="p-4 flex flex-col items-center">
              <Button variant="ghost" size="lg" asChild>
                <span className="flex flex-col items-center"><span className="text-3xl mb-2 text-primary">{opt.icon}</span>{opt.label}</span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 13 – Empty State */}
      {events.length === 0 && (
        <section className="text-center py-12">
          <p className="text-xl mb-4">No events available.</p>
          <Button size="lg" asChild><span className="flex items-center"><Plus className="w-5 h-5 mr-2" />Create First Event</span></Button>
        </section>
      )}
    </main>
  );
}
