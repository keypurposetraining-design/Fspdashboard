import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, Filter, Search, FolderPlus, Upload, Download, Mail, Edit, CheckCircle, ArrowDown, Clock } from "lucide-react";
import {
  mockDashboardChallenges,
  mockDashboardTasks,
  mockLeaderboard,
  mockAchievementBadges,
  mockRemindersTimeline,
  mockRecentActivities,
  mockQuickActions,
} from "@/data/mockData";

// Additional dummy data specific to this page
const mockHabits = [
  { id: "hab-1", title: "Daily Reading", frequency: "Daily", targetDays: 30, participants: 124, completion: 78 },
  { id: "hab-2", title: "Daily Reflection", frequency: "Daily", targetDays: 30, participants: 98, completion: 85 },
  { id: "hab-3", title: "LinkedIn Posting", frequency: "Weekly", targetDays: 7, participants: 45, completion: 65 },
  { id: "hab-4", title: "Video Practice", frequency: "Daily", targetDays: 30, participants: 70, completion: 70 },
  { id: "hab-5", title: "Exercise", frequency: "Daily", targetDays: 30, participants: 150, completion: 82 },
  { id: "hab-6", title: "Networking", frequency: "Weekly", targetDays: 7, participants: 60, completion: 55 },
];

const mockAssignmentRules = [
  "Assign to All Members",
  "Assign by Batch",
  "Assign by Membership Plan",
  "Assign by Course Completion",
  "Assign by Level",
  "Assign Individually",
];

export default function TaskChallengeHabitPage() {
  const [tasks] = useState(mockDashboardTasks);
  const [habits] = useState(mockHabits);

  return (
    <main className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <section className="text-center">
        <h1 className="text-4xl font-bold text-primary">Task, Challenge &amp; Habit Management</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Create, assign, monitor, and automate member tasks, challenges, and habits from one central workspace.
        </p>
      </section>

      {/* Top Action Bar */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input placeholder="Search Task" className="max-w-sm" />
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
            <span className="flex items-center"><Plus className="w-4 h-4 mr-1" />Create Task</span>
          </Button>
          <Button variant="default" size="sm" asChild>
            <span className="flex items-center"><FolderPlus className="w-4 h-4 mr-1" />Create Challenge</span>
          </Button>
          <Button variant="default" size="sm" asChild>
            <span className="flex items-center"><Plus className="w-4 h-4 mr-1" />Create Habit</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Edit className="w-4 h-4 mr-1" />Assign to Members</span>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <span className="flex items-center"><Download className="w-4 h-4 mr-1" />Export Report</span>
          </Button>
        </div>
      </section>

      {/* Section 1 – Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Active Tasks" value="245" />
        <StatCard title="30-Day Challenges" value="82" />
        <StatCard title="21-Day Reading Challenges" value="46" />
        <StatCard title="Habits Being Tracked" value="318" />
        <StatCard title="Completion Rate" value="82%" />
        <StatCard title="Overdue Tasks" value="16" />
        <StatCard title="Weekly Streaks" value="96" />
        <StatCard title="Points Awarded" value="18,450" />
      </section>

      {/* Section 2 – Challenge Library */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Challenge Library</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockDashboardChallenges.map(ch => (
            <Card key={ch.id} className="p-4 flex flex-col">
              <h3 className="font-medium mb-2">{ch.title}</h3>
              <p className="text-sm text-muted-foreground"><strong>Status:</strong> {(ch.currentDays ?? 0) < (ch.totalDays ?? 0) ? "Active" : "Completed"}</p>
              <p className="text-sm text-muted-foreground"><strong>Participants:</strong> {ch.id === "ch-1" ? 128 : 84}</p>
              <p className="text-sm text-muted-foreground"><strong>Completion:</strong> {ch.id === "ch-1" ? "78%" : "71%"}</p>
              <div className="mt-3 flex space-x-2">
                <Button variant="outline" size="sm" asChild><span>View</span></Button>
                <Button variant="outline" size="sm" asChild><span>Edit</span></Button>
                <Button variant="outline" size="sm" asChild><span>Duplicate</span></Button>
                {ch.id === "ch-2" && (
                  <Button variant="outline" size="sm" asChild><span>Publish</span></Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 3 – Task Management Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Task Management</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Task Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Assigned To</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Status</th>
                <th className="p-3">Completion</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">{task.title}</td>
                  <td className="p-3">{task.category}</td>
                  <td className="p-3">—</td>
                  <td className="p-3">{task.dueDate}</td>
                  <td className="p-3">Medium</td>
                  <td className="p-3"><Badge>{task.status}</Badge></td>
                  <td className="p-3">—</td>
                  <td className="p-3 flex space-x-1">
                    <Button variant="ghost" size="sm" asChild><span>View</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Edit</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Assign</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Duplicate</span></Button>
                    <Button variant="ghost" size="sm" asChild><span>Delete</span></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 – Habit Tracker Builder */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Habit Tracker</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {habits.map(hab => (
            <Card key={hab.id} className="p-4 flex flex-col">
              <h3 className="font-medium mb-1">{hab.title}</h3>
              <p className="text-sm text-muted-foreground"><strong>Frequency:</strong> {hab.frequency}</p>
              <p className="text-sm text-muted-foreground"><strong>Target Days:</strong> {hab.targetDays}</p>
              <p className="text-sm text-muted-foreground"><strong>Participants:</strong> {hab.participants}</p>
              <p className="text-sm text-muted-foreground"><strong>Completion %:</strong> {hab.completion}%</p>
              <div className="mt-2 flex space-x-2">
                <Button variant="outline" size="sm" asChild><span>Edit</span></Button>
                <Button variant="outline" size="sm" asChild><span>Log</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 5 – Assignment Rules */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Assignment Rules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAssignmentRules.map((rule, i) => (
            <Card key={i} className="p-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-primary" />
              <span>{rule}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 6 – Reminder Automation */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Reminder Automation</h2>
        <div className="flex flex-col items-center space-y-2">
          {mockRemindersTimeline.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <span>{step.title || step.date}</span>
              </div>
              {idx < mockRemindersTimeline.length - 1 && (
                <ArrowDown className="w-4 h-4 text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
          <div className="flex space-x-4 mt-4">
            <Badge variant="outline">Dashboard</Badge>
            <Badge variant="outline">WhatsApp</Badge>
            <Badge variant="outline">Email</Badge>
          </div>
        </div>
      </section>

      {/* Section 7 – Leaderboard */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Member</th>
                <th className="p-3">Points</th>
                <th className="p-3">Current Streak</th>
                <th className="p-3">Challenges Completed</th>
                <th className="p-3">Badges</th>
              </tr>
            </thead>
            <tbody>
              {mockLeaderboard.map(m => (
                <tr key={m.rank} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">{m.rank}</td>
                  <td className="p-3 flex items-center space-x-2">
                    <img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full" />
                    <span>{m.name}</span>
                  </td>
                  <td className="p-3">{m.points}</td>
                  <td className="p-3">{m.rank === 1 ? "10 days" : "—"}</td>
                  <td className="p-3">{m.rank * 3}</td>
                  <td className="p-3">{m.badge || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 8 – Rewards & Badges */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Rewards &amp; Badges</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockAchievementBadges.map(badge => (
            <Card key={badge.id} className="p-4 flex flex-col items-center">
              <div className="text-4xl mb-2 text-primary">{badge.icon}</div>
              <p className="font-medium mb-1">{badge.title}</p>
              <p className="text-sm text-muted-foreground text-center">{badge.description}</p>
              <div className="mt-2 flex space-x-2">
                <Button variant="ghost" size="sm" asChild><span>Edit Badge</span></Button>
                <Button variant="ghost" size="sm" asChild><span>Create Badge</span></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 9 – Progress Analytics */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Progress Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {["Daily Completion", "Weekly Completion", "Monthly Completion", "Challenge Success Rate", "Habit Streaks"].map((label, i) => (
            <Card key={i} className="h-64 flex items-center justify-center bg-muted">
              <span className="text-muted-foreground">{label} (Chart Placeholder)</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 10 – Member Activity Feed */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Member Activity Feed</h2>
        <div className="space-y-2">
          {mockRecentActivities.map(act => (
            <Card key={act.id} className="p-3 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-primary" />
              <span>{act.title}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 11 – Quick Actions */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mockQuickActions.map((action, i) => (
            <Card key={i} className="p-4 flex flex-col items-center hover:shadow-lg transition-shadow">
              <Button variant="ghost" size="lg" asChild>
                <span className="flex flex-col items-center">
                  <span className="text-3xl mb-2 text-primary">{action.icon}</span>
                  {action.label}
                </span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 12 – AI Challenge Builder */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">AI Challenge Builder</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[{ label: "Generate 30-Day Challenge", icon: "Zap" },{ label: "Generate Habit Plan", icon: "Repeat" },{ label: "Generate Reflection Questions", icon: "MessageSquare" },{ label: "Generate Daily Tasks", icon: "Calendar" },{ label: "Generate Weekly Review", icon: "TrendingUp" },{ label: "Generate Motivation Messages", icon: "Star" },{ label: "Generate WhatsApp Reminder", icon: "Phone" },{ label: "Generate Celebration Message", icon: "ThumbsUp" }].map((opt, i) => (
            <Card key={i} className="p-4 flex flex-col items-center">
              <Button variant="ghost" size="lg" asChild>
                <span className="flex flex-col items-center">
                  <span className="text-3xl mb-2 text-primary">{opt.icon}</span>
                  {opt.label}
                </span>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 13 – Empty State */}
      {mockDashboardChallenges.length === 0 && (
        <section className="text-center py-12">
          <p className="text-xl mb-4">No active challenges available.</p>
          <Button size="lg" asChild>
            <span className="flex items-center"><Plus className="w-5 h-5 mr-2" />Create First Challenge</span>
          </Button>
        </section>
      )}
    </main>
  );
}
