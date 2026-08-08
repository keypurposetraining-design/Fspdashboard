import React, { useState } from "react";
import {
  mockUser,
  mockCategorizedTasks,
  mockAchievementBadges,
  mockLeaderboard,
  mockTaskHistoryTable,
  mockRemindersTimeline,
  TaskCategoryItem,
} from "@/data/mockData";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  Lock,
  Flame,
  Trophy,
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  Medal,
  PlayCircle,
  Upload,
  Download,
  MessageSquare,
  Rocket,
  Star,
  Quote,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";

export const TasksView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [taskList, setTaskList] = useState<TaskCategoryItem[]>(mockCategorizedTasks);

  // Category Tabs Filter
  const categories = ["All", "Learning", "Marketing", "Practice", "Reading", "Community", "Certification"];

  const filteredTasks = taskList.filter((t) => {
    if (selectedCategory === "All") return true;
    return t.category === selectedCategory;
  });

  const toggleTaskComplete = (taskId: string) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: t.status === "Completed" ? "Pending" : "Completed" } : t))
    );
  };

  // Horizontal Journey Steps for Section 2
  const roadmapSteps = [
    { title: "Explorer", status: "completed" },
    { title: "Foundation Facilitator", status: "completed" },
    { title: "Level 1 Completed ✅", status: "completed" },
    { title: "Level 2 In Progress 🔄", status: "current" },
    { title: "Level 3 Locked 🔒", status: "upcoming" },
    { title: "Certified Facilitator", status: "upcoming" },
  ];

  // Quick Actions list for Section 10
  const quickActions = [
    { label: "Start Today's Task", icon: <PlayCircle className="w-5 h-5 text-[#0F4CFF]" /> },
    { label: "Continue Challenge", icon: <Flame className="w-5 h-5 text-[#FF7A00]" /> },
    { label: "View Reading Journal", icon: <BookOpen className="w-5 h-5 text-purple-600" /> },
    { label: "Upload Proof", icon: <Upload className="w-5 h-5 text-emerald-600" /> },
    { label: "Download Workbook", icon: <Download className="w-5 h-5 text-indigo-600" /> },
    { label: "Contact Mentor", icon: <MessageSquare className="w-5 h-5 text-teal-600" /> },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-200 pb-12">
      {/* ---------------------------------------------------- */}
      {/* PAGE HEADER                                          */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              GAMIFIED LEARNING HUB
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Streak: {mockUser.stats.currentStreakDays} Days 🔥</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tasks & Challenges
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete your daily activities, finish your challenges, and move closer to becoming a Certified Facilitator.
          </p>
        </div>

        <Button variant="primary" size="md" icon={<PlayCircle className="w-4 h-4" />}>
          Start Next Activity
        </Button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: PROGRESS OVERVIEW (4 SUMMARY CARDS)        */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Progress Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Overall Progress (Circular SVG Ring) */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Overall Progress
                </span>
                <span className="text-3xl font-black text-slate-900">72%</span>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Level 2 Progress</p>
              </div>

              {/* Circular SVG Ring */}
              <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#0F4CFF] stroke-current"
                    strokeWidth="4"
                    strokeDasharray="72, 100"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-black text-[#0F4CFF]">72%</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Completed Tasks */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Completed Tasks
                </span>
                <span className="text-3xl font-black text-slate-900">18</span>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">✓ 100% Validated</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Card 3: Pending Tasks */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Pending Tasks
                </span>
                <span className="text-3xl font-black text-slate-900">5</span>
                <p className="text-[11px] text-amber-600 font-bold mt-0.5">2 Due this week</p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </Card>

          {/* Card 4: Current Streak */}
          <Card hoverEffect className="flex flex-col justify-between border-slate-200/90 bg-gradient-to-br from-orange-50/50 to-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Current Streak
                </span>
                <span className="text-3xl font-black text-[#FF7A00]">12 Days 🔥</span>
                <p className="text-[11px] text-orange-600 font-bold mt-0.5">Top 5% Consistency</p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-[#FF7A00] border border-orange-200 animate-pulse">
                <Flame className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: JOURNEY PROGRESS (HORIZONTAL ROADMAP)      */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Journey Progress
          </h2>
          <p className="text-xs text-slate-500">
            Your step-by-step facilitation certification roadmap.
          </p>
        </div>

        <Card>
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 relative">
              {roadmapSteps.map((step, idx) => {
                const isCompleted = step.status === "completed";
                const isCurrent = step.status === "current";

                return (
                  <div
                    key={idx}
                    className={clsx(
                      "p-3.5 rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center space-y-2 relative",
                      isCurrent
                        ? "bg-gradient-to-b from-orange-50 to-white border-orange-300 shadow-md ring-2 ring-orange-400/20"
                        : isCompleted
                        ? "bg-blue-50/50 border-blue-200 text-slate-800"
                        : "bg-slate-50/60 border-slate-200/60 opacity-60"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                        isCompleted
                          ? "bg-[#0F4CFF] text-white"
                          : isCurrent
                          ? "bg-[#FF7A00] text-white animate-bounce"
                          : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : isCurrent ? (
                        <Flame className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <h4
                      className={clsx(
                        "text-xs font-bold tracking-tight leading-snug",
                        isCurrent ? "text-[#FF7A00]" : "text-slate-900"
                      )}
                    >
                      {step.title}
                    </h4>

                    {isCurrent && (
                      <span className="text-[9px] font-extrabold uppercase bg-orange-100 text-[#FF7A00] px-2 py-0.5 rounded-full">
                        ACTIVE STAGE
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: ACTIVE CHALLENGES                          */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Active Challenges
            </h2>
            <p className="text-xs text-slate-500">
              Interactive gamified challenges to build daily practice habits.
            </p>
          </div>
          <Badge variant="secondary" size="sm">
            2 Challenges Active
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Challenge Card 1 */}
          <Card gradientBorder hoverEffect className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="primary" size="sm" dot>
                    In Progress
                  </Badge>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
                    30-Day Facilitator Challenge
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Daily practical workshop reflections & team exercises.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 text-[#0F4CFF]">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span>Progress</span>
                <span className="text-sm font-black text-slate-900">18 / 30 Days</span>
              </div>

              <ProgressBar value={60} color="primary" showValue={false} />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button variant="primary" size="sm" fullWidth icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Continue Challenge
              </Button>
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </div>
          </Card>

          {/* Challenge Card 2 */}
          <Card gradientBorder hoverEffect className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" size="sm">
                    August Challenge
                  </Badge>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
                    21-Day Book Reading Challenge
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Read 15 mins daily from top facilitation field guides.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-orange-50 text-[#FF7A00]">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span>Progress</span>
                <span className="text-sm font-black text-slate-900">10 / 21 Days</span>
              </div>

              <ProgressBar value={47} color="secondary" showValue={false} />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button variant="secondary" size="sm" fullWidth icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Continue Reading
              </Button>
              <Button variant="outline" size="sm">
                Reading Journal
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: TASK CATEGORIES (FILTER TABS UI)           */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Task Categories
            </h2>
            <p className="text-xs text-slate-500">
              Filter activities by area of focus.
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={clsx(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  selectedCategory === cat
                    ? "bg-[#0F4CFF] text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* SECTION 4: TODAY'S TASKS (FILTERED CARDS)            */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = task.status === "Completed";

            return (
              <Card
                key={task.id}
                hoverEffect
                className={clsx(
                  "flex flex-col justify-between space-y-4 transition-all",
                  isCompleted && "bg-slate-50 border-slate-200 opacity-80"
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            task.priority === "High"
                              ? "danger"
                              : task.priority === "Medium"
                              ? "warning"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {task.priority} Priority
                        </Badge>
                        <Badge variant="primary" size="sm">
                          {task.category}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 tracking-tight">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {task.points && (
                      <span className="text-xs font-black text-[#FF7A00] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200 shrink-0">
                        +{task.points} pts
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold pt-1">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Due: {task.dueDate}
                      </span>
                    )}
                    <Badge
                      variant={
                        task.status === "Completed"
                          ? "success"
                          : task.status === "In Progress"
                          ? "primary"
                          : "warning"
                      }
                      size="sm"
                      dot={task.status === "In Progress"}
                    >
                      {task.status}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button
                    variant={isCompleted ? "soft" : "primary"}
                    size="sm"
                    fullWidth
                    onClick={() => toggleTaskComplete(task.id)}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    {isCompleted ? "Mark Pending" : "Mark Complete"}
                  </Button>
                  {!isCompleted && (
                    <Button variant="outline" size="sm">
                      Start Task
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: ACHIEVEMENT BADGES                        */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Achievement Badges
          </h2>
          <p className="text-xs text-slate-500">
            Earn badges as you hit major milestone achievements.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {mockAchievementBadges.map((badge) => (
            <Card
              key={badge.id}
              hoverEffect
              className={clsx(
                "p-4 flex flex-col items-center justify-center text-center space-y-2 relative transition-all",
                badge.unlocked
                  ? "bg-white border-slate-200 shadow-xs"
                  : "bg-slate-100/60 border-slate-200/60 opacity-50 grayscale cursor-not-allowed"
              )}
            >
              <div
                className={clsx(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shadow-xs",
                  badge.unlocked
                    ? "bg-gradient-to-tr from-[#0F4CFF] to-blue-600 text-white"
                    : "bg-slate-200 text-slate-400"
                )}
              >
                {badge.unlocked ? <Trophy className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
              </div>

              <h4 className="text-xs font-bold text-slate-900 leading-tight">
                {badge.title}
              </h4>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                {badge.description}
              </p>

              {badge.unlocked ? (
                <span className="text-[9px] font-extrabold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                  UNLOCKED
                </span>
              ) : (
                <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-200 px-2 py-0.5 rounded-full">
                  LOCKED
                </span>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: LEADERBOARD & SECTION 9: MOTIVATION CARDS  */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section 7: Leaderboard (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Monthly Leaderboard
              </h2>
              <p className="text-xs text-slate-500">
                Top active community members for August 2026.
              </p>
            </div>
            <Badge variant="pro" size="sm">
              AUGUST RANKINGS
            </Badge>
          </div>

          <Card>
            <div className="divide-y divide-slate-100">
              {mockLeaderboard.map((member) => (
                <div
                  key={member.rank}
                  className={clsx(
                    "p-4 flex items-center justify-between gap-4 transition-colors",
                    member.isCurrentUser
                      ? "bg-blue-50/70 border-l-4 border-[#0F4CFF]"
                      : "hover:bg-slate-50/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge / Medal */}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0">
                      {member.rank === 1 ? (
                        <span className="text-2xl" title="Gold Medal">🥇</span>
                      ) : member.rank === 2 ? (
                        <span className="text-2xl" title="Silver Medal">🥈</span>
                      ) : member.rank === 3 ? (
                        <span className="text-2xl" title="Bronze Medal">🥉</span>
                      ) : (
                        <span className="text-slate-500 font-bold text-xs">#{member.rank}</span>
                      )}
                    </div>

                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {member.name}
                        </h4>
                        {member.isCurrentUser && (
                          <Badge variant="pro" size="sm">
                            YOU
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">{member.badge}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">
                      {member.points}
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold block">Points</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Section 9: Motivation Section (1 col) */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Daily Motivation
          </h2>

          <Card gradientBorder className="bg-gradient-to-br from-blue-900 to-slate-900 text-white border-0 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <Quote className="w-10 h-10 text-blue-400 opacity-80" />
              <blockquote className="text-lg font-extrabold text-white leading-snug tracking-tight">
                "Small daily progress creates remarkable results."
              </blockquote>
              <p className="text-xs text-blue-200">
                You have completed <strong className="text-white">75%</strong> of today's learning goal.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-2">
              <ProgressBar value={75} label="Today's Target Progress" color="secondary" showValue />
            </div>
          </Card>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SECTION 8: TASK HISTORY (TABLE)                       */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Task History
          </h2>
          <p className="text-xs text-slate-500">
            Log of completed learning activities and earned points.
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                    <th className="p-4">Task Name</th>
                    <th className="p-4">Completed Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Points Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mockTaskHistoryTable.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{item.taskName}</td>
                      <td className="p-4 text-slate-600">{item.completedDate}</td>
                      <td className="p-4">
                        <Badge variant="success" size="sm" dot>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-extrabold text-[#FF7A00]">
                        +{item.pointsEarned}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 10: QUICK ACTIONS                             */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Quick Actions
          </h2>
          <p className="text-xs text-slate-500">
            Fast shortcuts to your primary activity tools.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((qa, idx) => (
            <button
              key={idx}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col items-center justify-center text-center space-y-2.5 group cursor-pointer"
            >
              <div className="p-3.5 rounded-2xl bg-slate-50 group-hover:bg-blue-50 transition-colors">
                {qa.icon}
              </div>
              <span className="text-xs font-bold text-slate-800 group-hover:text-[#0F4CFF] transition-colors leading-tight">
                {qa.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 11: REMINDER TIMELINE                        */}
      {/* ---------------------------------------------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Reminder Timeline
          </h2>
          <p className="text-xs text-slate-500">
            Upcoming activity deadlines and milestone dates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockRemindersTimeline.map((rem) => (
            <Card key={rem.id} hoverEffect className="p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0F4CFF] flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#FF7A00] uppercase tracking-wider block">
                  {rem.date}
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-tight">
                  {rem.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium">
                  {rem.category}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};
