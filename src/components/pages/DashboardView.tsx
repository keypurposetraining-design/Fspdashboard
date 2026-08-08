import React from "react";
import {
  mockUser,
  mockDashboardChallenges,
  mockDashboardTasks,
  mockDashboardEvents,
  mockAnnouncements,
  mockRecentActivities,
} from "@/data/mockData";
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
  Bell,
  CreditCard,
  Award,
  Users,
  FolderDown,
  User,
  Flame,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  PlayCircle,
} from "lucide-react";
import { clsx } from "clsx";

export interface DashboardViewProps {
  onNavigate: (tabId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  // Timeline Stages for Section 2: My Journey
  const journeyStages = [
    { title: "Explorer", status: "completed", desc: "Joined FSP & orientation completed" },
    { title: "Level 1 Completed", status: "completed", desc: "Foundations of Facilitation" },
    { title: "Level 2 Completed", status: "completed", desc: "Interactive Workshop Design" },
    {
      title: "Level 3 In Progress",
      status: "current",
      desc: "Executive De-Escalation & Group Dynamics",
      progress: 75,
    },
    { title: "Certified Facilitator", status: "upcoming", desc: "Final Capstone Assessment" },
    { title: "Master Facilitator", status: "upcoming", desc: "Guild Leadership & Accreditation" },
  ];

  // Quick Access 8 items
  const quickAccessItems = [
    { id: "membership", label: "My Membership", icon: <UserCheck className="w-5 h-5 text-[#0F4CFF]" /> },
    { id: "tasks", label: "Courses", icon: <BookOpen className="w-5 h-5 text-purple-600" /> },
    { id: "tasks", label: "Tasks", icon: <CheckSquare className="w-5 h-5 text-emerald-600" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-5 h-5 text-[#FF7A00]" /> },
    { id: "certificates", label: "Certificates", icon: <Award className="w-5 h-5 text-amber-500" /> },
    { id: "community", label: "Community", icon: <Users className="w-5 h-5 text-blue-600" /> },
    { id: "dashboard", label: "Resources", icon: <FolderDown className="w-5 h-5 text-teal-600" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5 text-indigo-600" /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-200 pb-12">
      {/* ---------------------------------------------------- */}
      {/* PAGE TITLE & WELCOME BANNER                          */}
      {/* ---------------------------------------------------- */}
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
            Good Morning, Karunai 👋
          </h1>
          <p className="text-sm sm:text-base text-blue-100 font-medium">
            Welcome back to your FSP learning journey.
          </p>
        </div>

        <div className="z-10 flex items-center gap-3 w-full md:w-auto pt-2 md:pt-0">
          <Button
            variant="secondary"
            size="md"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => onNavigate("tasks")}
          >
            Continue Learning
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: FOUR SUMMARY CARDS                         */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Overview & Status Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Membership Status */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Membership Status
                </span>
                <Badge variant="success" size="sm" dot>
                  Active
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Annual Membership
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Valid Until: <strong className="text-slate-800">31 July 2027</strong>
                </p>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-xs text-slate-700 flex items-center justify-between">
                <span className="font-semibold text-slate-600">Remaining Days</span>
                <span className="font-extrabold text-[#0F4CFF]">360 Days</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() => onNavigate("membership")}
              >
                View Membership
              </Button>
            </div>
          </Card>

          {/* Card 2: Learning Progress */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Learning Progress
                </span>
                <Badge variant="primary" size="sm">
                  65% Done
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Completed
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {mockUser.stats.completedCourses}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Available
                  </span>
                  <span className="text-xl font-black text-slate-900">
                    {mockUser.stats.availableCourses}
                  </span>
                </div>
              </div>

              <ProgressBar value={65} label="Curriculum Completion" color="primary" showValue={false} />
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                fullWidth
                icon={<PlayCircle className="w-3.5 h-3.5" />}
                onClick={() => onNavigate("tasks")}
              >
                Continue Learning
              </Button>
            </div>
          </Card>

          {/* Card 3: Tasks */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tasks Overview
                </span>
                <Badge variant="secondary" size="sm">
                  4 Action Items
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-bold block">Pending</span>
                  <span className="text-lg font-black text-amber-900">4</span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block">Done</span>
                  <span className="text-lg font-black text-emerald-900">18</span>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-100">
                  <span className="text-[10px] text-rose-700 font-bold block">Overdue</span>
                  <span className="text-lg font-black text-rose-900">1</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                icon={<CheckSquare className="w-3.5 h-3.5" />}
                onClick={() => onNavigate("tasks")}
              >
                View Tasks
              </Button>
            </div>
          </Card>

          {/* Card 4: Upcoming Event */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Upcoming Event
                </span>
                <Badge variant="warning" size="sm" dot>
                  Live
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  FSP Catalyst Connect
                </h3>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#FF7A00] pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>16 August • 7 PM</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                icon={<Calendar className="w-3.5 h-3.5" />}
                onClick={() => onNavigate("events")}
              >
                Join Event
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: MY JOURNEY (VERTICAL PROGRESS TIMELINE)   */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              My Journey
            </h2>
            <p className="text-xs text-slate-500">
              Your official Facilitator Support Program mastery progression road.
            </p>
          </div>
          <Badge variant="pro" size="sm">
            LEVEL 3 ACTIVE
          </Badge>
        </div>

        <Card gradientBorder>
          <div className="relative py-4 px-2 sm:px-6">
            <div className="space-y-6 relative">
              {journeyStages.map((stage, idx) => {
                const isCompleted = stage.status === "completed";
                const isCurrent = stage.status === "current";
                const isLast = idx === journeyStages.length - 1;

                return (
                  <div key={idx} className="relative flex items-start gap-4 sm:gap-6 group">
                    {/* Connecting Line */}
                    {!isLast && (
                      <div
                        className={clsx(
                          "absolute left-4 sm:left-5 top-10 bottom-0 w-0.5 -ml-px transition-colors",
                          isCompleted ? "bg-[#0F4CFF]" : "bg-slate-200"
                        )}
                      />
                    )}

                    {/* Timeline Node Icon */}
                    <div
                      className={clsx(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 transition-all duration-300",
                        isCompleted
                          ? "bg-[#0F4CFF] text-white ring-4 ring-blue-100 shadow-sm"
                          : isCurrent
                          ? "bg-[#FF7A00] text-white ring-4 ring-orange-200 shadow-md animate-bounce"
                          : "bg-slate-100 text-slate-400 border border-slate-300"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <Flame className="w-5 h-5 text-white" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {/* Timeline Card Info */}
                    <div
                      className={clsx(
                        "flex-1 p-4 rounded-2xl border transition-all duration-200",
                        isCurrent
                          ? "bg-gradient-to-r from-orange-50/80 to-white border-orange-300 shadow-md ring-1 ring-orange-400/30"
                          : isCompleted
                          ? "bg-white border-slate-200 hover:border-blue-200"
                          : "bg-slate-50/60 border-slate-200/60 opacity-60"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h4
                          className={clsx(
                            "text-sm sm:text-base font-bold tracking-tight",
                            isCurrent ? "text-[#FF7A00]" : "text-slate-900"
                          )}
                        >
                          {stage.title}
                        </h4>
                        {isCurrent && (
                          <Badge variant="secondary" size="sm" dot>
                            CURRENT STAGE IN PROGRESS
                          </Badge>
                        )}
                        {isCompleted && (
                          <Badge variant="success" size="sm">
                            COMPLETED
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {stage.desc}
                      </p>

                      {isCurrent && stage.progress && (
                        <div className="mt-3 pt-2 border-t border-orange-200/60">
                          <ProgressBar
                            value={stage.progress}
                            label="Stage Completion Progress"
                            color="secondary"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: ACTIVE CHALLENGES (CARDS)                  */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Active Challenges
            </h2>
            <p className="text-xs text-slate-500">
              Boost your momentum with guided facilitation challenges.
            </p>
          </div>
          <Badge variant="secondary" size="sm">
            2 Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockDashboardChallenges.map((ch) => {
            const pct = Math.round((ch.currentDays / ch.totalDays) * 100);

            return (
              <Card key={ch.id} hoverEffect className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                        {ch.title}
                      </h3>
                      {ch.subtitle && (
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {ch.subtitle}
                        </p>
                      )}
                    </div>
                    {ch.month && (
                      <Badge variant="primary" size="sm">
                        {ch.month}
                      </Badge>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">Progress</span>
                    <span className="font-black text-slate-900 text-sm">
                      {ch.currentDays} / {ch.totalDays} Days
                    </span>
                  </div>

                  <ProgressBar value={pct} color="secondary" showValue />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={() => onNavigate("tasks")}
                  >
                    Continue
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: TODAY'S TASKS                             */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Today's Tasks
            </h2>
            <p className="text-xs text-slate-500">
              Action items requiring your attention today.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => onNavigate("tasks")}
          >
            View All Tasks
          </Button>
        </div>

        <div className="space-y-3">
          {mockDashboardTasks.map((task) => (
            <Card
              key={task.id}
              hoverEffect
              className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 p-2 rounded-xl bg-blue-50 text-[#0F4CFF] border border-blue-100">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                    {task.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-snug">
                    {task.description}
                  </p>
                  {task.dueDate && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {task.dueDate}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                <Badge
                  variant={
                    task.status === "pending"
                      ? "warning"
                      : task.status === "in-progress"
                      ? "primary"
                      : "neutral"
                  }
                  size="sm"
                  dot={task.status === "in-progress"}
                >
                  {task.status === "pending"
                    ? "Pending"
                    : task.status === "in-progress"
                    ? "In Progress"
                    : "Upcoming"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => onNavigate("tasks")}>
                  Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: UPCOMING EVENTS                            */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Upcoming Events
            </h2>
            <p className="text-xs text-slate-500">
              Live sessions, masterclasses, and community meetups.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronRight className="w-4 h-4" />}
            onClick={() => onNavigate("events")}
          >
            Full Calendar
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {mockDashboardEvents.map((evt) => (
            <Card key={evt.id} hoverEffect className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-b from-[#0F4CFF] to-blue-700 text-white flex flex-col items-center justify-center font-black text-sm shadow-xs">
                    <span className="text-[10px] text-blue-200 uppercase leading-none">
                      {evt.date.split(" ")[1] || "AUG"}
                    </span>
                    <span>{evt.date.split(" ")[0]}</span>
                  </div>
                  {evt.status && (
                    <Badge variant="secondary" size="sm">
                      {evt.status}
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {evt.title}
                  </h3>
                  {evt.time && (
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Time: {evt.time}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Button
                  variant={evt.actionText === "Join" || evt.actionText === "Join Event" ? "primary" : "outline"}
                  size="sm"
                  fullWidth
                  onClick={() => onNavigate("events")}
                >
                  {evt.actionText}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: ANNOUNCEMENTS                             */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Announcements
            </h2>
            <p className="text-xs text-slate-500">
              Official FSP updates, resource releases, and alerts.
            </p>
          </div>
          <Badge variant="neutral" size="sm">
            3 Updates
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mockAnnouncements.map((ann) => (
            <Card key={ann.id} hoverEffect className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    ann.type === "resource"
                      ? "primary"
                      : ann.type === "course"
                      ? "secondary"
                      : "neutral"
                  }
                  size="sm"
                  dot={ann.isNew}
                >
                  {ann.type.toUpperCase()}
                </Badge>
                <span className="text-[11px] text-slate-400 font-medium">
                  {ann.date}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {ann.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: QUICK ACCESS (ICON CARDS GRID)             */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Quick Access
          </h2>
          <p className="text-xs text-slate-500">
            Fast shortcuts to your primary FSP hub tools.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {quickAccessItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate(item.id)}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2 group cursor-pointer"
            >
              <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
                {item.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F4CFF] transition-colors leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 8: RECENT ACTIVITY (TIMELINE)                */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Recent Activity
          </h2>
          <p className="text-xs text-slate-500">
            Log of your recent interactions and platform milestones.
          </p>
        </div>

        <Card>
          <div className="divide-y divide-slate-100">
            {mockRecentActivities.map((act) => (
              <div
                key={act.id}
                className="py-3.5 px-2 flex items-center justify-between gap-4 hover:bg-slate-50/60 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0F4CFF] shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {act.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {act.timestamp}
                    </span>
                  </div>
                </div>
                <Badge variant="neutral" size="sm">
                  Logged
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};
