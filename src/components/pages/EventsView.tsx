import React, { useState } from "react";
import { mockEvents } from "@/data/mockData";
import { CalendarCard } from "@/components/ui/CalendarCard";
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
} from "lucide-react";

export const EventsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const pastRecordings = [
    {
      id: "rec-1",
      title: "De-escalating High-Conflict Stakeholder Meetings",
      duration: "58 min",
      date: "July 24, 2026",
      speaker: "Marcus Vance",
      views: 340,
    },
    {
      id: "rec-2",
      title: "Structuring 6-Figure Facilitation Proposals",
      duration: "72 min",
      date: "July 12, 2026",
      speaker: "Sophia Martinez",
      views: 512,
    },
    {
      id: "rec-3",
      title: "Advanced Breakout Automation in Miro & Zoom",
      duration: "45 min",
      date: "June 28, 2026",
      speaker: "Elena Rostova",
      views: 420,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="primary" size="sm">
              LIVE SESSIONS & WORKSHOPS
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Events & Calendar
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Join live masterclasses, interactive Q&As, and access past event recordings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "upcoming" ? "primary" : "outline"}
            size="md"
            onClick={() => setActiveTab("upcoming")}
            icon={<CalendarIcon className="w-4 h-4" />}
          >
            Upcoming Events
          </Button>
          <Button
            variant={activeTab === "past" ? "primary" : "outline"}
            size="md"
            onClick={() => setActiveTab("past")}
            icon={<Video className="w-4 h-4" />}
          >
            Recording Library
          </Button>
        </div>
      </div>

      {activeTab === "upcoming" ? (
        <>
          {/* Calendar Month Visual Grid Bar */}
          <Card className="bg-[#0F4CFF] text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">August 2026 Schedule</h3>
                  <p className="text-xs text-blue-100">
                    4 Live sessions scheduled for this month
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="bg-white/20 px-3 py-1.5 rounded-full">
                  Timezone: UTC (London)
                </span>
              </div>
            </div>
          </Card>

          {/* Upcoming Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockEvents.map((evt) => (
              <CalendarCard key={evt.id} event={evt} />
            ))}
          </div>
        </>
      ) : (
        /* Past Event Recordings Library */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Past Workshop Recordings (48 Recordings)
            </h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search recordings..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#0F4CFF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pastRecordings.map((rec) => (
              <Card key={rec.id} hoverEffect className="group cursor-pointer">
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-7 h-7" />
                  </div>
                  <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {rec.duration}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0F4CFF] transition-colors line-clamp-2 mb-1">
                  {rec.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{rec.speaker}</span>
                  <span>{rec.date}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
