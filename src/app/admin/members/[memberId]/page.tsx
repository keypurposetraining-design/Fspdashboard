"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table } from "@/components/ui/Table";
import {
  ArrowLeft,
  User,
  Calendar,
  Activity,
  Award,
  BookOpen,
  Flag,
  CreditCard,
  Eye,
  RefreshCcw,
  CheckCircle
} from "lucide-react";

export default function AdminMemberDetail() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const memberId = params.memberId as string;

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);

  // Summary Metrics
  const [lastLogin, setLastLogin] = useState<string>("Never");
  const [lastActivity, setLastActivity] = useState<string>("Never");
  const [totalActivities, setTotalActivities] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [tasksSubmitted, setTasksSubmitted] = useState(0);
  const [eventsRegistered, setEventsRegistered] = useState(0);
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [certsViewed, setCertsViewed] = useState(0);

  // Member Logs State
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    if (memberId) {
      fetchMemberDetails();
    }
  }, [memberId]);

  async function fetchMemberDetails() {
    try {
      setLoading(true);

      // Fetch base member and user profiles
      const { data: memberData, error: memberErr } = await supabase
        .from("members")
        .select(`
          *,
          users (
            email,
            name,
            role
          )
        `)
        .eq("id", memberId)
        .maybeSingle();

      if (memberErr) throw memberErr;
      if (!memberData) {
        alert("Member profile not found");
        router.push("/admin/members");
        return;
      }
      setMember(memberData);

      // Fetch counts dynamically using Promise.all
      const [
        enrollCountRes,
        tasksRes,
        eventsRes,
        paymentsRes,
        logsCountRes,
        lastLoginRes,
        lastActRes,
        certsViewedRes,
        logsListRes
      ] = await Promise.all([
        supabase.from("course_enrollments").select("id", { count: "exact", head: true }).eq("member_id", memberId),
        supabase.from("task_submissions").select("id", { count: "exact", head: true }).eq("member_id", memberId),
        supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("member_id", memberId).eq("status", "registered"),
        supabase.from("payments").select("id", { count: "exact", head: true }).eq("member_id", memberId),
        supabase.from("member_activity_logs").select("id", { count: "exact", head: true }).eq("member_id", memberId),
        supabase.from("member_activity_logs").select("created_at").eq("member_id", memberId).eq("action", "AUTH_LOGIN").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("member_activity_logs").select("created_at").eq("member_id", memberId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("member_activity_logs").select("id", { count: "exact", head: true }).eq("member_id", memberId).eq("action", "CERTIFICATE_VIEW"),
        supabase.from("member_activity_logs").select("*").eq("member_id", memberId).order("created_at", { ascending: false }).limit(20)
      ]);

      setEnrolledCount(enrollCountRes.count || 0);
      setTasksSubmitted(tasksRes.count || 0);
      setEventsRegistered(eventsRes.count || 0);
      setPaymentsCount(paymentsRes.count || 0);
      setTotalActivities(logsCountRes.count || 0);
      
      if (lastLoginRes.data) {
        setLastLogin(new Date(lastLoginRes.data.created_at).toLocaleString());
      }
      if (lastActRes.data) {
        setLastActivity(new Date(lastActRes.data.created_at).toLocaleString());
      }
      setCertsViewed(certsViewedRes.count || 0);
      setLogs(logsListRes.data || []);

    } catch (err: any) {
      console.error("Error loading member detail tabs:", err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !member) {
    return (
      <div className="py-12 text-center text-slate-500 font-medium">
        Loading member record detail...
      </div>
    );
  }

  if (!member) {
    return (
      <div className="py-12 text-center text-slate-500 font-medium">
        Member record could not be loaded. It may have been deleted or you may not have permission to view it.
      </div>
    );
  }

  const name = `${member.first_name || ""} ${member.last_name || ""}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 pb-12">
      {/* Back link */}
      <div>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin/members")} icon={<ArrowLeft className="w-4 h-4" />}>
          Back to Members list
        </Button>
      </div>

      {/* Header card info */}
      <Card className="p-6 bg-white border border-slate-200 rounded-3xl">
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-black text-xl">
              {member.first_name?.[0]}{member.last_name?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{name}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{member.users?.email || "—"}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="neutral">{member.users?.role || "MEMBER"}</Badge>
                <span className="text-[11px] text-slate-400 font-bold">Joined: {new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMemberDetails} icon={<RefreshCcw className="w-4 h-4" />}>
            Refresh stats
          </Button>
        </div>
      </Card>

      {/* Activity Summary Cards */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Activity Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Last Login</span>
            <span className="text-sm font-black text-slate-900 mt-1 block truncate" title={lastLogin}>{lastLogin}</span>
          </Card>
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Last Activity</span>
            <span className="text-sm font-black text-slate-900 mt-1 block truncate" title={lastActivity}>{lastActivity}</span>
          </Card>
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Total Activities</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">{totalActivities}</span>
          </Card>
          <Card className="p-4 bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">Certificates Viewed</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">{certsViewed}</span>
          </Card>
        </div>
      </section>

      {/* Numerical Metrics Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Courses Enrolled</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{enrolledCount}</span>
          </div>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><BookOpen className="w-5 h-5" /></div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Tasks Submitted</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{tasksSubmitted}</span>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><Flag className="w-5 h-5" /></div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Events RSVP'd</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{eventsRegistered}</span>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Renewal Invoices</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{paymentsCount}</span>
          </div>
          <div className="p-2 bg-blue-50 text-[#0F4CFF] rounded-xl"><CreditCard className="w-5 h-5" /></div>
        </Card>
      </section>

      {/* Member Activity Logs Tab */}
      <Card className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <CardHeader className="border-b">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Recent Activity Logs (Last 20)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No activity logged for this member.</div>
          ) : (
            <Table
              columns={[
                {
                  header: "Action Type",
                  accessor: "action",
                  render: (log: any) => (
                    <Badge variant={log.action.includes("FAILED") ? "danger" : "primary"}>
                      {log.action}
                    </Badge>
                  )
                },
                {
                  header: "Client IP",
                  accessor: "ip_address",
                  render: (log: any) => <span className="font-mono text-[10px] text-slate-500">{log.ip_address || "—"}</span>
                },
                {
                  header: "Date / Time",
                  accessor: "created_at",
                  render: (log: any) => new Date(log.created_at).toLocaleString()
                },
                {
                  header: "Metadata Payload",
                  accessor: "metadata",
                  render: (log: any) => (
                    <span className="font-mono text-[9px] text-slate-500 max-w-xs block truncate" title={JSON.stringify(log.metadata)}>
                      {JSON.stringify(log.metadata)}
                    </span>
                  )
                }
              ]}
              data={logs}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
