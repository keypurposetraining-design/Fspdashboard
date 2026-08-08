import React from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import {
  BellRing,
  Calendar,
  MessageSquare,
  CheckCircle2,
  Mail,
  Phone,
  Slack,
  Users,
  MailCheck,
  Pen,
  Search,
  HelpCircle,
  Upload,
  UserPlus,
  Flag,
  ArrowRight,
  Clock,
  Link,
} from "lucide-react";
import { mockNotifications, mockAnnouncements, mockRemindersTimeline } from "@/data/mockData";
import { NotificationCard } from "@/components/ui/NotificationCard";

// Dummy data for communications and messages
const mockMessages = [
  {
    id: "msg-1",
    team: "Support Team",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "msg-2",
    team: "Operations Team",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "msg-3",
    team: "Accounts Team",
    avatar: "https://images.unsplash.com/photo-1515162305281-9be0c4e1e636?w=150&auto=format&fit=crop&q=80",
  },
  {
    id: "msg-4",
    team: "Trainer Mentor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
];

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.isRead).length;
  const announcementsCount = mockAnnouncements.length;
  const remindersCount = mockRemindersTimeline.length;
  const messagesCount = mockMessages.length;

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">Notifications & Communication</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Stay informed with updates, reminders, announcements, and important communications from FSP.
        </p>
      </section>

      {/* Section 1 – Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Unread Notifications" value={String(unreadCount)} />
        <StatCard title="Announcements" value={String(announcementsCount)} />
        <StatCard title="Upcoming Reminders" value={String(remindersCount)} />
        <StatCard title="Messages" value={String(messagesCount)} />
      </section>

      {/* Section 2 – Recent Notifications Feed */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Recent Notifications</h2>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-4">
            {mockNotifications.map((n) => (
              <NotificationCard key={n.id} notification={n} onMarkRead={() => {}} />
            ))}
          </div>
        </ScrollArea>
      </section>

      {/* Section 3 – Announcements */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Announcements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockAnnouncements.map((a) => (
            <Card key={a.id} className="p-4 space-y-2">
              <h3 className="font-medium text-lg">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.description}</p>
              <Button variant="link" size="sm" asChild>
                <a href="#">Read More →</a>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 4 – Upcoming Reminders */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Upcoming Reminders</h2>
        <div className="space-y-6">
          {mockRemindersTimeline.map((r) => (
            <div key={r.id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 border border-blue-200">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.date} – {r.category}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 5 – Communication Preferences */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Communication Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "WhatsApp Notifications", icon: Mail },
            { label: "Email Notifications", icon: Mail },
            { label: "SMS Notifications", icon: Phone },
            { label: "In-App Notifications", icon: BellRing },
          ].map((pref) => (
            <Card key={pref.label} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <pref.icon className="w-5 h-5 text-primary" />
                <span>{pref.label}</span>
              </div>
              {/* Placeholder toggle */}
              <button className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary">
                <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-0" />
              </button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Message Center */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Message Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockMessages.map((msg) => (
            <Card key={msg.id} className="p-4 flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={msg.avatar} alt={msg.team} />
                <AvatarFallback>{msg.team[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">{msg.team}</p>
              </div>
              <div className="flex flex-col space-y-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="#">View Conversation</a>
                </Button>
                <Button size="sm" asChild>
                  <a href="#">Message</a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 7 – Notification Categories */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
        <Tabs defaultValue="membership" className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 gap-2">
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>
          <TabsContent value="membership" className="p-4">
            <p className="text-sm text-muted-foreground">Select a category to filter notifications.</p>
          </TabsContent>
          {/* Other tab contents can reuse the same placeholder */}
        </Tabs>
      </section>

      {/* Section 8 – Activity Timeline */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Activity Timeline</h2>
        <div className="space-y-4 border-l-2 border-gray-200 pl-6">
          {[
            { title: "Membership Renewed", icon: Flag },
            { title: "Module 1 Completed", icon: CheckCircle2 },
            { title: "Certificate Issued", icon: Badge },
            { title: "Challenge Completed", icon: Trophy },
            { title: "Community Joined", icon: Users },
          ].map((item, idx) => (
            <div key={idx} className="relative">
              <div className="absolute -left-3 top-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs">
                <item.icon className="w-4 h-4" />
              </div>
              <p className="font-medium">{item.title}</p>
              {idx < 4 && <div className="mt-1 mb-1 border-t border-dotted border-gray-300" />}
            </div>
          ))}
        </div>
      </section>

      {/* Section 9 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { label: "Mark All as Read", icon: CheckCircle2 },
            { label: "View Announcements", icon: Flag },
            { label: "Open WhatsApp", icon: MessageSquare },
            { label: "Open Email", icon: Mail },
            { label: "Contact Support", icon: HelpCircle },
          ].map((action) => (
            <Card key={action.label} className="p-6 flex flex-col items-center hover:shadow-lg transition-shadow text-center">
              <action.icon className="w-8 h-8 mb-2 text-primary" />
              <span className="font-medium">{action.label}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 10 – Empty State (fallback when no notifications) */}
      {mockNotifications.length === 0 && (
        <section className="text-center py-12">
          <p className="text-xl mb-4">You're all caught up.</p>
          <p className="text-muted-foreground mb-6">No new notifications available.</p>
          <Button size="lg" asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </section>
      )}
    </main>
  );
}
