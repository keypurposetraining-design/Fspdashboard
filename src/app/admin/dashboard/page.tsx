"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BarChart2, Users, CreditCard, Calendar, Gift, Award, Clock, ArrowRight, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    pendingMemberships: 0,
    expiringMemberships: 0,
    totalCourses: 0,
    courseEnrollments: 0,
    upcomingEvents: 0,
    pendingPayments: 0,
    revenue: 0,
    certificatesIssued: 0,
  });
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<any[]>([]);
  const [recentMemberActivity, setRecentMemberActivity] = useState<any[]>([]);
  const [activityStats, setActivityStats] = useState({ activeToday: 0, loginsToday: 0, activitiesToday: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch counts & details
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [
          membersRes,
          membershipsRes,
          coursesRes,
          enrollmentsRes,
          eventsRes,
          paymentsRes,
          certificatesRes,
          submissionsRes,
          auditLogsRes,
          memberLogsRes,
          recentLogsRes
        ] = await Promise.all([
          supabase.from("members").select("id, created_at, first_name, last_name, user_id, users(email)"),
          supabase.from("memberships").select("id, status, end_date"),
          supabase.from("courses").select("id"),
          supabase.from("course_enrollments").select("id"),
          supabase.from("events").select("id, title, start_time, location").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(5),
          supabase.from("payments").select("id, amount, status, payment_date, members(first_name, last_name)"),
          supabase.from("certificates").select("id"),
          supabase.from("task_submissions").select("id, submitted_at, grade, tasks(title), members(first_name, last_name)").is("grade", null).order("submitted_at", { ascending: true }).limit(5),
          supabase.from("audit_logs").select("id, action, table_name, performed_at, performed_by, users(name)").order("performed_at", { ascending: false }).limit(5),
          supabase.from("member_activity_logs").select("action, member_id").gte("created_at", oneDayAgo),
          supabase.from("member_activity_logs").select("id, action, created_at, members(first_name, last_name)").order("created_at", { ascending: false }).limit(5)
        ]);

        if (membersRes.error) throw membersRes.error;
        if (membershipsRes.error) throw membershipsRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (enrollmentsRes.error) throw enrollmentsRes.error;
        if (eventsRes.error) throw eventsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;
        if (certificatesRes.error) throw certificatesRes.error;
        if (submissionsRes.error) throw submissionsRes.error;

        const allMembers = membersRes.data || [];
        const allMemberships = membershipsRes.data || [];
        const allPayments = paymentsRes.data || [];

        // Compute metrics
        const totalMembers = allMembers.length;
        const activeMembers = allMemberships.filter(m => m.status === "active").length;
        const pendingMemberships = allMemberships.filter(m => m.status === "pending").length;

        // Expiring memberships (next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const expiringMemberships = allMemberships.filter(m => {
          if (!m.end_date) return false;
          const end = new Date(m.end_date);
          return m.status === "active" && end > new Date() && end <= thirtyDaysFromNow;
        }).length;

        const totalCourses = (coursesRes.data || []).length;
        const courseEnrollments = (enrollmentsRes.data || []).length;
        const upcomingEventsCount = (eventsRes.data || []).length;
        const pendingPayments = allPayments.filter(p => p.status === "pending").length;
        const revenue = allPayments
          .filter(p => p.status === "succeeded")
          .reduce((sum, p) => sum + Number(p.amount), 0);
        const certificatesIssued = (certificatesRes.data || []).length;

        setStats({
          totalMembers,
          activeMembers,
          pendingMemberships,
          expiringMemberships,
          totalCourses,
          courseEnrollments,
          upcomingEvents: upcomingEventsCount,
          pendingPayments,
          revenue,
          certificatesIssued,
        });

        // Set list details
        setRecentMembers(allMembers.slice(-5).reverse());
        setRecentPayments(allPayments.slice(-5).reverse());
        setUpcomingEvents(eventsRes.data || []);
        setPendingSubmissions(submissionsRes.data || []);
        setRecentAuditLogs(auditLogsRes.data || []);

        // Compute activity metrics
        const logsList = memberLogsRes.data || [];
        const activeToday = new Set(logsList.map(l => l.member_id).filter(Boolean)).size;
        const loginsToday = logsList.filter(l => l.action === "AUTH_LOGIN").length;
        const activitiesToday = logsList.length;

        setActivityStats({ activeToday, loginsToday, activitiesToday });
        setRecentMemberActivity(recentLogsRes.data || []);
      } catch (err: any) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard statistics.");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0F4CFF] mx-auto"></div>
          <p className="text-slate-500 font-medium">Loading FSP metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 p-6 max-w-2xl mx-auto mt-10">
        <div className="flex gap-4">
          <ShieldAlert className="w-12 h-12 text-red-600 shrink-0" />
          <div className="space-y-2">
            <h3 className="font-bold text-red-800 text-lg">Failed to Load Admin Dashboard</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <p className="text-red-600 text-xs">Verify your environment variables and Supabase connection.</p>
            <Button variant="danger" size="sm" onClick={() => window.location.reload()} className="mt-2">
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER Banner */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <Badge variant="primary" size="sm" className="mb-1">Admin Dashboard Overview</Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">FSP Control Panel</h1>
          <p className="text-sm text-slate-500 font-medium">Real-time statistics & analytics database operations.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/members">
            <Button variant="outline" size="sm">Manage Members</Button>
          </Link>
          <Link href="/admin/reports">
            <Button size="sm">View Reports</Button>
          </Link>
        </div>
      </section>

      {/* STATISTICS CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard title="Total Members" value={stats.totalMembers} color="blue" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Active Members" value={stats.activeMembers} color="green" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Pending Memberships" value={stats.pendingMemberships} color="orange" icon={<CreditCard className="w-5 h-5" />} />
        <StatCard title="Expiring Memberships" value={stats.expiringMemberships} color="purple" icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Total Courses" value={stats.totalCourses} color="teal" icon={<BarChart2 className="w-5 h-5" />} />
        <StatCard title="Course Enrollments" value={stats.courseEnrollments} color="blue" icon={<BarChart2 className="w-5 h-5" />} />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents} color="green" icon={<Calendar className="w-5 h-5" />} />
        <StatCard title="Pending Payments" value={stats.pendingPayments} color="orange" icon={<CreditCard className="w-5 h-5" />} />
        <StatCard title="Revenue" value={`$${stats.revenue.toLocaleString()}`} color="purple" icon={<CreditCard className="w-5 h-5" />} />
        <StatCard title="Certificates Issued" value={stats.certificatesIssued} color="teal" icon={<Award className="w-5 h-5" />} />
        
        {/* Member activity additions */}
        <StatCard title="Active Members Today" value={activityStats.activeToday} color="blue" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Logins Today" value={activityStats.loginsToday} color="green" icon={<Clock className="w-5 h-5" />} />
        <StatCard title="Activities Today" value={activityStats.activitiesToday} color="purple" icon={<BarChart2 className="w-5 h-5" />} />
      </section>

      {/* TABLES AND DETAILS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Members */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-bold">Recent Members</CardTitle>
            <Link href="/admin/members" className="text-xs text-[#0F4CFF] hover:underline flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentMembers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No members registered yet.</p>
            ) : (
              <Table
                columns={[
                  { header: "Name", accessor: "name", render: (row) => `${row.first_name || ""} ${row.last_name || ""}` },
                  { header: "Email", accessor: "email", render: (row) => row.users?.email || "N/A" },
                  { header: "Joined Date", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleDateString() }
                ]}
                data={recentMembers}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-bold">Recent Payments</CardTitle>
            <Link href="/admin/payments" className="text-xs text-[#0F4CFF] hover:underline flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No payments processed yet.</p>
            ) : (
              <Table
                columns={[
                  { header: "Member", accessor: "member", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "N/A" },
                  { header: "Amount", accessor: "amount", render: (row) => `$${Number(row.amount).toFixed(2)}` },
                  { header: "Status", accessor: "status", render: (row) => (
                    <Badge variant={row.status === "succeeded" ? "success" : row.status === "pending" ? "warning" : "danger"}>
                      {row.status}
                    </Badge>
                  ) },
                  { header: "Date", accessor: "payment_date", render: (row) => new Date(row.payment_date).toLocaleDateString() }
                ]}
                data={recentPayments}
              />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-bold">Upcoming Events</CardTitle>
            <Link href="/admin/events" className="text-xs text-[#0F4CFF] hover:underline flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No upcoming events scheduled.</p>
            ) : (
              <Table
                columns={[
                  { header: "Event Title", accessor: "title" },
                  { header: "Location", accessor: "location" },
                  { header: "Date & Time", accessor: "start_time", render: (row) => new Date(row.start_time).toLocaleString() }
                ]}
                data={upcomingEvents}
              />
            )}
          </CardContent>
        </Card>

        {/* Pending Task Submissions */}
        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-bold">Pending Task Submissions</CardTitle>
            <Link href="/admin/tasks" className="text-xs text-[#0F4CFF] hover:underline flex items-center">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {pendingSubmissions.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">All submissions have been graded! 🎉</p>
            ) : (
              <Table
                columns={[
                  { header: "Member", accessor: "member", render: (row) => `${row.members?.first_name || ""} ${row.members?.last_name || ""}` },
                  { header: "Task", accessor: "task", render: (row) => row.tasks?.title || "N/A" },
                  { header: "Submitted At", accessor: "submitted_at", render: (row) => new Date(row.submitted_at).toLocaleDateString() }
                ]}
                data={pendingSubmissions}
              />
            )}
          </CardContent>
        </Card>

        {/* Recent Member Activity Logs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <CardTitle className="text-lg font-bold">Recent Member Activities</CardTitle>
            <Link href="/admin/member-logs" className="text-xs text-[#0F4CFF] hover:underline flex items-center">
              View All Activity Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentMemberActivity.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No member activity recorded today.</p>
            ) : (
              <Table
                columns={[
                  { header: "Member", accessor: "member", render: (row) => row.members ? `${row.members.first_name || ""} ${row.members.last_name || ""}` : "Anonymous" },
                  { header: "Action type", accessor: "action", render: (row) => <Badge>{row.action}</Badge> },
                  { header: "Timestamp", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleString() }
                ]}
                data={recentMemberActivity}
              />
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
