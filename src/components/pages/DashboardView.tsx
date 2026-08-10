"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  UserCheck,
  BookOpen,
  CheckSquare,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  PlayCircle,
  RefreshCcw,
  Users,
} from "lucide-react";

export interface DashboardViewProps {
  onNavigate: (tabId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [totalCourses, setTotalCourses] = useState(0);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [submittedTasksCount, setSubmittedTasksCount] = useState(0);
  const [gradedTasksCount, setGradedTasksCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch member profile
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select("id, first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (memberData) {
        setProfile(memberData);

        // Fetch membership
        const { data: memData } = await supabase
          .from("memberships")
          .select("*")
          .eq("member_id", memberData.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setMembership(memData);

        // Fetch total courses
        const { count: cCount } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true });
        setTotalCourses(cCount || 0);

        // Fetch user enrollments
        const { count: eCount } = await supabase
          .from("course_enrollments")
          .select("*", { count: "exact", head: true })
          .eq("member_id", memberData.id);
        setEnrolledCoursesCount(eCount || 0);

        // Fetch total tasks
        const { count: tCount } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true });
        setTotalTasks(tCount || 0);

        // Fetch submissions
        const { data: subs } = await supabase
          .from("task_submissions")
          .select("grade")
          .eq("member_id", memberData.id);
        
        if (subs) {
          setSubmittedTasksCount(subs.length);
          setGradedTasksCount(subs.filter(s => s.grade !== null).length);
        }

        // Fetch next 3 upcoming events
        const { data: eventsData } = await supabase
          .from("events")
          .select("*")
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(3);
        setUpcomingEvents(eventsData || []);
      }
    } catch (err: any) {
      console.error("Error loading dashboard metrics:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const userName = profile ? `${profile.first_name || ""}` : (user?.name ? user.name.split(" ")[0] : "Member");

  // Calculate learning progress pct
  const learningProgressPct = totalCourses > 0 ? Math.round((enrolledCoursesCount / totalCourses) * 100) : 0;

  const quickAccessItems = [
    { id: "membership", label: "My Membership", icon: <UserCheck className="w-5 h-5 text-[#0F4CFF]" /> },
    { id: "courses", label: "Courses Catalog", icon: <BookOpen className="w-5 h-5 text-purple-600" /> },
    { id: "tasks", label: "Tasks", icon: <CheckSquare className="w-5 h-5 text-emerald-600" /> },
    { id: "payments", label: "Payments History", icon: <Calendar className="w-5 h-5 text-[#FF7A00]" /> },
    { id: "certificates", label: "Certificates", icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
    { id: "community", label: "Community Forum", icon: <Users className="w-5 h-5 text-blue-600" /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-200 pb-12">
      {/* PAGE TITLE & WELCOME BANNER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-[#0F4CFF] to-blue-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-xs">
              FSP Member Hub Dashboard
            </span>
            <span className="text-blue-200 text-xs font-semibold">Annual Member</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Good Morning, {userName} 👋
          </h1>
          <p className="text-sm sm:text-base text-blue-100 font-medium">
            Welcome back to your FSP learning journey.
          </p>
        </div>

        <div className="z-10 flex items-center gap-3 w-full md:w-auto pt-2 md:pt-0">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => onNavigate("courses")}
          >
            Browse Courses
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">Loading dashboard metrics...</div>
      ) : (
        <>
          {/* SECTION 1: SUMMARY CARDS */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overview &amp; Status Summary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Membership */}
              <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Membership Status
                    </span>
                    <Badge variant={membership?.status === "active" ? "success" : "warning"} size="sm" dot>
                      {membership?.status || "None"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Annual Access
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Expires: <strong className="text-slate-800">{membership?.end_date ? new Date(membership.end_date).toLocaleDateString() : "Pending Renewal"}</strong>
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Button variant="outline" size="sm" fullWidth onClick={() => onNavigate("membership")}>
                    View Membership
                  </Button>
                </div>
              </Card>

              {/* Card 2: Learning Progress */}
              <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Course Enrollment
                    </span>
                    <Badge variant="primary" size="sm">
                      {learningProgressPct}% Enrolled
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Enrolled</span>
                      <span className="text-xl font-black text-slate-900">{enrolledCoursesCount}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Available</span>
                      <span className="text-xl font-black text-slate-900">{totalCourses}</span>
                    </div>
                  </div>
                  <ProgressBar value={learningProgressPct} label="Curriculum Completion" color="primary" showValue={false} />
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Button variant="primary" size="sm" fullWidth onClick={() => onNavigate("courses")}>
                    Browse Courses
                  </Button>
                </div>
              </Card>

              {/* Card 3: Tasks */}
              <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Tasks &amp; Submissions
                    </span>
                    <Badge variant="secondary" size="sm">
                      {totalTasks - gradedTasksCount} Active Tasks
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                      <span className="text-[10px] text-amber-700 font-bold block">Awaiting</span>
                      <span className="text-lg font-black text-amber-900">{submittedTasksCount - gradedTasksCount}</span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-700 font-bold block">Graded</span>
                      <span className="text-lg font-black text-emerald-900">{gradedTasksCount}</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold block">Total</span>
                      <span className="text-lg font-black text-slate-900">{totalTasks}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Button variant="outline" size="sm" fullWidth onClick={() => onNavigate("tasks")}>
                    Manage Tasks
                  </Button>
                </div>
              </Card>

              {/* Card 4: Upcoming Events RSVP */}
              <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Live Schedule
                    </span>
                    <Badge variant="warning" size="sm">
                      Live Q&amp;A Scheduled
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Workshops
                    </h3>
                    <p className="text-xs text-slate-500">
                      View and RSVP to upcoming cohort sessions.
                    </p>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Button variant="outline" size="sm" fullWidth onClick={() => onNavigate("events")}>
                    Open Calendar
                  </Button>
                </div>
              </Card>
            </div>
          </section>

          {/* SECTION 2: QUICK ACCESS & UPCOMING EVENTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Quick Access Items */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Access Tools</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {quickAccessItems.map(item => (
                  <Card key={item.id} hoverEffect className="p-4 flex flex-col items-center justify-center text-center cursor-pointer border border-slate-200" onClick={() => onNavigate(item.id)}>
                    <div className="p-3 bg-slate-50 rounded-2xl mb-2">{item.icon}</div>
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Col: Live Workshops */}
            <div className="space-y-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Live Workshops</h2>
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-white border border-dashed rounded-2xl">
                    No upcoming masterclasses.
                  </div>
                ) : (
                  upcomingEvents.map(evt => (
                    <Card key={evt.id} className="p-4 border border-slate-200/80 bg-white flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cohort Session</h4>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{evt.title}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">{new Date(evt.start_time).toLocaleString()}</p>
                      </div>
                      <div className="pt-3 border-t mt-3 flex justify-end">
                        <Button variant="ghost" size="xs" onClick={() => onNavigate("events")} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                          RSVP Seats
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
