// src/app/events/page.tsx
import type { Metadata } from "next";
import { Calendar, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";
import { CalendarCard } from "@/components/ui/CalendarCard";
import { mockEvents } from "@/data/mockData";

export const metadata: Metadata = {
  title: "Events & Calendar | FSP Member Hub",
  description: "Never miss an FSP event, masterclass, workshop, or challenge.",
};

export default function EventsPage() {
  // Featured event (first in mockEvents)
  const featured = mockEvents[0];

  // Upcoming events (next three)
  const upcoming = mockEvents.slice(1, 4);

  const registered = [
    { id: "reg-1", title: "FSP Catalyst Connect", date: "16 Aug 2026", status: "Registered" },
    { id: "reg-2", title: "Wednesday Masterclass", date: "20 Aug 2026", status: "Confirmed" },
  ];

  const pastEvents = [
    { id: "past-1", title: "July Webinar", date: "15 Jul 2026", recordingUrl: "#", presentationUrl: "#" },
    { id: "past-2", title: "June Workshop", date: "08 Jun 2026", recordingUrl: "#", presentationUrl: "#" },
  ];

  const categories = [
    "Masterclasses",
    "Modules",
    "Challenges",
    "Networking",
    "Community",
    "Special Events",
  ];

  const timeline = [
    { date: "Aug 16", title: "Catalyst Connect" },
    { date: "Aug 20", title: "Wednesday Masterclass" },
    { date: "Aug 25", title: "Module 2" },
    { date: "Aug 30", title: "Community Meetup" },
  ];

  const notifications = [
    { when: "Tomorrow", title: "Catalyst Connect" },
    { when: "1 Hour Before", title: "Join Zoom" },
    { when: "New Event Added", title: "Leadership Workshop" },
  ];

  const quickActions = [
    { icon: "Calendar", label: "Register Event" },
    { icon: "Video", label: "Join Zoom" },
    { icon: "Download", label: "Download Presentation" },
    { icon: "Play", label: "Watch Recording" },
    { icon: "CalendarPlus", label: "Add to Calendar" },
    { icon: "Mail", label: "Contact Organizer" },
  ];

  return (
    <div className="space-y-8 py-8 px-4 md:px-8 lg:px-12">
      {/* Header */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-primary">Events &amp; Calendar</h1>
        <p className="mt-2 text-lg text-slate-600">Never miss an FSP event, masterclass, workshop, or challenge.</p>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <StatCard title="Upcoming Events" value="8" icon={<Calendar size={20} className="text-primary" />} />
        <StatCard title="This Month" value="5" icon={<Calendar size={20} className="text-primary" />} />
        <StatCard title="Events Attended" value="22" icon={<Award size={20} className="text-primary" />} />
        <Card className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary">Next Event</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">Catalyst Connect</p>
            <p className="text-sm text-slate-500">16 August • 7:00 PM</p>
          </CardContent>
        </Card>
      </section>

      {/* Featured Event */}
      <section>
        <Card gradientBorder className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader className="flex flex-col items-start space-y-2">
            <CardTitle className="text-2xl text-primary">{featured.title}</CardTitle>
            <p className="text-sm text-slate-600">{featured.description}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Date:</span> {featured.date}</p>
              <p><span className="font-medium">Time:</span> {featured.time}</p>
              <p><span className="font-medium">Mode:</span> Online (Zoom)</p>
              <p><span className="font-medium">Speaker:</span> {featured.speaker?.name ?? "FSP Team"}</p>
            </div>
            <div className="flex flex-col space-y-2 md:items-end">
              <Button variant="primary" className="w-full md:w-auto">Register Now</Button>
              <Button variant="secondary" className="w-full md:w-auto">Join Zoom</Button>
              <Button variant="outline" className="w-full md:w-auto">Add to Calendar</Button>
              <Button variant="ghost" className="w-full md:w-auto">Share Event</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Upcoming Events List */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcoming.map((ev) => (
            <Card key={ev.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle>{ev.title}</CardTitle>
                <p className="text-sm text-slate-500">{ev.date} • {ev.time ?? ev.type}</p>
              </CardHeader>
              <CardFooter className="flex justify-end">
                <Button variant="primary" size="sm">Register</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Calendar View */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Calendar</h2>
        {/* Placeholder month view */}
<div className="grid grid-cols-7 gap-2 text-center">
  {Array.from({ length: 30 }).map((_, i) => (
    <div key={i} className="p-2 border rounded" >{i + 1}</div>
  ))}
</div>
      </section>

      {/* My Registered Events */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">My Registered Events</h2>
        <div className="flex flex-col space-y-3">
          {registered.map((reg) => (
            <Card key={reg.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{reg.title}</p>
                <p className="text-sm text-slate-500">{reg.date}</p>
              </div>
              <Button variant="primary" size="sm">Join Event</Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Past Events */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Past Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pastEvents.map((pe) => (
            <Card key={pe.id} className="relative p-4">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl" />
              <div className="relative z-10 flex flex-col space-y-2">
                <p className="font-medium">{pe.title}</p>
                <p className="text-sm text-slate-500">{pe.date}</p>
                <div className="flex space-x-2">
                  <a href={pe.recordingUrl} className="inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-[#0F4CFF] text-xs px-3 py-1.5 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">Recording</a>
                <a href={pe.presentationUrl} className="inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-[#0F4CFF] text-xs px-3 py-1.5 gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed">Presentation</a>
                </div>
                <span className="mt-1 inline-block px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Attended</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button key={cat} variant="secondary" size="sm">{cat}</Button>
          ))}
        </div>
      </section>

      {/* Learning Timeline */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Learning Timeline</h2>
        <div className="border-l-2 border-primary pl-6 space-y-6">
          {timeline.map((t, idx) => (
            <div key={idx} className="relative">
              <span className="absolute -left-3 top-0.5 h-2 w-2 bg-primary rounded-full" />
              <p className="font-medium">{t.date}</p>
              <p className="text-slate-600">{t.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Notifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notifications.map((n, i) => (
            <Card key={i} className="p-4">
              <p className="font-medium">{n.when}</p>
              <p className="text-slate-600">{n.title}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((act, i) => (
            <Button key={i} variant="ghost" className="flex flex-col items-center py-6">
              {/* Using generic Calendar icon as placeholder */}
              <Calendar size={24} className="mb-2 text-primary" />
              <span className="text-sm">{act.label}</span>
            </Button>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-primary">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 text-center">
            <p className="text-2xl font-bold text-primary">22</p>
            <p className="text-slate-600">Events Attended</p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-2xl font-bold text-primary">95%</p>
            <p className="text-slate-600">Attendance Rate</p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-2xl font-bold text-primary">88%</p>
            <p className="text-slate-600">Networking Score</p>
          </Card>
          <Card className="p-6 text-center">
            <p className="text-2xl font-bold text-primary">15</p>
            <p className="text-slate-600">Masterclasses Completed</p>
          </Card>
        </div>
      </section>
    </div>
  );
}
