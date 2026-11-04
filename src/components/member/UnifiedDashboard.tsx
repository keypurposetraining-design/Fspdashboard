"use client";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/useAsync";
import { getMyProfile,getMyMemberships } from "@/lib/data/member";
import { currentMembership } from "@/components/member/workflow";
import { MembershipCard } from "@/components/member/MembershipCard";
import { MemberAvatar } from "@/components/member/MemberAvatar";
import { CoursesView } from "@/components/pages/CoursesView";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { enrollmentError } from "@/lib/data/enrollments";
import { DailyCourseProgress } from "@/components/member/DailyCourseProgress";
import { TodaysUpdates } from "@/components/member/TodaysUpdates";

async function loadMembership() {
  const profile = await getMyProfile();
  return { profile, memberships: profile ? await getMyMemberships(profile.id) : [] };
}
export function UnifiedDashboard() {
  const { user,role } = useAuth();
  const { data,error,loading,reload } = useAsync(loadMembership,[user?.id],Boolean(user));
  useEffect(() => { const timer = setInterval(() => { if (document.visibilityState !== 'hidden') reload(); },60000); return () => clearInterval(timer); },[reload]);
  const manager = role === "admin" || role === "super_admin";
  return <div className="space-y-8 font-sans"><header><h1 className="fsp-dot text-3xl font-semibold tracking-tight">FSP Dashboard</h1><p className="mt-2 text-sm text-[var(--muted)]">Your account, scheduled programs, and enrollments in one place.</p></header>
    <section className="space-y-4"><div className="flex items-center justify-between"><h2 className="fsp-dot text-xl font-bold">Membership Overview</h2><Button variant="outline" size="sm" disabled={loading} onClick={reload}>Refresh membership</Button></div><div className="grid items-start gap-5 md:grid-cols-2"><Card className="space-y-4 p-5"><div className="flex items-center gap-3"><MemberAvatar src={user?.avatar_url} name={user?.name ?? ""} size={56}/><div><h3 className="font-bold">{user?.name ?? "Your account"}</h3><p className="break-all text-sm">{user?.email}</p><p className="text-sm capitalize">{role?.replace("_"," ")}</p></div></div>{manager && <p className="text-sm text-[var(--muted)]">Administrator access is based on your account role. A personal paid membership is not required to manage enrollments.</p>}{error && <p role="alert" className="text-sm text-[var(--danger)]">{enrollmentError(error)}</p>}<DailyCourseProgress key={user?.id} memberId={data?.profile?.user_id === user?.id ? data?.profile?.id : undefined}/></Card>{loading && !data ? <Card className="p-5" role="status">Loading membership…</Card> : data ? <MembershipCard compact membership={currentMembership(data.memberships)} memberNumber={data.profile?.member_number} memberName={user?.name}/> : <Card className="p-5">Membership details unavailable.</Card>}</div></section>
    <CoursesView dashboard />
    <details className="rounded-xl border border-[var(--card-border)] p-4"><summary className="cursor-pointer font-semibold">Other FSP announcements</summary><TodaysUpdates announcementsOnly /></details>
  </div>;
}
